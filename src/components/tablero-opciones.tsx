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
}

/** Botones apilados con paleta institucional (proyección y play). */
export function TableroOpciones({
  opciones,
  seleccionada,
  seleccionadas = [],
  modoMultiple = false,
  deshabilitado,
  onSeleccionar,
}: TableroOpcionesProps) {
  return (
    <div className="tablero-opciones">
      {opciones.map((opt, i) => {
        const color = CLASES_COLOR[i % CLASES_COLOR.length];
        const letra = letraOpcionTablero(i);
        const seleccion = modoMultiple
          ? seleccionadas.includes(opt.id)
          : seleccionada === opt.id;
        const clases = `tablero-opcion ${color}${
          seleccion ? " tablero-opcion-seleccionada" : ""
        }`;

        if (onSeleccionar) {
          return (
            <button
              key={opt.id || i}
              type="button"
              disabled={deshabilitado}
              onClick={() => onSeleccionar(opt.id)}
              className={clases}
            >
              <span className="tablero-opcion-letra">{letra}</span>
              <span className="tablero-opcion-texto" title={opt.text}>{opt.text}</span>
            </button>
          );
        }

        return (
          <div key={opt.id || i} className={clases}>
            <span className="tablero-opcion-letra">{letra}</span>
            <span className="tablero-opcion-texto" title={opt.text}>{opt.text}</span>
          </div>
        );
      })}
    </div>
  );
}
