"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Cliente Socket.io singleton.
 * - Misma origin que la app (cookie JWT via withCredentials)
 * - Reconexión automática incluida por socket.io-client
 */
export function obtenerSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;

    socket = io(url, {
      path: "/api/socket",
      autoConnect: false,
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
}

export function desconectarSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}
