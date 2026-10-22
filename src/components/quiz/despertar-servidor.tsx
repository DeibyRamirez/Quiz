"use client";

import { useEffect, useState } from "react";

/** El servidor gratuito a veces tarda en despertar. Reintenta /api/health/db, que ya existe. */
export function DespertarServidor() {
  const [segundos, setSegundos] = useState(0);
  const [intentos, setIntentos] = useState(0);

  useEffect(() => {
    const reloj = window.setInterval(() => setSegundos((s) => s + 1), 1000);
    let vivo = true;
    const ping = async () => {
      while (vivo) {
        setIntentos((n) => n + 1);
        try {
          await fetch("/api/health/db", { cache: "no-store" });
        } catch {
          /* el laboratorio sigue frío */
        }
        await new Promise((resolver) => window.setTimeout(resolver, 2000));
      }
    };
    ping();
    return () => {
      vivo = false;
      window.clearInterval(reloj);
    };
  }, []);

  const ancho = Math.min(92, 15 + intentos * 12);

  return (
    <div className="page-shell flex min-h-[100dvh] items-center justify-center px-4" role="status" aria-live="polite">
      <div className="qq-card-brutal w-full max-w-lg p-6 sm:p-8">
        <p className="qq-label">Laboratorio</p>
        <h1 className="qq-display mt-3 text-[var(--qq-ink)]">Calentando el laboratorio…</h1>
        <p className="mt-4 font-mono text-3xl font-bold tabular-nums">{segundos}s</p>
        <div className="mt-4 h-4 overflow-hidden border-2 border-[var(--qq-line)] bg-[var(--qq-paper)]" aria-hidden>
          <div className="h-full bg-[var(--qq-orange)]" style={{ width: `${ancho}%` }} />
        </div>
        <p className="mt-3 text-base">Reintento {intentos}. El servidor a veces tarda en despertar.</p>
      </div>
    </div>
  );
}
