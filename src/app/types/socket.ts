import type { SesionLive } from "./sesion";

/** Eventos Socket.io — deben coincidir en cliente y servidor */
export const SOCKET_EVENTS = {
  /** Cliente → servidor: unirse a la sala de una sesión (PIN) */
  SESION_JOIN: "sesion:join",
  /** Cliente → servidor: abandonar sala */
  SESION_LEAVE: "sesion:leave",
  /** Cliente → servidor: latido de presencia (lobby) */
  SESION_HEARTBEAT: "sesion:heartbeat",
  /** Servidor → clientes: estado actualizado de la sesión */
  SESION_UPDATE: "sesion:update",
  /** Servidor → cliente: error al unirse o autenticar */
  SESION_ERROR: "sesion:error",
} as const;

export type SocketEventName =
  (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export interface SesionJoinPayload {
  pin: string;
}

export interface SesionLeavePayload {
  pin: string;
}

export interface SesionHeartbeatPayload {
  pin: string;
}

/** Payload emitido en cada cambio de sesión (desde Mongo, serializado) */
export type SesionUpdatePayload = SesionLive & { serverTime: number };

export function roomSesion(pin: string): string {
  return `sesion:${pin}`;
}
