import { useEffect, useState } from "react";
import type { SesionLive } from "@/app/types/sesion";
import {
  calcularProgresoTimer,
  calcularTiempoRestanteSegundos,
  formatearTiempoRestante,
} from "@/lib/client/sesion-timer";

/**
 * Timer de sesión live — misma lógica que el panel del docente.
 */
export function useSesionTimer(
  session: SesionLive | null | undefined,
  serverOffsetMs: number,
  options?: { paused?: boolean }
) {
  const paused = options?.paused ?? false;
  const limitSec = session?.qTimeLimitSec ?? 30;

  const calcularActual = () => {
    if (
      paused ||
      session?.status !== "active" ||
      !session?.qScheduledAt ||
      !session?.qTimeLimitSec
    ) {
      return 0;
    }
    return calcularTiempoRestanteSegundos(
      session.qScheduledAt,
      session.qTimeLimitSec,
      serverOffsetMs
    );
  };

  const [timeLeft, setTimeLeft] = useState(calcularActual);

  useEffect(() => {
    const actual = calcularActual();
    setTimeLeft(actual);

    if (
      paused ||
      session?.status !== "active" ||
      !session?.qScheduledAt ||
      !session?.qTimeLimitSec
    ) {
      return;
    }

    const scheduledAt = session.qScheduledAt;
    const limit = session.qTimeLimitSec;

    const tick = () => {
      setTimeLeft(
        calcularTiempoRestanteSegundos(scheduledAt, limit, serverOffsetMs)
      );
    };

    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [
    paused,
    session?.status,
    session?.qScheduledAt,
    session?.qTimeLimitSec,
    serverOffsetMs,
  ]);

  const progress = calcularProgresoTimer(timeLeft, limitSec);
  const formatted = formatearTiempoRestante(timeLeft);

  return { timeLeft, limitSec, progress, formatted };
}
