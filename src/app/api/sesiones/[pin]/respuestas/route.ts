import { NextResponse } from "next/server";
import { conectarDB } from "@/lib/server/database";
import { ParticipanteSesionModel } from "@/lib/server/models/ParticipanteSesion";
import { TipoPregunta } from "@/app/types/pregunta";
import { PreguntaModel } from "@/lib/server/models/Pregunta";
import { SesionLiveModel } from "@/lib/server/models/SesionLive";
import { AuthError, requerirAuth } from "@/lib/server/auth/requerir-auth";
import { calificarRespuesta } from "@/lib/server/services/calificar-respuesta";
import { evaluarRelojPregunta } from "@/lib/server/services/tiempo-sesion";
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

    const preguntasActivas = await PreguntaModel.find({
      quizId: sesion.quizId,
      activa: true,
    })
      .sort({ creadoEn: 1 })
      .select("_id")
      .lean();
    const preguntaEnTurno = preguntasActivas[sesion.currentQuestion];
    if (!preguntaEnTurno || String(preguntaEnTurno._id) !== datos.questionId) {
      return respuestaError("La pregunta no corresponde a esta sesión", 400);
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
      return respuestaError("Ya respondiste esta pregunta", 409);
    }

    const reloj = evaluarRelojPregunta(sesion.qScheduledAt, sesion.qTimeLimitSec);
    if (reloj.estado === "tarde") {
      return respuestaError("Se acabó el tiempo", 400);
    }
    if (reloj.estado === "sin-reloj") {
      return respuestaError("No se pudo sincronizar el tiempo de la pregunta", 400);
    }

    const pregunta = await PreguntaModel.findById(datos.questionId).lean();
    if (!pregunta || pregunta.quizId !== sesion.quizId) {
      return respuestaError("Pregunta no válida", 400);
    }

    const claveCalificar =
      pregunta.tipo === TipoPregunta.MULTIPLE_OPCION ||
      pregunta.tipo === TipoPregunta.VERDADERO_FALSO
        ? datos.answerId.trim()
        : (datos.answerText ?? datos.answerId).trim();
    // datos.timeLeft se ignora: el puntaje sale del reloj de la sesión.
    const resultado = calificarRespuesta(pregunta, claveCalificar, reloj.timeLeft);

    const answerRecord = {
      questionId: datos.questionId,
      question: resultado.questionText,
      answerId: datos.answerId,
      answerText: datos.answerText ?? resultado.answerText,
      correctOptionId: resultado.correctOptionId,
      correct: resultado.correct,
      answeredAt: new Date(),
      timeLeft: reloj.timeLeft,
      pointsEarned: resultado.pointsEarned,
      questionIndex: datos.questionIndex,
    };

    const actualizado = await ParticipanteSesionModel.findOneAndUpdate(
      {
        _id: participante._id,
        answers: { $not: { $elemMatch: { questionId: datos.questionId } } },
      },
      {
        $push: { answers: answerRecord },
        $inc: { totalScore: resultado.pointsEarned },
        $set: {
          sessionName: sesion.sessionName ?? "",
          lastUpdated: new Date(),
        },
      },
      { new: true }
    );

    if (!actualizado) {
      return respuestaError("Ya respondiste esta pregunta", 409);
    }

    return NextResponse.json({
      correct: resultado.correct,
      pointsEarned: resultado.pointsEarned,
      totalScore: actualizado.totalScore,
      alreadyAnswered: false,
      similitud: resultado.similitud,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}
