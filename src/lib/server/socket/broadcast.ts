import { conectarDB } from "@/lib/server/database";
import { SesionLiveModel } from "@/lib/server/models/SesionLive";
import { serializarSesion } from "@/lib/server/services/sesion-helpers";
import { SOCKET_EVENTS, roomSesion, type SesionUpdatePayload } from "@/app/types/socket";
import { getSocketIO } from "./io";

/**
 * Emite el estado actual de una sesión a todos los clientes en la sala `sesion:{pin}`.
 * Se llama después de cada escritura en Mongo (PATCH start/next, unirse, salir, etc.).
 */
export async function emitirActualizacionSesion(
  pin: string,
  doc?: Record<string, unknown>
): Promise<SesionUpdatePayload | null> {
  const io = getSocketIO();
  if (!io) return null;

  let payload: SesionUpdatePayload;

  if (doc) {
    payload = serializarSesion(doc);
  } else {
    await conectarDB();
    const sesion = await SesionLiveModel.findOne({ pin }).lean();
    if (!sesion) return null;
    payload = serializarSesion(sesion);
  }

  io.to(roomSesion(pin)).emit(SOCKET_EVENTS.SESION_UPDATE, payload);
  return payload;
}
