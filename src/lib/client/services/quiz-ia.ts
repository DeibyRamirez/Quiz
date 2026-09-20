import { apiRequest } from "@/lib/client/api";
import type { Pregunta } from "@/app/types/pregunta";
import type { ConfigGeneracion } from "@/app/types/quiz-ia";

export interface GenerarQuizIaPayload {
  guiaId: string;
  titulo: string;
  config: ConfigGeneracion;
}

export interface RespuestaQuizIaApi {
  quizId: string;
  titulo: string;
  version: number;
  questions: Pregunta[];
}

export async function generarQuizIa(
  payload: GenerarQuizIaPayload
): Promise<RespuestaQuizIaApi> {
  return apiRequest<RespuestaQuizIaApi>("/v1/quizzes/generate", {
    method: "POST",
    body: JSON.stringify({
      guiaId: payload.guiaId,
      titulo: payload.titulo,
      config: {
        totalPreguntas: payload.config.totalPreguntas,
        distribucion: payload.config.distribucion,
      },
    }),
  });
}

export async function refinarQuizIa(
  quizId: string,
  teacherInstruction: string
): Promise<RespuestaQuizIaApi> {
  return apiRequest<RespuestaQuizIaApi>(`/v1/quizzes/${quizId}/refine`, {
    method: "PATCH",
    body: JSON.stringify({ teacherInstruction }),
  });
}
