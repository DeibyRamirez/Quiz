import { SesionLiveModel } from "@/lib/server/models/SesionLive";
import type { SesionLive } from "@/app/types/sesion";
import { serializarDocumento } from "@/lib/server/utils/serializar";

const PRESENCE_MS_LOBBY = 45_000;

export async function generarPinUnico(): Promise<string> {
  for (let i = 0; i < 25; i++) {
    const pin = String(Math.floor(100000 + Math.random() * 900000));
    const exists = await SesionLiveModel.exists({ pin });
    if (!exists) return pin;
  }
  throw new Error("No se pudo generar un PIN único");
}

type JugadorDoc = {
  userId?: string;
  nombre?: string;
  joinedAt?: Date | string;
  lastSeenAt?: Date | string;
};

export function filtrarJugadoresActivos(players: JugadorDoc[], status: string) {
  if (status !== "lobby") return players;
  const cutoff = Date.now() - PRESENCE_MS_LOBBY;
  return players.filter((p) => {
    const seen = p.lastSeenAt ? new Date(p.lastSeenAt).getTime() : 0;
    return seen >= cutoff;
  });
}

export function serializarSesion(
  doc: Record<string, unknown>,
  serverTime = Date.now()
): SesionLive & { serverTime: number } {
  const base = serializarDocumento(doc as Parameters<typeof serializarDocumento>[0]);
  const status = String(base.status ?? "lobby");
  const players = filtrarJugadoresActivos(
    (base.players as Array<Record<string, unknown>>) ?? [],
    status
  ).map((p) => ({
    userId: String(p.userId),
    nombre: String(p.nombre),
    joinedAt: p.joinedAt
      ? new Date(p.joinedAt as string).toISOString()
      : new Date().toISOString(),
    lastSeenAt: p.lastSeenAt
      ? new Date(p.lastSeenAt as string).toISOString()
      : new Date().toISOString(),
  }));

  return {
    id: base.id,
    pin: String(base.pin),
    quizId: String(base.quizId),
    docenteId: String(base.docenteId),
    sessionName: String(base.sessionName ?? ""),
    status: status as SesionLive["status"],
    currentQuestion: Number(base.currentQuestion ?? 0),
    qScheduledAt: base.qScheduledAt
      ? new Date(base.qScheduledAt as string).toISOString()
      : null,
    qTimeLimitSec: Number(base.qTimeLimitSec ?? 30),
    players,
    startedAt: base.startedAt
      ? new Date(base.startedAt as string).toISOString()
      : null,
    endedAt: base.endedAt
      ? new Date(base.endedAt as string).toISOString()
      : null,
    creadoEn: base.creadoEn
      ? new Date(base.creadoEn as string).toISOString()
      : new Date().toISOString(),
    serverTime,
  };
}
