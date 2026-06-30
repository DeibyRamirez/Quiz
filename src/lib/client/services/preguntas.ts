import type { CrearPregunta, ActualizarPregunta, Pregunta } from "@/app/types";
import { apiRequest } from "@/lib/client/api";

export async function listarPreguntas(
  quizId: string,
  opciones?: { incluirInactivas?: boolean }
): Promise<Pregunta[]> {
  const params = new URLSearchParams({ quizId });
  if (opciones?.incluirInactivas) {
    params.set("activa", "false");
  }
  return apiRequest<Pregunta[]>(`/preguntas?${params.toString()}`);
}

export async function obtenerPregunta(id: string): Promise<Pregunta> {
  return apiRequest<Pregunta>(`/preguntas/${id}`);
}

export async function crearPregunta(datos: CrearPregunta): Promise<Pregunta> {
  return apiRequest<Pregunta>("/preguntas", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export async function actualizarPregunta(
  id: string,
  datos: ActualizarPregunta
): Promise<Pregunta> {
  return apiRequest<Pregunta>(`/preguntas/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

export async function eliminarPregunta(id: string): Promise<void> {
  await apiRequest(`/preguntas/${id}`, { method: "DELETE" });
}
