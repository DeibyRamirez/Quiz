/**
 * Reloj de la pregunta según qScheduledAt y qTimeLimitSec guardados en la sesión.
 * El timeLeft que envía el cliente no entra en este cálculo.
 */
export type EstadoRelojPregunta = "abierta" | "tarde" | "sin-reloj";

export function evaluarRelojPregunta(
  qScheduledAt: Date | string | null | undefined,
  qTimeLimitSec: number | null | undefined,
  ahoraMs = Date.now()
): { estado: EstadoRelojPregunta; timeLeft: number; timeLimit: number } {
  const timeLimit = Number(qTimeLimitSec ?? 0);
  if (!qScheduledAt || !Number.isFinite(timeLimit) || timeLimit <= 0) {
    return { estado: "sin-reloj", timeLeft: 0, timeLimit: 0 };
  }

  const startMs = new Date(qScheduledAt).getTime();
  if (Number.isNaN(startMs)) {
    return { estado: "sin-reloj", timeLeft: 0, timeLimit };
  }

  const elapsedSec = (ahoraMs - startMs) / 1000;
  if (elapsedSec >= timeLimit) {
    return { estado: "tarde", timeLeft: 0, timeLimit };
  }

  // Misma fórmula que el reloj del cliente (ceil), acotada al límite.
  // Si qScheduledAt está unos segundos en el futuro, el visible es el máximo.
  const restante = Math.ceil(timeLimit - elapsedSec);
  const timeLeft = Math.min(timeLimit, Math.max(0, restante));
  return { estado: "abierta", timeLeft, timeLimit };
}

export function puntosPorTiempo(
  correcta: boolean,
  timeLeft: number,
  timeLimit: number,
  basePoints: number
): number {
  if (!correcta) return 0;
  const limite = timeLimit > 0 ? timeLimit : 30;
  const base = basePoints > 0 ? basePoints : 1000;
  const restante = Math.min(limite, Math.max(0, timeLeft));
  return Math.round((restante / limite) * base);
}
