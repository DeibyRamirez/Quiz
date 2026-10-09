import type {
  CrearQuiz,
  ActualizarQuiz,
  Quiz,
  QuizConPreguntas,
} from "@/app/types";
import { ApiError, apiRequest } from "@/lib/client/api";
import { EstadoQuiz } from "@/app/types/quiz";

export async function listarQuizzes(autorId?: string): Promise<Quiz[]> {
  const qs = autorId ? `?autorId=${encodeURIComponent(autorId)}` : "";
  return apiRequest<Quiz[]>(`/quizzes${qs}`);
}

export async function obtenerQuiz(id: string): Promise<QuizConPreguntas> {
  return apiRequest<QuizConPreguntas>(`/quizzes/${id}`);
}

export async function crearQuiz(datos: CrearQuiz): Promise<Quiz> {
  return apiRequest<Quiz>("/quizzes", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export async function actualizarQuiz(
  id: string,
  datos: ActualizarQuiz
): Promise<Quiz> {
  return apiRequest<Quiz>(`/quizzes/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

export async function eliminarQuiz(id: string): Promise<void> {
  await apiRequest(`/quizzes/${id}`, { method: "DELETE" });
}

export type ErrorVerificacionQuiz = {
  preguntaId: string;
  indice: number;
  textoCorto: string;
  mensaje: string;
};

export type ResultadoVerificacionQuiz = {
  estado: EstadoQuiz;
  preguntasValidadas: number;
};

export async function verificarQuizDocente(
  quizId: string
): Promise<ResultadoVerificacionQuiz> {
  const data = await apiRequest<{
    estado: EstadoQuiz;
    preguntasValidadas: number;
  }>(`/quizzes/${quizId}/verificar-docente`, {
    method: "POST",
    body: JSON.stringify({}),
  });
  return {
    estado: data.estado,
    preguntasValidadas: data.preguntasValidadas,
  };
}

export function extraerErroresVerificacionQuiz(
  error: unknown
): ErrorVerificacionQuiz[] | null {
  if (!(error instanceof ApiError) || error.status !== 422) return null;
  const detalles = error.detalles as { errores?: ErrorVerificacionQuiz[] } | undefined;
  return detalles?.errores ?? null;
}

export function formatearFechaQuiz(valor?: string | Date | null): string {
  if (!valor) return "—";
  const date = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}
