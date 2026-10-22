"use client";

import { useState } from "react";
import { TableroOpciones } from "@/components/tablero-opciones";

const OPCIONES = [
  { id: "0", text: "Inversamente proporcional al cuadrado de la distancia" },
  { id: "1", text: "Proporcional a la distancia" },
  { id: "2", text: "No depende de las cargas" },
  { id: "3", text: "Solo aplica si las cargas son negativas" },
];

export function DemoTablero() {
  const [elegida, setElegida] = useState<string | null>(null);

  return (
    <section className="qq-section" id="demo" style={{ paddingTop: 0 }}>
      <div className="qq-wrap">
        <p className="qq-label">Prueba el tablero</p>
        <h2 className="qq-display mt-3 max-w-4xl">La ley de Coulomb dice que la fuerza…</h2>
        <p className="mt-3 max-w-xl text-[length:var(--t-body)]">
          Es una maqueta. Toca una opción y mira el feedback. En clase, el docente lleva el tiempo.
        </p>
        <div className="mt-8 max-w-3xl">
          <TableroOpciones
            opciones={OPCIONES}
            seleccionada={elegida}
            revelar={elegida !== null}
            idsCorrectos={["0"]}
            onSeleccionar={(id) => setElegida(id)}
          />
        </div>
        {elegida ? (
          <p className="mt-4 text-base font-bold" role="status" aria-live="polite">
            {elegida === "0" ? "¡Esa es! +1000 pts en esta demo." : "Casi… la correcta es la A."}
          </p>
        ) : null}
      </div>
    </section>
  );
}
