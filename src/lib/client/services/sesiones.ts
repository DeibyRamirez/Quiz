import type {
  ProgresoEstudiante,
  ResultadosQuiz,
  SesionLive,
} from "@/app/types/sesion";
import { apiRequest } from "@/lib/client/api";

export async function crearSesion(quizId: string): Promise<SesionLive> {
  return apiRequest<SesionLive>("/sesiones", {
    method: "POST",
    body: JSON.stringify({ quizId }),
  });
}

export async function obtenerSesion(pin: string): Promise<SesionLive> {
  return apiRequest<SesionLive>(`/sesiones/${pin}`);
}

export async function actualizarNombreSesion(
  pin: string,
  sessionName: string
): Promise<SesionLive> {
  return apiRequest<SesionLive>(`/sesiones/${pin}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "updateName", sessionName }),
  });
}

export async function iniciarSesion(pin: string): Promise<SesionLive> {
  return apiRequest<SesionLive>(`/sesiones/${pin}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "start" }),
  });
}

export async function siguientePreguntaSesion(pin: string): Promise<SesionLive> {
  return apiRequest<SesionLive>(`/sesiones/${pin}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "next" }),
  });
}

export async function terminarSesion(pin: string): Promise<SesionLive> {
  return apiRequest<SesionLive>(`/sesiones/${pin}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "end" }),
  });
}

export async function unirseSesion(pin: string): Promise<SesionLive> {
  return apiRequest<SesionLive>(`/sesiones/${pin}/unirse`, {
    method: "POST",
  });
}

export async function salirSesion(pin: string): Promise<SesionLive> {
  return apiRequest<SesionLive>(`/sesiones/${pin}/salir`, {
    method: "POST",
  });
}

export async function heartbeatSesion(pin: string): Promise<{ ok: boolean; serverTime: number }> {
  return apiRequest(`/sesiones/${pin}/heartbeat`, { method: "POST" });
}

export async function enviarRespuestaSesion(
  pin: string,
  datos: {
    questionId: string;
    answerId: string;
    answerText?: string;
    timeLeft: number;
    questionIndex: number;
  }
): Promise<{
  correct: boolean;
  pointsEarned: number;
  totalScore: number;
  alreadyAnswered: boolean;
}> {
  return apiRequest(`/sesiones/${pin}/respuestas`, {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export async function obtenerProgresoSesion(
  pin: string
): Promise<ProgresoEstudiante> {
  return apiRequest<ProgresoEstudiante>(`/sesiones/${pin}/progreso`);
}

export async function obtenerResultadosQuiz(
  quizId: string
): Promise<ResultadosQuiz> {
  return apiRequest<ResultadosQuiz>(`/quizzes/${quizId}/resultados`);
}
