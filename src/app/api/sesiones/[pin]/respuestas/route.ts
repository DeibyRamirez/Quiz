import { NextResponse } from "next/server";
import { conectarDB } from "@/lib/server/database";
import { ParticipanteSesionModel } from "@/lib/server/models/ParticipanteSesion";
import { PreguntaModel } from "@/lib/server/models/Pregunta";
import { SesionLiveModel } from "@/lib/server/models/SesionLive";
import { AuthError, requerirAuth } from "@/lib/server/auth/requerir-auth";
import { calificarRespuesta } from "@/lib/server/services/calificar-respuesta";
import { enviarRespuestaSchema } from "@/lib/server/validators/sesion";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";

type Params = { params: { pin: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    await conectarDB();

    const payload = await requerirAuth();
    const body = await request.json();
    const datos = enviarRespuestaSchema.parse(body);

    const sesion = await SesionLiveModel.findOne({ pin: params.pin }).lean();
    if (!sesion) {
      return respuestaError("Sesión no encontrada", 404);
    }

    if (sesion.status !== "active") {
      return respuestaError("La sesión no está activa", 400);
    }

    if (datos.questionIndex !== sesion.currentQuestion) {
      return respuestaError("La pregunta ya no está activa", 400);
    }

    const participante = await ParticipanteSesionModel.findOne({
      sesionPin: params.pin,
      userId: payload.sub,
    });

    if (!participante) {
      return respuestaError("No estás registrado en esta sesión", 403);
    }

    const yaRespondida = participante.answers.some(
      (a: { questionId: string }) => a.questionId === datos.questionId
    );
    if (yaRespondida) {
      const existente = participante.answers.find(
        (a: { questionId: string }) => a.questionId === datos.questionId
      )!;
      return NextResponse.json({
        correct: existente.correct,
        pointsEarned: existente.pointsEarned,
        totalScore: participante.totalScore,
        alreadyAnswered: true,
      });
    }

    const pregunta = await PreguntaModel.findById(datos.questionId).lean();
    if (!pregunta || pregunta.quizId !== sesion.quizId) {
      return respuestaError("Pregunta no válida", 400);
    }

    const resultado = calificarRespuesta(
      pregunta,
      datos.answerId,
      datos.timeLeft
    );

    const answerRecord = {
      questionId: datos.questionId,
      question: resultado.questionText,
      answerId: datos.answerId,
      answerText: datos.answerText ?? resultado.answerText,
      correctOptionId: resultado.correctOptionId,
      correct: resultado.correct,
      answeredAt: new Date(),
      timeLeft: datos.timeLeft,
      pointsEarned: resultado.pointsEarned,
      questionIndex: datos.questionIndex,
    };

    participante.answers.push(answerRecord);
    participante.totalScore += resultado.pointsEarned;
    participante.sessionName = sesion.sessionName ?? "";
    participante.lastUpdated = new Date();
    await participante.save();

    return NextResponse.json({
      correct: resultado.correct,
      pointsEarned: resultado.pointsEarned,
      totalScore: participante.totalScore,
      alreadyAnswered: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}
