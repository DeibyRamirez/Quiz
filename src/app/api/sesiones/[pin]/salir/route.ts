import { NextResponse } from "next/server";
import { conectarDB } from "@/lib/server/database";
import { SesionLiveModel } from "@/lib/server/models/SesionLive";
import { AuthError, requerirAuth } from "@/lib/server/auth/requerir-auth";
import { serializarSesion } from "@/lib/server/services/sesion-helpers";
import { emitirActualizacionSesion } from "@/lib/server/socket/broadcast";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";

type Params = { params: { pin: string } };

export async function POST(_request: Request, { params }: Params) {
  try {
    await conectarDB();

    const payload = await requerirAuth();
    const sesion = await SesionLiveModel.findOne({ pin: params.pin });
    if (!sesion) {
      return respuestaError("Sesión no encontrada", 404);
    }

    if (sesion.status === "lobby") {
      sesion.players = sesion.players.filter(
        (p: { userId: string }) => p.userId !== payload.sub
      );
      await sesion.save();
    }

    const data = serializarSesion(sesion.toObject());
    if (sesion.status === "lobby") {
      await emitirActualizacionSesion(params.pin, sesion.toObject());
    }
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}
