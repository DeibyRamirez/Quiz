import type { Pregunta } from "@/app/types/pregunta";
import {
  preguntaApiToUi,
  evaluarRespuestaUi,
} from "@/lib/client/mappers/pregunta-ui";
import { serializarDocumento } from "@/lib/server/utils/serializar";

export function calificarRespuesta(
  preguntaDoc: Record<string, unknown> & { _id: unknown },
  answerId: string,
  timeLeft: number
): {
  correct: boolean;
  pointsEarned: number;
  answerText: string;
  correctOptionId: string | null;
  questionText: string;
  similitud?: number;
} {
  const pregunta = serializarDocumento(
    preguntaDoc as Parameters<typeof serializarDocumento>[0]
  ) as unknown as Pregunta;
  const ui = preguntaApiToUi(pregunta);
  const evaluacion = evaluarRespuestaUi(ui, answerId);

  let answerText = answerId;
  if (ui.questionType === "multiple-choice" && ui.options) {
    if (ui.permiteMultiples) {
      const ids = answerId
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      answerText = ids
        .map((id) => ui.options!.find((o) => o.id === id)?.text ?? id)
        .join(" | ");
    } else {
      const opt = ui.options.find((o) => o.id === answerId);
      answerText = opt?.text ?? answerId;
    }
  }

  const basePoints = ui.points || 1000;
  const timeLimit = ui.timeLimit || 30;
  const pointsEarned = evaluacion.correct
    ? Math.round((timeLeft / timeLimit) * basePoints)
    : 0;

  const correctOptionId =
    ui.questionType === "numerical" ||
    ui.questionType === "exact-text" ||
    ui.questionType === "open-text"
      ? null
      : ui.correctOption ?? null;

  return {
    correct: evaluacion.correct,
    pointsEarned,
    answerText,
    correctOptionId,
    questionText: ui.question,
    similitud: evaluacion.similitud,
  };
}
