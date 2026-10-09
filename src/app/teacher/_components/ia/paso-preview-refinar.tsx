"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Pregunta } from "@/app/types/pregunta";
import { TipoPregunta, isMultipleOpcion } from "@/app/types/pregunta";
import { ImagenPreguntaField } from "@/app/teacher/_components/imagen-pregunta-field";

function etiquetaTipo(pregunta: Pregunta): string {
  if (pregunta.requiereCorreccionManual) return "Respuesta corta (legacy)";
  switch (pregunta.tipo) {
    case TipoPregunta.VERDADERO_FALSO:
      return "Falso/verdadero";
    case TipoPregunta.MULTIPLE_OPCION:
      return isMultipleOpcion(pregunta) && pregunta.permiteMultiples
        ? "Opción múltiple"
        : "Opción única";
    case TipoPregunta.RESPUESTA_CORTA:
      return "Respuesta exacta";
    default:
      return "Pregunta";
  }
}

function opcionesPreviewDesdePregunta(p: Pregunta): string[] | undefined {
  if (p.tipo === TipoPregunta.VERDADERO_FALSO) {
    return ["Verdadero", "Falso"];
  }
  if (isMultipleOpcion(p) && p.opciones?.length) {
    return p.opciones;
  }
  return undefined;
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
  const [imagenPorPregunta, setImagenPorPregunta] = useState<
    Record<string, string | undefined>
  >(() => {
    const inicial: Record<string, string | undefined> = {};
    for (const p of preguntas) {
      if (p.id) {
        inicial[p.id] = (p as Pregunta & { imagenReferencia?: string })
          .imagenReferencia;
      }
    }
    return inicial;
  });

  useEffect(() => {
    setImagenPorPregunta((prev) => {
      const next = { ...prev };
      for (const p of preguntas) {
        if (!p.id) continue;
        const ref = (p as Pregunta & { imagenReferencia?: string }).imagenReferencia;
        if (next[p.id] === undefined && ref) {
          next[p.id] = ref;
        }
      }
      return next;
    });
  }, [preguntas]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{titulo}</h2>
          <p className="text-sm text-muted-foreground">
            {preguntas.length} preguntas · versión {version}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href={`/teacher/quiz/${quizId}/edit/`} className="w-full sm:w-auto">
            <Button variant="outline" className="min-h-11 w-full">
              Editar manualmente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/teacher/" className="w-full sm:w-auto">
            <Button variant="secondary" className="min-h-11 w-full">Ir al panel</Button>
          </Link>
        </div>
      </div>

      <div className="space-y-3 max-h-[min(70vh,560px)] overflow-y-auto pr-1">
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
            <CardContent className="py-2 px-4 text-sm text-muted-foreground space-y-3">
              {p.tipo === TipoPregunta.RESPUESTA_CORTA && (
                  <p className="mb-1 text-primary">
                    Respuesta esperada:{" "}
                    <span className="font-medium text-foreground">
                      {String(
                        Array.isArray(p.respuestaCorrecta)
                          ? p.respuestaCorrecta[0]
                          : p.respuestaCorrecta ??
                            (p as Pregunta & { criteriosEvaluacion?: string })
                              .criteriosEvaluacion ??
                            "—"
                      )}
                    </span>
                  </p>
                )}
              {"opciones" in p && p.opciones && p.opciones.length > 0 && (
                <ul className="list-disc list-inside">
                  {p.opciones.map((op, j) => (
                    <li key={j}>{op}</li>
                  ))}
                </ul>
              )}
              {p.criteriosEvaluacion && p.requiereCorreccionManual && (
                <p className="mt-1 italic text-muted-foreground">
                  Criterio legacy (revisa y acorta en edición): {p.criteriosEvaluacion}
                </p>
              )}
              {p.explicacion && (
                <p className="mt-1">Explicación: {p.explicacion}</p>
              )}
              {p.id ? (
                <ImagenPreguntaField
                  preguntaId={p.id}
                  imagenReferencia={imagenPorPregunta[p.id]}
                  textoPregunta={p.texto}
                  opcionesPreview={opcionesPreviewDesdePregunta(p)}
                  etiquetaTipo={etiquetaTipo(p)}
                  onChange={(ref) => {
                    setImagenPorPregunta((prev) => ({
                      ...prev,
                      [p.id!]: ref,
                    }));
                  }}
                />
              ) : null}
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
