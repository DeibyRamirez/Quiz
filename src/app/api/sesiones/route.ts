import { NextResponse } from "next/server";
import { RolUsuario } from "@/app/types/usuario";
import { conectarDB } from "@/lib/server/database";
import { QuizModel } from "@/lib/server/models/Quiz";
import { SesionLiveModel } from "@/lib/server/models/SesionLive";
import { AuthError, requerirRol } from "@/lib/server/auth/requerir-auth";
import { crearSesionSchema } from "@/lib/server/validators/sesion";
import {
  generarPinUnico,
  serializarSesion,
} from "@/lib/server/services/sesion-helpers";
import { emitirActualizacionSesion } from "@/lib/server/socket/broadcast";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";

export async function POST(request: Request) {
  try {
    await conectarDB();

    const payload = await requerirRol([RolUsuario.DOCENTE, RolUsuario.ADMINISTRADOR]);
    const body = await request.json();
    const { quizId } = crearSesionSchema.parse(body);

    const quiz = await QuizModel.findById(quizId).lean();
    if (!quiz) {
      return respuestaError("Quiz no encontrado", 404);
    }

    if (
      quiz.autorId !== payload.sub &&
      payload.rol !== RolUsuario.ADMINISTRADOR
    ) {
      return respuestaError("No autorizado para este quiz", 403);
    }

    const sesionExistente = await SesionLiveModel.findOne({
      quizId,
      docenteId: payload.sub,
      status: { $in: ["lobby", "active"] },
    }).lean();

    if (sesionExistente) {
      return NextResponse.json(serializarSesion(sesionExistente));
    }

    const pin = await generarPinUnico();
    const sesion = await SesionLiveModel.create({
      pin,
      quizId,
      docenteId: payload.sub,
      status: "lobby",
      currentQuestion: 0,
      sessionName: "",
      players: [],
    });

    const serializada = serializarSesion(sesion.toObject());
    await emitirActualizacionSesion(pin, sesion.toObject());

    return NextResponse.json(serializada, {
      status: 201,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}
