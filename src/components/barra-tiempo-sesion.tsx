"use client";

import { Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface BarraTiempoSesionProps {
  formatted: string;
  timeLeft: number;
  progress: number;
  etiqueta?: string;
}

/** Reloj y barra iguales en docente y estudiante; pulsa bajo 10 s. */
export function BarraTiempoSesion({
  formatted,
  timeLeft,
  progress,
  etiqueta,
}: BarraTiempoSesionProps) {
  const urgente = timeLeft <= 10;

  return (
    <div
      className={`quiz-timer-bar ${urgente ? "quiz-timer-bar-urgente" : ""}`}
      role="timer"
      aria-live="polite"
      aria-label={`Tiempo restante ${formatted}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        {etiqueta ? (
          <span className="text-sm font-medium text-muted-foreground truncate min-w-0">
            {etiqueta}
          </span>
        ) : (
          <span className="text-sm font-medium text-muted-foreground">Tiempo</span>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <Clock
            className={`h-5 w-5 ${
              urgente ? "text-destructive icono-reloj-urgente" : "text-primary"
            }`}
            aria-hidden="true"
          />
          <span
            className={`text-xl sm:text-2xl font-bold tabular-nums ${
              urgente ? "text-destructive" : "text-primary"
            }`}
          >
            {formatted}
          </span>
        </div>
      </div>
      <Progress
        value={progress}
        className={`h-2.5 sm:h-3 ${urgente ? "[&>div]:bg-destructive" : ""}`}
      />
    </div>
  );
}
