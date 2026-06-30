import { useCallback, useEffect, useRef, useState } from "react";
import type { SesionLive } from "@/app/types/sesion";
import { SOCKET_EVENTS, type SesionUpdatePayload } from "@/app/types/socket";
import { obtenerSesion } from "@/lib/client/services/sesiones";
import { obtenerSocket } from "@/lib/client/socket";

const HEARTBEAT_MS = 15000;
/** Fallback REST si WebSocket no conecta (proxy, red restrictiva) */
const FALLBACK_POLL_MS = 10000;

/**
 * Hook principal para sesiones live.
 *
 * 1. Carga inicial: GET /api/sesiones/[pin] (Mongo)
 * 2. Tiempo real: Socket.io `sesion:update` (push)
 * 3. Reconexión: socket.io auto-reconnect + `sesion:join` + snapshot
 * 4. Fallback: poll cada 10s solo si el socket está caído
 */
export function useSesionLive(
  pin: string | null,
  options?: { heartbeat?: boolean }
) {
  const [sesion, setSesion] = useState<SesionLive | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);

  const pinRef = useRef(pin);
  pinRef.current = pin;

  const aplicarSesion = useCallback((data: SesionUpdatePayload | SesionLive) => {
    if (data.serverTime) {
      setServerOffsetMs(data.serverTime - Date.now());
    }
    setSesion(data);
    setError(null);
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (!pinRef.current) return null;
    try {
      const data = await obtenerSesion(pinRef.current);
      aplicarSesion(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar sesión");
      return null;
    }
  }, [aplicarSesion]);

  useEffect(() => {
    if (!pin) {
      setLoading(false);
      setSesion(null);
      return;
    }

    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [pin, refresh]);

  useEffect(() => {
    if (!pin) return;

    const socket = obtenerSocket();

    const onUpdate = (data: SesionUpdatePayload) => {
      if (data.pin !== pinRef.current) return;
      aplicarSesion(data);
    };

    const onSocketError = (payload: { message?: string }) => {
      setError(payload?.message ?? "Error de socket");
    };

    const unirseASesion = () => {
      socket.emit(SOCKET_EVENTS.SESION_JOIN, { pin: pinRef.current });
    };

    const onConnect = () => {
      setSocketConnected(true);
      setError(null);
      unirseASesion();
    };

    const onDisconnect = () => {
      setSocketConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(SOCKET_EVENTS.SESION_UPDATE, onUpdate);
    socket.on(SOCKET_EVENTS.SESION_ERROR, onSocketError);
    socket.io.on("reconnect", unirseASesion);

    if (!socket.connected) {
      socket.connect();
    } else {
      onConnect();
    }

    return () => {
      socket.emit(SOCKET_EVENTS.SESION_LEAVE, { pin });
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(SOCKET_EVENTS.SESION_UPDATE, onUpdate);
      socket.off(SOCKET_EVENTS.SESION_ERROR, onSocketError);
      socket.io.off("reconnect", unirseASesion);
    };
  }, [pin, aplicarSesion]);

  useEffect(() => {
    if (!pin || socketConnected) return;

    const pollId = setInterval(() => {
      refresh();
    }, FALLBACK_POLL_MS);

    return () => clearInterval(pollId);
  }, [pin, socketConnected, refresh]);

  useEffect(() => {
    if (!pin || !options?.heartbeat) return;

    const socket = obtenerSocket();

    const tick = () => {
      if (socket.connected) {
        socket.emit(SOCKET_EVENTS.SESION_HEARTBEAT, { pin });
      } else {
        refresh();
      }
    };

    tick();
    const heartbeatId = setInterval(tick, HEARTBEAT_MS);
    return () => clearInterval(heartbeatId);
  }, [pin, options?.heartbeat, refresh]);

  return {
    sesion,
    serverOffsetMs,
    error,
    loading,
    socketConnected,
    refresh,
  };
}
