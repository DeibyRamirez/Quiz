import { NextResponse } from "next/server";
import { RolUsuario } from "@/app/types/usuario";
import { conectarDB } from "@/lib/server/database";
import { PreguntaModel } from "@/lib/server/models/Pregunta";
import { QuizModel } from "@/lib/server/models/Quiz";
import { SesionLiveModel } from "@/lib/server/models/SesionLive";
import { AuthError, requerirAuth } from "@/lib/server/auth/requerir-auth";
import { actualizarSesionSchema } from "@/lib/server/validators/sesion";
import { serializarSesion } from "@/lib/server/services/sesion-helpers";
import { emitirActualizacionSesion } from "@/lib/server/socket/broadcast";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";

type Params = { params: { pin: string } };

const START_DELAY_MS = 2000;
const NEXT_DELAY_MS = 800;

async function puedeGestionarSesion(
  sesion: { docenteId: string; quizId: string },
  sub: string,
  rol: RolUsuario
) {
  if (sesion.docenteId === sub) return true;
  if (rol === RolUsuario.ADMINISTRADOR) return true;
  const quiz = await QuizModel.findById(sesion.quizId).lean();
  return quiz?.autorId === sub;
}

export async function GET(_request: Request, { params }: Params) {
  try {
    await conectarDB();

    const sesion = await SesionLiveModel.findOne({ pin: params.pin }).lean();
    if (!sesion) {
      return respuestaError("Sesión no encontrada", 404);
    }

    return NextResponse.json(serializarSesion(sesion));
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await conectarDB();

    const payload = await requerirAuth();
    const body = await request.json();
    const datos = actualizarSesionSchema.parse(body);

    const sesion = await SesionLiveModel.findOne({ pin: params.pin });
    if (!sesion) {
      return respuestaError("Sesión no encontrada", 404);
    }

    const autorizado = await puedeGestionarSesion(
      sesion,
      payload.sub,
      payload.rol
    );
    if (!autorizado) {
      return respuestaError("No autorizado", 403);
    }

    if (datos.action === "updateName") {
      sesion.sessionName = datos.sessionName.trim();
      await sesion.save();
      const data = serializarSesion(sesion.toObject());
      await emitirActualizacionSesion(params.pin, sesion.toObject());
      return NextResponse.json(data);
    }

    if (datos.action === "end") {
      sesion.status = "ended";
      sesion.endedAt = new Date();
      await sesion.save();
      const data = serializarSesion(sesion.toObject());
      await emitirActualizacionSesion(params.pin, sesion.toObject());
      return NextResponse.json(data);
    }

    const preguntas = await PreguntaModel.find({
      quizId: sesion.quizId,
      activa: true,
    })
      .sort({ creadoEn: 1 })
      .lean();

    const nowMs = Date.now();

    if (datos.action === "start") {
      if (sesion.status !== "lobby") {
        return respuestaError("La sesión ya fue iniciada", 400);
      }
      if (!sesion.sessionName?.trim()) {
        return respuestaError("El nombre de sesión es obligatorio", 400);
      }
      if (!sesion.players.length) {
        return respuestaError("No hay jugadores en la sesión", 400);
      }

      const limitSec = preguntas[0]?.tiempoLimite ?? 30;
      sesion.status = "active";
      sesion.currentQuestion = 0;
      sesion.startedAt = new Date();
      sesion.qTimeLimitSec = limitSec;
      sesion.qScheduledAt = new Date(nowMs + START_DELAY_MS);
      await sesion.save();
      const data = serializarSesion(sesion.toObject());
      await emitirActualizacionSesion(params.pin, sesion.toObject());
      return NextResponse.json(data);
    }

    if (datos.action === "next") {
      const nextQ = sesion.currentQuestion + 1;
      if (nextQ >= preguntas.length) {
        sesion.status = "ended";
        sesion.endedAt = new Date();
        await sesion.save();
        const data = serializarSesion(sesion.toObject());
        await emitirActualizacionSesion(params.pin, sesion.toObject());
        return NextResponse.json(data);
      }

      const limitSec = preguntas[nextQ]?.tiempoLimite ?? 30;
      sesion.currentQuestion = nextQ;
      sesion.qTimeLimitSec = limitSec;
      sesion.qScheduledAt = new Date(nowMs + NEXT_DELAY_MS);
      await sesion.save();
      const data = serializarSesion(sesion.toObject());
      await emitirActualizacionSesion(params.pin, sesion.toObject());
      return NextResponse.json(data);
    }

    return respuestaError("Acción no válida", 400);
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}
