"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { lanzarConfeti } from "@/components/quiz/confetti-paleta";

interface FeedbackCardProps {
  correcta: boolean;
  puntos: number;
  total: number;
  respuesta: string;
  racha: number;
  similitud?: number | null;
}

export function FeedbackCard({
  correcta,
  puntos,
  total,
  respuesta,
  racha,
  similitud,
}: FeedbackCardProps) {
  useEffect(() => {
    if (correcta) lanzarConfeti();
  }, [correcta]);

  return (
    <div
      className={correcta ? "qq-feedback" : "qq-feedback qq-feedback-bad"}
      role="status"
      aria-live="assertive"
    >
      {correcta ? (
        <CheckCircle2 className="icono-acierto mx-auto h-10 w-10" style={{ color: "var(--qq-success)" }} aria-hidden />
      ) : (
        <XCircle className="icono-error mx-auto h-10 w-10" style={{ color: "var(--qq-error)" }} aria-hidden />
      )}
      <p className="qq-display mt-2" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)" }}>
        {correcta ? "¡Esa es!" : "Casi…"}
      </p>
      <p className="qq-plus" aria-hidden="true">
        +{puntos} pts
      </p>
      <p className="text-base font-bold">
        +{puntos} pts · total {total}
      </p>
      {respuesta ? (
        <p className="mt-2 text-base">
          Respuesta correcta: <strong>{respuesta}</strong>
        </p>
      ) : null}
      {racha > 1 ? <p className="mt-1 font-bold">Racha de {racha}</p> : null}
      {similitud != null ? (
        <p className="mt-1">Parecido al {Math.round(similitud * 100)}%</p>
      ) : null}
      <p className="qq-espera mt-3 text-base font-semibold">Esperando la siguiente</p>
    </div>
  );
}
