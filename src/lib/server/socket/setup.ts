import type { Server as SocketIOServer } from "socket.io";
import type { Socket } from "socket.io";
import { RolUsuario } from "@/app/types/usuario";
import { COOKIE_NAME, verifyToken } from "@/lib/server/auth/jwt";
import type { JwtPayload } from "@/lib/server/auth/jwt";
import { conectarDB } from "@/lib/server/database";
import { SesionLiveModel } from "@/lib/server/models/SesionLive";
import { serializarSesion } from "@/lib/server/services/sesion-helpers";
import {
  SOCKET_EVENTS,
  roomSesion,
  type SesionHeartbeatPayload,
  type SesionJoinPayload,
  type SesionLeavePayload,
} from "@/app/types/socket";
import { emitirActualizacionSesion } from "./broadcast";
import { parseCookies } from "./parse-cookies";

async function puedeEscucharSesion(
  sesion: { docenteId: string; quizId: string; players: Array<{ userId: string }> },
  user: JwtPayload
): Promise<boolean> {
  if (sesion.docenteId === user.sub) return true;
  if (user.rol === RolUsuario.ADMINISTRADOR) return true;
  return sesion.players.some((p) => p.userId === user.sub);
}

export function configurarSocketIO(io: SocketIOServer): void {
  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = cookies[COOKIE_NAME];
      if (!token) {
        return next(new Error("No autenticado"));
      }
      const payload = await verifyToken(token);
      if (!payload) {
        return next(new Error("Token inválido"));
      }
      socket.data.user = payload as JwtPayload;
      next();
    } catch (err) {
      next(err instanceof Error ? err : new Error("Error de autenticación"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as JwtPayload | undefined;

    socket.on(SOCKET_EVENTS.SESION_JOIN, async (payload: SesionJoinPayload) => {
      const pin = payload?.pin?.trim();
      if (!pin || pin.length !== 6 || !user) {
        socket.emit(SOCKET_EVENTS.SESION_ERROR, {
          message: "PIN inválido",
        });
        return;
      }

      try {
        await conectarDB();
        const sesion = await SesionLiveModel.findOne({ pin }).lean();
        if (!sesion) {
          socket.emit(SOCKET_EVENTS.SESION_ERROR, {
            message: "Sesión no encontrada",
          });
          return;
        }

        if (!(await puedeEscucharSesion(sesion, user))) {
          socket.emit(SOCKET_EVENTS.SESION_ERROR, {
            message: "No estás registrado en esta sesión",
          });
          return;
        }

        await socket.join(roomSesion(pin));
        socket.data.sesionPin = pin;

        socket.emit(SOCKET_EVENTS.SESION_UPDATE, serializarSesion(sesion));
      } catch (err) {
        console.error("[socket] sesion:join", err);
        socket.emit(SOCKET_EVENTS.SESION_ERROR, {
          message: "Error al unirse a la sala",
        });
      }
    });

    socket.on(SOCKET_EVENTS.SESION_LEAVE, async (payload: SesionLeavePayload) => {
      const pin = payload?.pin?.trim();
      if (!pin) return;
      await socket.leave(roomSesion(pin));
      if (socket.data.sesionPin === pin) {
        socket.data.sesionPin = undefined;
      }
    });

    socket.on(
      SOCKET_EVENTS.SESION_HEARTBEAT,
      async (payload: SesionHeartbeatPayload) => {
        const pin = payload?.pin?.trim();
        if (!pin || !user) return;

        try {
          await conectarDB();
          const sesion = await SesionLiveModel.findOne({ pin });
          if (!sesion) return;

          const player = sesion.players.find((p) => p.userId === user.sub);
          if (player) {
            player.lastSeenAt = new Date();
            await sesion.save();
            if (sesion.status === "lobby") {
              await emitirActualizacionSesion(pin, sesion.toObject());
            }
          }
        } catch (err) {
          console.error("[socket] sesion:heartbeat", err);
        }
      }
    );

    socket.on("disconnect", () => {
      socket.data.sesionPin = undefined;
    });
  });
}
