"use client";

import { Medal, Trophy } from "lucide-react";

export interface EntradaPodio {
  nombre: string;
  puntos: number;
  destacado?: boolean;
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letras = partes.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return letras || "?";
}

function AvatarIniciales({
  nombre,
  tamano,
  tono,
}: {
  nombre: string;
  tamano: "sm" | "md" | "lg";
  tono: "oro" | "navy" | "naranja" | "crema";
}) {
  const medida =
    tamano === "lg"
      ? "w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl"
      : tamano === "md"
        ? "w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl"
        : "w-10 h-10 text-sm";

  const fondo =
    tono === "oro"
      ? "bg-accent text-accent-foreground"
      : tono === "naranja"
        ? "bg-secondary text-secondary-foreground"
        : tono === "navy"
          ? "bg-primary text-primary-foreground"
          : "bg-card text-primary border border-border";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold shadow-lg ${medida} ${fondo}`}
      aria-hidden="true"
    >
      {iniciales(nombre)}
    </span>
  );
}

interface PodioKahootProps {
  ranking: EntradaPodio[];
  titulo?: string;
}

/** Top 3 con medallas e iniciales; el resto en lista. Fondo navy/cream. */
export function PodioKahoot({ ranking, titulo = "Podio" }: PodioKahootProps) {
  if (ranking.length === 0) return null;

  const primero = ranking[0];
  const segundo = ranking[1];
  const tercero = ranking[2];
  const resto = ranking.slice(3);

  return (
    <section className="podio-kahoot" aria-label={titulo}>
      <h2 className="podio-kahoot-titulo">{titulo}</h2>

      <div className="podio-kahoot-top3">
        <div className="podio-kahoot-puesto podio-kahoot-segundo">
          {segundo ? (
            <>
              <AvatarIniciales nombre={segundo.nombre} tamano="md" tono="navy" />
              <Medal className="podio-kahoot-medalla text-primary" aria-hidden="true" />
              <p className="podio-kahoot-puesto-num">2°</p>
              <p className="podio-kahoot-nombre" title={segundo.nombre}>
                {segundo.nombre}
              </p>
              <p className="podio-kahoot-puntos">{segundo.puntos} pts</p>
            </>
          ) : null}
        </div>

        <div className="podio-kahoot-puesto podio-kahoot-primero">
          {primero ? (
            <>
              <Trophy className="icono-trofeo-podio text-accent" aria-hidden="true" />
              <AvatarIniciales nombre={primero.nombre} tamano="lg" tono="oro" />
              <p className="podio-kahoot-puesto-num">1°</p>
              <p className="podio-kahoot-nombre" title={primero.nombre}>
                {primero.nombre}
              </p>
              <p className="podio-kahoot-puntos">{primero.puntos} pts</p>
            </>
          ) : null}
        </div>

        <div className="podio-kahoot-puesto podio-kahoot-tercero">
          {tercero ? (
            <>
              <AvatarIniciales
                nombre={tercero.nombre}
                tamano="md"
                tono="naranja"
              />
              <Medal className="podio-kahoot-medalla text-secondary" aria-hidden="true" />
              <p className="podio-kahoot-puesto-num">3°</p>
              <p className="podio-kahoot-nombre" title={tercero.nombre}>
                {tercero.nombre}
              </p>
              <p className="podio-kahoot-puntos">{tercero.puntos} pts</p>
            </>
          ) : null}
        </div>
      </div>

      {resto.length > 0 ? (
        <ol className="podio-kahoot-lista">
          {resto.map((entrada, i) => (
            <li
              key={`${entrada.nombre}-${i}`}
              className={`podio-kahoot-fila${
                entrada.destacado ? " podio-kahoot-fila-destacada" : ""
              }`}
            >
              <span className="podio-kahoot-fila-puesto tabular-nums">
                {i + 4}
              </span>
              <AvatarIniciales nombre={entrada.nombre} tamano="sm" tono="crema" />
              <span className="podio-kahoot-fila-nombre truncate" title={entrada.nombre}>
                {entrada.nombre}
              </span>
              <span className="podio-kahoot-fila-puntos tabular-nums">
                {entrada.puntos} pts
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
