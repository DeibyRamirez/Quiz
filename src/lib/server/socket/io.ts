import type { Server as SocketIOServer } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var __socketIO: SocketIOServer | undefined;
}

/** Registra la instancia de Socket.io (solo en server.ts) */
export function setSocketIO(io: SocketIOServer): void {
  global.__socketIO = io;
}

/** Obtiene Socket.io desde rutas API u otros módulos del servidor */
export function getSocketIO(): SocketIOServer | null {
  return global.__socketIO ?? null;
}

export function isSocketIOActivo(): boolean {
  return Boolean(global.__socketIO);
}
