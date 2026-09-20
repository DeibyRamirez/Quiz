"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Pregunta } from "@/app/types/pregunta";
import { TipoPregunta, isMultipleOpcion } from "@/app/types/pregunta";

function etiquetaTipo(pregunta: Pregunta): string {
  if (pregunta.requiereCorreccionManual) return "Desarrollo";
  switch (pregunta.tipo) {
    case TipoPregunta.VERDADERO_FALSO:
      return "V/F";
    case TipoPregunta.MULTIPLE_OPCION:
      return isMultipleOpcion(pregunta) && pregunta.permiteMultiples
        ? "Multi"
        : "Única";
    case TipoPregunta.RESPUESTA_CORTA:
      return "Corta";
    default:
      return pregunta.tipo;
  }
}

interface PasoPreviewRefinarProps {
  quizId: string;
  titulo: string;
  version: number;
  preguntas: Pregunta[];
  onRefinar: (instruccion: string) => Promise<void>;
  refinando: boolean;
}

export function PasoPreviewRefinar({
  quizId,
  titulo,
  version,
  preguntas,
  onRefinar,
  refinando,
}: PasoPreviewRefinarProps) {
  const [instruccion, setInstruccion] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{titulo}</h2>
          <p className="text-sm text-muted-foreground">
            {preguntas.length} preguntas · versión {version}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/teacher/quiz/${quizId}/edit/`}>
            <Button variant="outline">
              Editar manualmente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/teacher/">
            <Button variant="secondary">Ir al panel</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
        {preguntas.map((p, i) => (
          <Card key={p.id ?? i} className="card-institutional">
            <CardHeader className="py-3 px-4">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-sm font-medium leading-snug">
                  {i + 1}. {p.texto}
                </CardTitle>
                <Badge variant="secondary" className="shrink-0">
                  {etiquetaTipo(p)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="py-2 px-4 text-sm text-muted-foreground">
              {p.requiereCorreccionManual && (
                <p className="mb-1 text-amber-600 dark:text-amber-400">
                  Corrección manual — no se califica automáticamente en vivo
                </p>
              )}
              {"opciones" in p && p.opciones && p.opciones.length > 0 && (
                <ul className="list-disc list-inside">
                  {p.opciones.map((op, j) => (
                    <li key={j}>{op}</li>
                  ))}
                </ul>
              )}
              {p.criteriosEvaluacion && (
                <p className="mt-1 italic">Criterios: {p.criteriosEvaluacion}</p>
              )}
              {p.explicacion && (
                <p className="mt-1">Explicación: {p.explicacion}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <Label htmlFor="instruccion-refinar">Refinar con IA</Label>
        </div>
        <Textarea
          id="instruccion-refinar"
          placeholder='Ej. "Haz la pregunta 3 más difícil" o "Agrega 1 pregunta de desarrollo sobre Coulomb"'
          value={instruccion}
          onChange={(e) => setInstruccion(e.target.value)}
          rows={3}
        />
        <Button
          className="btn-primary"
          disabled={instruccion.trim().length < 3 || refinando}
          onClick={() => onRefinar(instruccion.trim())}
        >
          {refinando ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Aplicando cambios...
            </>
          ) : (
            "Aplicar cambios"
          )}
        </Button>
      </div>
    </div>
  );
}
