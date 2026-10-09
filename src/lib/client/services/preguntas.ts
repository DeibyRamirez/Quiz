import type { CrearPregunta, ActualizarPregunta, Pregunta } from "@/app/types";
import { apiRequest, contruirUrlApi } from "@/lib/client/api";

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

export type ActualizarPreguntaRequest = ActualizarPregunta & {
  confirmarRevisionDocente?: boolean;
};

export async function actualizarPregunta(
  id: string,
  datos: ActualizarPreguntaRequest
): Promise<Pregunta> {
  return apiRequest<Pregunta>(`/preguntas/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

export async function eliminarPregunta(id: string): Promise<void> {
  await apiRequest(`/preguntas/${id}`, { method: "DELETE" });
}

export async function subirImagenPregunta(
  preguntaId: string,
  file: File
): Promise<Pregunta> {
  const formData = new FormData();
  formData.set("file", file);
  const res = await fetch(contruirUrlApi(`/preguntas/${preguntaId}/imagen`), {
    method: "POST",
    body: formData,
    credentials: "include",
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "No se pudo subir la imagen");
  }
  return res.json() as Promise<Pregunta>;
}

export async function eliminarImagenPregunta(preguntaId: string): Promise<Pregunta> {
  return apiRequest<Pregunta>(`/preguntas/${preguntaId}/imagen`, {
    method: "DELETE",
  });
}
