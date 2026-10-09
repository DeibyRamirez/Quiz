import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PEDAGOGICAL_PROMPT } from "./quiz-engine.prompt";
import { quizGeneradoIaSchema } from "@/lib/server/validators/quiz-ia";
import type { QuizGeneradoIaValidado } from "@/lib/server/validators/quiz-ia";

function normalizarQuizGeneradoIa(
  data: QuizGeneradoIaValidado
): QuizGeneradoIaValidado {
  return {
    ...data,
    questions: data.questions.map((q) => {
      if (q.type !== "open_text") return q;
      const expected = (
        q.expectedAnswer ??
        q.evaluationCriteria ??
        ""
      ).trim();
      return { ...q, expectedAnswer: expected };
    }),
  };
}

export class ErrorClienteIa extends Error {
  constructor(
    message: string,
    public status: number = 502
  ) {
    super(message);
    this.name = "ErrorClienteIa";
  }
}

function interpretarErrorProveedorIa(mensaje: string): string {
  const normalizado = mensaje.toLowerCase();
  if (
    normalizado.includes("billing_disabled") ||
    normalizado.includes("requires billing to be enabled")
  ) {
    const proyecto = process.env.VERTEX_PROJECT_ID?.trim() || "tu-proyecto";
    return `Vertex AI exige una cuenta de facturación activa en el proyecto GCP "${proyecto}". Actívala en https://console.developers.google.com/billing/enable?project=${proyecto} (o usa el VERTEX_PROJECT_ID del proyecto PhysicsAI que ya factura).`;
  }
  if (
    normalizado.includes("prepayment credits are depleted") ||
    normalizado.includes("resource_exhausted") ||
    normalizado.includes('"code":402')
  ) {
    return "Los créditos prepagados de Gemini se agotaron. Recarga el proyecto en AI Studio (https://ai.studio/projects) e inténtalo de nuevo.";
  }
  return `Error al comunicarse con el proveedor IA: ${mensaje}`;
}

function inferirStatusProveedorIa(mensaje: string): number {
  const normalizado = mensaje.toLowerCase();
  if (
    normalizado.includes("billing_disabled") ||
    normalizado.includes("requires billing to be enabled")
  ) {
    return 403;
  }
  if (
    normalizado.includes("prepayment credits are depleted") ||
    normalizado.includes('"code":402')
  ) {
    return 402;
  }
  if (normalizado.includes("resource_exhausted") || normalizado.includes('"code":429')) {
    return 429;
  }
  return 502;
}

interface CredencialesCuentaServicio {
  client_email: string;
  private_key: string;
}

function parsearCuentaServicio(): CredencialesCuentaServicio | undefined {
  const crudo =
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ||
    process.env.FIREBASE_SERVICE_ACCOUNT?.trim();
  if (!crudo) return undefined;

  try {
    const cuenta = JSON.parse(crudo) as {
      client_email?: string;
      private_key?: string;
    };
    if (!cuenta.client_email || !cuenta.private_key) return undefined;
    return {
      client_email: cuenta.client_email,
      private_key: cuenta.private_key.replace(/\\n/g, "\n"),
    };
  } catch {
    throw new ErrorClienteIa(
      "GOOGLE_SERVICE_ACCOUNT_JSON no es un JSON válido de cuenta de servicio.",
      503
    );
  }
}

function crearCliente(): GoogleGenAI {
  const projectId = process.env.VERTEX_PROJECT_ID?.trim();
  if (projectId) {
    const location = process.env.VERTEX_LOCATION?.trim() || "us-central1";
    const credenciales = parsearCuentaServicio();

    console.log("[ClienteGemini] Backend: Vertex AI", { projectId, location });

    return new GoogleGenAI({
      vertexai: true,
      project: projectId,
      location,
      ...(credenciales
        ? { googleAuthOptions: { credentials: credenciales } }
        : {}),
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ErrorClienteIa(
      "Configure VERTEX_PROJECT_ID (Vertex AI) o GEMINI_API_KEY (AI Studio).",
      503
    );
  }

  const baseUrl = process.env.GEMINI_BASE_URL?.trim();
  console.log("[ClienteGemini] Backend: Gemini API (AI Studio)");
  return new GoogleGenAI({
    apiKey,
    ...(baseUrl ? { httpOptions: { baseUrl } } : {}),
  });
}

export interface PayloadGeneracionIa {
  mode: "create" | "refine";
  guide_excerpt: string;
  config?: {
    totalQuestions: number;
    distribution: Record<string, number>;
  };
  current_state?: unknown[];
  teacherInstruction?: string;
}

export async function generarQuizConIa(
  payload: PayloadGeneracionIa,
  modelo: string
): Promise<QuizGeneradoIaValidado> {
  const cliente = crearCliente();

  const promptUsuario = JSON.stringify(payload);

  let respuestaTexto: string;

  try {
    const respuesta = await cliente.models.generateContent({
      model: modelo,
      contents: promptUsuario,
      config: {
        systemInstruction: SYSTEM_PEDAGOGICAL_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.4,
      },
    });

    respuestaTexto = respuesta.text ?? "";
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error desconocido del proveedor IA";
    console.error("[ClienteGemini] Fallo al generar contenido", {
      modelo,
      mensaje,
    });
    throw new ErrorClienteIa(
      interpretarErrorProveedorIa(mensaje),
      inferirStatusProveedorIa(mensaje)
    );
  }

  if (!respuestaTexto.trim()) {
    throw new ErrorClienteIa("El proveedor IA devolvió una respuesta vacía.");
  }

  let jsonParseado: unknown;
  try {
    jsonParseado = JSON.parse(respuestaTexto);
  } catch {
    throw new ErrorClienteIa(
      "El proveedor IA devolvió JSON inválido. Intente de nuevo."
    );
  }

  const validado = quizGeneradoIaSchema.safeParse(jsonParseado);
  if (!validado.success) {
    // Reintento con feedback de error
    try {
      const reintento = await cliente.models.generateContent({
        model: modelo,
        contents: JSON.stringify({
          ...payload,
          validation_error: validado.error.flatten(),
          instruction:
            "Corrige el JSON para cumplir el esquema. Devuelve solo JSON válido.",
        }),
        config: {
          systemInstruction: SYSTEM_PEDAGOGICAL_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const textoReintento = reintento.text ?? "";
      const jsonReintento = JSON.parse(textoReintento);
      const validadoReintento = quizGeneradoIaSchema.safeParse(jsonReintento);

      if (!validadoReintento.success) {
        throw new ErrorClienteIa(
          "La respuesta del IA no cumple el esquema esperado tras reintento."
        );
      }

      return normalizarQuizGeneradoIa(validadoReintento.data);
    } catch {
      throw new ErrorClienteIa(
        "La respuesta del IA no cumple el esquema esperado."
      );
    }
  }

  return normalizarQuizGeneradoIa(validado.data);
}
