"use client";

const CLASES_COLOR = [
  "tablero-opcion-navy",
  "tablero-opcion-naranja",
  "tablero-opcion-oro",
  "tablero-opcion-crema",
] as const;

function letraOpcionTablero(index: number): string {
  return String.fromCharCode(65 + index);
}

export interface OpcionTablero {
  id: string;
  text: string;
}

interface TableroOpcionesProps {
  opciones: OpcionTablero[];
  seleccionada?: string | null;
  seleccionadas?: string[];
  modoMultiple?: boolean;
  deshabilitado?: boolean;
  onSeleccionar?: (id: string) => void;
  /** Tras calificar: ids que el servidor marcó como correctos. */
  revelar?: boolean;
  idsCorrectos?: string[];
}

/** Botones apilados con paleta institucional (proyección y play). */
export function TableroOpciones({
  opciones,
  seleccionada,
  seleccionadas = [],
  modoMultiple = false,
  deshabilitado,
  onSeleccionar,
  revelar = false,
  idsCorrectos = [],
}: TableroOpcionesProps) {
  return (
    <div className="tablero-opciones" role="group" aria-label="Opciones de respuesta">
      {opciones.map((opt, i) => {
        const color = CLASES_COLOR[i % CLASES_COLOR.length];
        const letra = letraOpcionTablero(i);
        const seleccion = modoMultiple
          ? seleccionadas.includes(opt.id)
          : seleccionada === opt.id;
        const esCorrecta = revelar && idsCorrectos.includes(opt.id);
        const esIncorrecta = revelar && seleccion && !esCorrecta;
        const apagada = revelar && !esCorrecta && !seleccion;
        const marca = esCorrecta ? "✓" : esIncorrecta ? "✗" : seleccion ? "✓" : letra;
        const estado = esCorrecta
          ? "Correcta"
          : esIncorrecta
            ? "Incorrecta"
            : seleccion
              ? "Seleccionada"
              : "";
        const clases = [
          "tablero-opcion",
          "qq-opcion-entra",
          color,
          seleccion ? "tablero-opcion-seleccionada" : "",
          esCorrecta ? "tablero-opcion-correcta" : "",
          esIncorrecta ? "tablero-opcion-incorrecta" : "",
          apagada ? "tablero-opcion-apagada" : "",
        ]
          .filter(Boolean)
          .join(" ");

        const contenido = (
          <>
            <span className="tablero-opcion-letra" aria-hidden="true">
              {marca}
            </span>
            <span className="tablero-opcion-texto" title={opt.text}>
              {opt.text}
            </span>
            {estado ? (
              <span className="qq-label shrink-0" style={{ letterSpacing: "0.08em" }}>
                {estado}
              </span>
            ) : (
              <span className="sr-only">Opción {letra}</span>
            )}
          </>
        );

        if (onSeleccionar) {
          return (
            <button
              key={opt.id || i}
              type="button"
              disabled={deshabilitado}
              aria-pressed={seleccion}
              onClick={() => onSeleccionar(opt.id)}
              className={clases}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              {contenido}
            </button>
          );
        }

        return (
          <div key={opt.id || i} className={clases} style={{ animationDelay: `${i * 50}ms` }}>
            {contenido}
          </div>
        );
      })}
    </div>
  );
}
