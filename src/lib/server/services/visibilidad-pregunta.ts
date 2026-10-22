import { RolUsuario } from "@/app/types/usuario";
import { obtenerPayloadSesion } from "@/lib/server/auth/session";
import { QuizModel } from "@/lib/server/models/Quiz";

/** Campos que revelan la clave. No viajan a estudiantes ni al público. */
const CAMPOS_CLAVE = [
  "respuestaCorrecta",
  "criteriosEvaluacion",
  "explicacion",
] as const;

/**
 * Docente dueño del quiz, o administrador (misma regla que al editar
 * una pregunta). Un estudiante autenticado no es dueño.
 */
export async function lectorPuedeVerRespuestas(quizId: string): Promise<boolean> {
  const payload = await obtenerPayloadSesion();
  if (!payload || !quizId) return false;
  if (payload.rol === RolUsuario.ADMINISTRADOR) return true;
  if (payload.rol !== RolUsuario.DOCENTE) return false;

  const quiz = await QuizModel.findById(quizId).select("autorId").lean();
  return Boolean(quiz && String(quiz.autorId) === payload.sub);
}

export function ocultarRespuestasPregunta<T extends Record<string, unknown>>(doc: T): T {
  const copia: Record<string, unknown> = { ...doc };
  for (const campo of CAMPOS_CLAVE) {
    delete copia[campo];
  }
  return copia as T;
}

export function serializarRespuestaParticipante(
  a: Record<string, unknown>,
  opciones?: { incluirClave?: boolean }
) {
  const incluirClave = opciones?.incluirClave === true;
  return {
    questionId: String(a.questionId),
    question: String(a.question ?? ""),
    answerId: String(a.answerId),
    answerText: String(a.answerText ?? ""),
    correctOptionId:
      incluirClave && a.correctOptionId ? String(a.correctOptionId) : null,
    correct: Boolean(a.correct),
    answeredAt: new Date(a.answeredAt as string | number | Date).toISOString(),
    timeLeft: Number(a.timeLeft ?? 0),
    pointsEarned: Number(a.pointsEarned ?? 0),
    questionIndex: Number(a.questionIndex ?? 0),
    respuestaRevelada: a.respuestaRevelada ? String(a.respuestaRevelada) : null,
    opcionesCorrectas: Array.isArray(a.opcionesCorrectas)
      ? a.opcionesCorrectas.map((id) => String(id))
      : [],
  };
}
