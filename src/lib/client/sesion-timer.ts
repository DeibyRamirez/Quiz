/**
 * Timer sincronizado con la sesión live (qScheduledAt + qTimeLimitSec + serverTime).
 * Usar el mismo cálculo en docente y estudiante.
 */

export function calcularTiempoRestanteSegundos(
  qScheduledAt: string | null | undefined,
  qTimeLimitSec: number | undefined,
  serverOffsetMs: number
): number {
  if (!qScheduledAt || !qTimeLimitSec) return 0;
  const startMs = new Date(qScheduledAt).getTime();
  const elapsedMs = Date.now() + serverOffsetMs - startMs;
  const remaining = Math.ceil(qTimeLimitSec - elapsedMs / 1000);
  return Math.min(qTimeLimitSec, Math.max(0, remaining));
}

export function formatearTiempoRestante(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function calcularProgresoTimer(timeLeft: number, limitSec: number): number {
  if (limitSec <= 0) return 0;
  return Math.min(100, Math.max(0, (timeLeft / limitSec) * 100));
}

/** True solo cuando el countdown ya empezó y el tiempo llegó a cero. */
export function timerSesionExpirado(
  qScheduledAt: string | null | undefined,
  qTimeLimitSec: number | undefined,
  serverOffsetMs: number
): boolean {
  if (!qScheduledAt || !qTimeLimitSec) return false;
  const startMs = new Date(qScheduledAt).getTime();
  const endMs = startMs + qTimeLimitSec * 1000;
  return Date.now() + serverOffsetMs >= endMs;
}
