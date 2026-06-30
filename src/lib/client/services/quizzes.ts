import type {
  CrearQuiz,
  ActualizarQuiz,
  Quiz,
  QuizConPreguntas,
} from "@/app/types";
import { apiRequest } from "@/lib/client/api";

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

export function formatearFechaQuiz(valor?: string | Date | null): string {
  if (!valor) return "—";
  const date = valor instanceof Date ? valor : new Date(valor);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}
