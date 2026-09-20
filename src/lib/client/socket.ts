"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

function normalizarBasePath(input?: string | null): string {
  const value = (input ?? "").trim();
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

/**
 * Cliente Socket.io singleton.
 * - Misma origin que la app (cookie JWT via withCredentials)
 * - Reconexión automática incluida por socket.io-client
 */
export function obtenerSocket(): Socket {
  if (!socket) {
    const url = process.env.NEXT_PUBLIC_SOCKET_URL || undefined;
    const socketPath =
      process.env.NEXT_PUBLIC_SOCKET_PATH?.trim() ||
      `${normalizarBasePath(process.env.NEXT_PUBLIC_BASE_PATH)}/api/socket` ||
      "/api/socket";

    socket = io(url, {
      path: socketPath,
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
