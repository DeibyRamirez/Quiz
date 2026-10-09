import { z } from "zod";
import { TipoPregunta, type CrearPregunta } from "@/app/types/pregunta";

const preguntaBaseSchema = z.object({
  texto: z.string().trim().min(1, "El texto es obligatorio"),
  puntos: z.number().int().positive().default(10),
  tiempoLimite: z.number().int().positive().default(30),
  explicacion: z.string().trim().optional(),
  tema: z.string().trim().optional(),
  imagenReferencia: z.string().trim().optional(),
  quizId: z.string().trim().min(1, "quizId es obligatorio"),
  activa: z.boolean().default(true),
});

const multipleOpcionSchema = preguntaBaseSchema.extend({
  tipo: z.literal(TipoPregunta.MULTIPLE_OPCION),
  opciones: z.array(z.string().trim().min(1)).min(2, "Mínimo 2 opciones"),
  respuestaCorrecta: z.union([
    z.number().int().nonnegative(),
    z.array(z.number().int().nonnegative()),
  ]),
  permiteMultiples: z.boolean().default(false),
});

const verdaderoFalsoSchema = preguntaBaseSchema.extend({
  tipo: z.literal(TipoPregunta.VERDADERO_FALSO),
  opciones: z.tuple([z.literal("Verdadero"), z.literal("Falso")]).default([
    "Verdadero",
    "Falso",
  ]),
  respuestaCorrecta: z.boolean(),
});

const respuestaCortaSchema = preguntaBaseSchema.extend({
  tipo: z.literal(TipoPregunta.RESPUESTA_CORTA),
  respuestaCorrecta: z.union([
    z.string().trim(),
    z.array(z.string().trim()).min(1),
  ]).default(""),
  criteriosEvaluacion: z.string().trim().optional(),
  requiereCorreccionManual: z.boolean().optional().default(false),
  caseSensitive: z.boolean().optional().default(false),
  maxLength: z.number().int().positive().optional(),
});

export const crearPreguntaSchema = z.discriminatedUnion("tipo", [
  multipleOpcionSchema,
  verdaderoFalsoSchema,
  respuestaCortaSchema,
]);

export const actualizarPreguntaSchema = z.union([
  multipleOpcionSchema.partial(),
  verdaderoFalsoSchema.partial(),
  respuestaCortaSchema.partial(),
]);

function validarRespuestaCorrecta(
  data: z.infer<typeof crearPreguntaSchema>
): string | null {
  switch (data.tipo) {
    case TipoPregunta.MULTIPLE_OPCION:
      const indices = Array.isArray(data.respuestaCorrecta)
        ? data.respuestaCorrecta
        : [data.respuestaCorrecta];
      if (indices.length === 0) {
        return "Debe haber al menos una respuesta correcta";
      }
      if (!data.permiteMultiples && indices.length > 1) {
        return "Solo una respuesta correcta permitida";
      }
      const invalido = indices.some(
        (idx) => idx < 0 || idx >= data.opciones.length
      );
      return invalido
        ? "respuestaCorrecta fuera del rango de opciones"
        : null;

    case TipoPregunta.VERDADERO_FALSO:
      return typeof data.respuestaCorrecta === "boolean" ? null : "respuestaCorrecta inválida";

    case TipoPregunta.RESPUESTA_CORTA:
      if (data.requiereCorreccionManual && data.criteriosEvaluacion?.trim()) {
        return null;
      }
      const respuestas = Array.isArray(data.respuestaCorrecta)
        ? data.respuestaCorrecta
        : [data.respuestaCorrecta];
      return respuestas.some((r) => String(r).trim())
        ? null
        : "respuestaCorrecta es obligatoria";

    default:
      return "Tipo de pregunta no soportado";
  }
}

export function parsearCrearPregunta(body: unknown) {
  const data = crearPreguntaSchema.parse(body);
  const errorLogico = validarRespuestaCorrecta(data);

  if (errorLogico) {
    throw new z.ZodError([
      {
        code: "custom",
        message: errorLogico,
        path: ["respuestaCorrecta"],
      },
    ]);
  }

  return data;
}

export type ResultadoValidacionPregunta = {
  valida: boolean;
  mensaje?: string;
};

function normalizarTipoPersistido(tipo: unknown): string | null {
  if (tipo === TipoPregunta.MULTIPLE_OPCION) return TipoPregunta.MULTIPLE_OPCION;
  if (tipo === TipoPregunta.VERDADERO_FALSO) return TipoPregunta.VERDADERO_FALSO;
  if (tipo === TipoPregunta.RESPUESTA_CORTA || tipo === "numerical") {
    return TipoPregunta.RESPUESTA_CORTA;
  }
  return null;
}

/** Valida una pregunta ya guardada en Mongo (verificación docente). */
export function validarPreguntaPersistida(
  doc: Record<string, unknown>
): ResultadoValidacionPregunta {
  const tipo = normalizarTipoPersistido(doc.tipo);
  if (!tipo) {
    return { valida: false, mensaje: "Tipo de pregunta no soportado" };
  }

  const texto = String(doc.texto ?? "").trim();
  if (!texto) {
    return { valida: false, mensaje: "El texto es obligatorio" };
  }

  const puntosRaw = Number(doc.puntos);
  if (!Number.isFinite(puntosRaw) || puntosRaw <= 0) {
    return { valida: false, mensaje: "Los puntos son obligatorios" };
  }

  const base = {
    texto,
    quizId: String(doc.quizId ?? "quiz"),
    puntos: puntosRaw,
    tiempoLimite: Math.max(1, Number(doc.tiempoLimite) || 30),
    activa: doc.activa !== false,
    explicacion: doc.explicacion ? String(doc.explicacion) : undefined,
    tema: doc.tema ? String(doc.tema) : undefined,
    imagenReferencia: doc.imagenReferencia
      ? String(doc.imagenReferencia)
      : undefined,
  };

  let candidato: z.infer<typeof crearPreguntaSchema>;

  if (tipo === TipoPregunta.MULTIPLE_OPCION) {
    candidato = {
      ...base,
      tipo: TipoPregunta.MULTIPLE_OPCION,
      opciones: Array.isArray(doc.opciones)
        ? doc.opciones.map((o) => String(o).trim()).filter(Boolean)
        : [],
      respuestaCorrecta: doc.respuestaCorrecta as number | number[],
      permiteMultiples: Boolean(doc.permiteMultiples),
    };
  } else if (tipo === TipoPregunta.VERDADERO_FALSO) {
    candidato = {
      ...base,
      tipo: TipoPregunta.VERDADERO_FALSO,
      opciones: ["Verdadero", "Falso"],
      respuestaCorrecta: doc.respuestaCorrecta as boolean,
    };
  } else {
    candidato = {
      ...base,
      tipo: TipoPregunta.RESPUESTA_CORTA,
      respuestaCorrecta: (doc.respuestaCorrecta ?? "") as string | string[],
      criteriosEvaluacion: doc.criteriosEvaluacion
        ? String(doc.criteriosEvaluacion)
        : undefined,
      requiereCorreccionManual: Boolean(doc.requiereCorreccionManual),
      caseSensitive: Boolean(doc.caseSensitive),
    };
  }

  const parsed = crearPreguntaSchema.safeParse(candidato);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return {
      valida: false,
      mensaje: first?.message ?? "Datos de pregunta inválidos",
    };
  }

  const errorLogico = validarRespuestaCorrecta(parsed.data);
  if (errorLogico) {
    return { valida: false, mensaje: errorLogico };
  }

  return { valida: true };
}

/** Valida antes de insertar preguntas generadas por IA. */
export function validarCrearPreguntaParaPersistencia(datos: CrearPregunta): void {
  parsearCrearPregunta(datos);
}
