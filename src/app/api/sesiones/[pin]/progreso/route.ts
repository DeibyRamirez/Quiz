import { NextResponse } from "next/server";
import type { ProgresoEstudiante } from "@/app/types/sesion";
import { conectarDB } from "@/lib/server/database";
import { ParticipanteSesionModel } from "@/lib/server/models/ParticipanteSesion";
import { SesionLiveModel } from "@/lib/server/models/SesionLive";
import { AuthError, requerirAuth } from "@/lib/server/auth/requerir-auth";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";

type Params = { params: { pin: string } };

function serializarRespuesta(a: Record<string, unknown>) {
  return {
    questionId: String(a.questionId),
    question: String(a.question ?? ""),
    answerId: String(a.answerId),
    answerText: String(a.answerText ?? ""),
    correctOptionId: a.correctOptionId ? String(a.correctOptionId) : null,
    correct: Boolean(a.correct),
    answeredAt: new Date(a.answeredAt as string).toISOString(),
    timeLeft: Number(a.timeLeft ?? 0),
    pointsEarned: Number(a.pointsEarned ?? 0),
    questionIndex: Number(a.questionIndex ?? 0),
  };
}

export async function GET(_request: Request, { params }: Params) {
  try {
    await conectarDB();

    const payload = await requerirAuth();
    const sesion = await SesionLiveModel.findOne({ pin: params.pin }).lean();
    if (!sesion) {
      return respuestaError("Sesión no encontrada", 404);
    }

    const participante = await ParticipanteSesionModel.findOne({
      sesionPin: params.pin,
      userId: payload.sub,
    }).lean();

    if (!participante) {
      const vacio: ProgresoEstudiante = {
        totalScore: 0,
        answers: [],
        answeredQuestionIds: [],
        answeredCurrentQuestion: false,
        currentQuestionAnswer: null,
      };
      return NextResponse.json(vacio);
    }

    const answers = (participante.answers ?? []).map(
      (a: Record<string, unknown>) => serializarRespuesta(a)
    );
    const answeredQuestionIds = answers.map((a) => a.questionId);
    const currentIdx = Number(sesion.currentQuestion ?? 0);
    const currentAnswer = answers.find((a) => a.questionIndex === currentIdx);

    const progreso: ProgresoEstudiante = {
      totalScore: participante.totalScore ?? 0,
      answers,
      answeredQuestionIds,
      answeredCurrentQuestion: Boolean(currentAnswer),
      currentQuestionAnswer: currentAnswer ?? null,
    };

    return NextResponse.json(progreso);
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}
