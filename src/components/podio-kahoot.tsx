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

function BloquePodio({
  entrada,
  puesto,
  clase,
  icono,
}: {
  entrada?: EntradaPodio;
  puesto: string;
  clase: string;
  icono: "trofeo" | "medalla";
}) {
  if (!entrada) return <div className="w-24 sm:w-32" aria-hidden />;
  return (
    <div
      className={`qq-podio-bloque w-24 sm:w-36 ${clase}${entrada.destacado ? " ring-4 ring-[var(--qq-ink)]" : ""}`}
    >
      {icono === "trofeo" ? (
        <Trophy className="mb-1 h-6 w-6" aria-hidden />
      ) : (
        <Medal className="mb-1 h-5 w-5" aria-hidden />
      )}
      <p className="text-sm font-black">{puesto}</p>
      <p className="max-w-full truncate text-sm font-bold" title={entrada.nombre}>
        {entrada.nombre}
      </p>
      {entrada.destacado ? <p className="text-xs font-black uppercase">Tú</p> : null}
      <p className="tabular-nums font-bold">{entrada.puntos}</p>
    </div>
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

      <div className="mt-6 flex items-end justify-center gap-2 sm:gap-3">
        <BloquePodio entrada={segundo} puesto="2°" clase="qq-podio-2" icono="medalla" />
        <BloquePodio entrada={primero} puesto="1°" clase="qq-podio-1" icono="trofeo" />
        <BloquePodio entrada={tercero} puesto="3°" clase="qq-podio-3" icono="medalla" />
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
