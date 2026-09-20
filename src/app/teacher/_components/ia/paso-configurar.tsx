"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConfigGeneracion, TipoPreguntaIa } from "@/app/types/quiz-ia";
import { TIPOS_PREGUNTA_IA } from "@/app/types/quiz-ia";

const ETIQUETAS_TIPO: Record<TipoPreguntaIa, string> = {
  true_false: "Verdadero / Falso",
  single_choice: "Opción única",
  multi_choice: "Opción múltiple",
  open_text: "Desarrollo",
};

interface PasoConfigurarProps {
  tituloGuia: string;
  estimacionTokens: number;
  enCache: boolean;
  onGenerar: (titulo: string, config: ConfigGeneracion) => void;
  generando: boolean;
}

export function PasoConfigurar({
  tituloGuia,
  estimacionTokens,
  enCache,
  onGenerar,
  generando,
}: PasoConfigurarProps) {
  const [tituloQuiz, setTituloQuiz] = useState(`Quiz — ${tituloGuia}`);
  const [totalPreguntas, setTotalPreguntas] = useState(10);
  const [distribucion, setDistribucion] = useState<Record<TipoPreguntaIa, number>>({
    true_false: 2,
    single_choice: 4,
    multi_choice: 2,
    open_text: 2,
  });

  const suma = useMemo(
    () => TIPOS_PREGUNTA_IA.reduce((acc, t) => acc + distribucion[t], 0),
    [distribucion]
  );

  const distribucionValida = suma === totalPreguntas;

  const ajustarDistribucion = (tipo: TipoPreguntaIa, valor: number) => {
    setDistribucion((prev) => ({ ...prev, [tipo]: Math.max(0, valor) }));
  };

  const distribuirAutomaticamente = () => {
    const base = Math.floor(totalPreguntas / 4);
    const resto = totalPreguntas - base * 4;
    setDistribucion({
      true_false: base + (resto > 0 ? 1 : 0),
      single_choice: base + (resto > 1 ? 1 : 0),
      multi_choice: base + (resto > 2 ? 1 : 0),
      open_text: base,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Configurar quiz</h2>
        <p className="text-sm text-muted-foreground">
          Guía: <strong>{tituloGuia}</strong> · ~{Math.round(estimacionTokens)} tokens
          {enCache && " · contenido en caché"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="titulo-quiz">Título del quiz</Label>
        <Input
          id="titulo-quiz"
          value={tituloQuiz}
          onChange={(e) => setTituloQuiz(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total-preguntas">Total de preguntas (1–50)</Label>
        <Input
          id="total-preguntas"
          type="number"
          min={1}
          max={50}
          value={totalPreguntas}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (!Number.isNaN(v)) {
              setTotalPreguntas(Math.min(50, Math.max(1, v)));
            }
          }}
          className="w-32"
        />
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label>Distribución por tipo</Label>
          <Button type="button" variant="outline" size="sm" onClick={distribuirAutomaticamente}>
            Distribuir equitativamente
          </Button>
        </div>

        {TIPOS_PREGUNTA_IA.map((tipo) => (
          <div key={tipo} className="flex items-center gap-4">
            <span className="text-sm w-40 shrink-0">{ETIQUETAS_TIPO[tipo]}</span>
            <Input
              type="number"
              min={0}
              max={totalPreguntas}
              className="w-20"
              value={distribucion[tipo]}
              onChange={(e) =>
                ajustarDistribucion(tipo, parseInt(e.target.value, 10) || 0)
              }
            />
          </div>
        ))}

        <p
          className={`text-sm ${distribucionValida ? "text-muted-foreground" : "text-destructive"}`}
        >
          Suma actual: {suma} / {totalPreguntas}
          {!distribucionValida && " — la suma debe igualar el total"}
        </p>
      </div>

      <Button
        className="btn-primary"
        disabled={!tituloQuiz.trim() || !distribucionValida || generando}
        onClick={() =>
          onGenerar(tituloQuiz.trim(), {
            totalPreguntas,
            distribucion,
          })
        }
      >
        {generando ? "Generando con IA..." : "Generar quiz"}
      </Button>
    </div>
  );
}
