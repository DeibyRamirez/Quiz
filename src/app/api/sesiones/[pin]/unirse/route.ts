import { NextResponse } from "next/server";
import { RolUsuario } from "@/app/types/usuario";
import { conectarDB } from "@/lib/server/database";
import { ParticipanteSesionModel } from "@/lib/server/models/ParticipanteSesion";
import { SesionLiveModel } from "@/lib/server/models/SesionLive";
import { AuthError, requerirRol } from "@/lib/server/auth/requerir-auth";
import { serializarSesion } from "@/lib/server/services/sesion-helpers";
import { emitirActualizacionSesion } from "@/lib/server/socket/broadcast";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";

type Params = { params: { pin: string } };

export async function POST(_request: Request, { params }: Params) {
  try {
    await conectarDB();

    const payload = await requerirRol([RolUsuario.ESTUDIANTE]);
    const sesion = await SesionLiveModel.findOne({ pin: params.pin });
    if (!sesion) {
      return respuestaError("PIN no válido o sesión no encontrada", 404);
    }

    const now = new Date();
    const participante = await ParticipanteSesionModel.findOne({
      sesionPin: params.pin,
      userId: payload.sub,
    });
    const playerIdx = sesion.players.findIndex(
      (p: { userId: string }) => p.userId === payload.sub
    );

    if (sesion.status !== "lobby") {
      if (!participante && playerIdx === -1) {
        return respuestaError(
          "La sesión no está en espera. Intenta con otro PIN.",
          400
        );
      }

      if (playerIdx >= 0) {
        sesion.players[playerIdx].lastSeenAt = now;
      } else {
        sesion.players.push({
          userId: payload.sub,
          nombre: payload.nombre,
          joinedAt: now,
          lastSeenAt: now,
        });
      }
      await sesion.save();

      if (participante) {
        await ParticipanteSesionModel.updateOne(
          { sesionPin: params.pin, userId: payload.sub },
          { $set: { lastUpdated: now } }
        );
      }

      const data = serializarSesion(sesion.toObject());
      await emitirActualizacionSesion(params.pin, sesion.toObject());
      return NextResponse.json(data);
    }

    if (playerIdx === -1) {
      sesion.players.push({
        userId: payload.sub,
        nombre: payload.nombre,
        joinedAt: now,
        lastSeenAt: now,
      });
      await sesion.save();
    } else {
      sesion.players[playerIdx].lastSeenAt = now;
      await sesion.save();
    }

    await ParticipanteSesionModel.findOneAndUpdate(
      { sesionPin: params.pin, userId: payload.sub },
      {
        $setOnInsert: {
          sesionPin: params.pin,
          userId: payload.sub,
          playerName: payload.nombre,
          sessionName: sesion.sessionName ?? "",
          quizId: sesion.quizId,
          totalScore: 0,
          answers: [],
        },
        $set: { lastUpdated: now },
      },
      { upsert: true, new: true }
    );

    const data = serializarSesion(sesion.toObject());
    await emitirActualizacionSesion(params.pin, sesion.toObject());
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}
