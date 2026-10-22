import { NextResponse } from "next/server";
import type { ProgresoEstudiante } from "@/app/types/sesion";
import { conectarDB } from "@/lib/server/database";
import { ParticipanteSesionModel } from "@/lib/server/models/ParticipanteSesion";
import { SesionLiveModel } from "@/lib/server/models/SesionLive";
import { AuthError, requerirAuth } from "@/lib/server/auth/requerir-auth";
import { serializarRespuestaParticipante } from "@/lib/server/services/visibilidad-pregunta";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";

type Params = { params: { pin: string } };

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

    const answers = (
      (participante.answers ?? []) as Record<string, unknown>[]
    ).map((a) => serializarRespuestaParticipante(a, { incluirClave: false }));
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
