"use client";

import { useEffect, useRef, useState } from "react";

interface RelojProps {
  formatted: string;
  timeLeft: number;
  progress: number;
  etiqueta?: string;
}

function colorRestante(progress: number) {
  if (progress > 50) return "var(--qq-navy)";
  if (progress > 20) return "var(--qq-gold)";
  return "var(--qq-orange)";
}

export function TimerPill({ formatted, timeLeft, progress, etiqueta }: RelojProps) {
  const [anuncio, setAnuncio] = useState("");
  const vistos = useRef<Set<number>>(new Set());

  useEffect(() => {
    vistos.current = new Set();
    setAnuncio("");
  }, [etiqueta]);

  useEffect(() => {
    if ((timeLeft === 10 || timeLeft === 5) && !vistos.current.has(timeLeft)) {
      vistos.current.add(timeLeft);
      setAnuncio(
        timeLeft === 10 ? "Quedan 10 segundos." : "Quedan 5 segundos. Últimos segundos."
      );
    }
  }, [timeLeft]);

  const urgente = timeLeft > 0 && timeLeft <= 5;
  const color = colorRestante(progress);

  return (
    <div className={urgente ? "qq-timer qq-timer-tic" : "qq-timer"}>
      <span className="qq-timer-num" style={{ color }}>
        {formatted}
      </span>
      <span className="qq-timer-bar" aria-hidden="true">
        <span
          style={{
            width: `${Math.max(0, Math.min(100, progress))}%`,
            background: color,
          }}
        />
      </span>
      {urgente ? <span className="text-xs font-bold uppercase">Últimos segundos</span> : null}
      <span className="sr-only" aria-live="polite">
        {anuncio}
      </span>
    </div>
  );
}

export function TimerAnillo({ formatted, progress, timeLeft }: RelojProps) {
  const radio = 42;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia * (1 - Math.max(0, Math.min(100, progress)) / 100);
  const color = colorRestante(progress);
  return (
    <div className="qq-anillo relative" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radio} fill="none" stroke="var(--qq-line)" strokeWidth="6" />
        <circle
          cx="50" cy="50" r={radio} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circunferencia} strokeDashoffset={offset} strokeLinecap="butt"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-xl font-bold tabular-nums" style={{ color }}>
        {timeLeft <= 5 && timeLeft > 0 ? formatted : formatted}
      </span>
    </div>
  );
}

interface BarraTiempoSesionProps extends RelojProps {
  anillo?: boolean;
}

/** Reloj compartido por docente y estudiante. */
export function BarraTiempoSesion({
  formatted,
  timeLeft,
  progress,
  etiqueta,
  anillo = false,
}: BarraTiempoSesionProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      {etiqueta ? <p className="qq-label min-w-0">{etiqueta}</p> : <span />}
      <div className="flex items-center gap-3">
        <TimerPill formatted={formatted} timeLeft={timeLeft} progress={progress} etiqueta={etiqueta} />
        {anillo ? (
          <TimerAnillo formatted={formatted} timeLeft={timeLeft} progress={progress} />
        ) : null}
      </div>
    </div>
  );
}
