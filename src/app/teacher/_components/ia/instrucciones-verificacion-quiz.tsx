"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PASOS = [
  "Ingresa a Crear con IA.",
  "Carga la guía: debe contener texto extraíble. Si es mayormente imágenes o diapositivas sin texto, la generación no funcionará bien.",
  "Verifica la cantidad de preguntas que quieres de cada categoría (opción múltiple, opción única, verdadero/falso, etc.).",
  "Después de la creación, revisa lo que generó la IA y entra al botón Editar manualmente.",
  "En Editar manualmente, abre cada pregunta, comprueba respuestas correctas (edita si hace falta) y pulsa Actualizar pregunta en todas, una por una.",
  "Cuando hayas actualizado cada pregunta activa, usa Quiz verificado por mí para validar la base de datos y pasar de Borrador a Listo.",
  "Con el quiz en Listo, ya puedes publicarlo e iniciar la evaluación con tus estudiantes.",
];

type Props = {
  /** Texto breve bajo el título (p. ej. en preview vs editar). */
  descripcion?: string;
  defaultAbierto?: boolean;
};

export function InstruccionesVerificacionQuiz({
  descripcion = "Sigue estos pasos después de generar un quiz con IA para evitar respuestas correctas mal calificadas en sesión.",
  defaultAbierto = true,
}: Props) {
  const [abierto, setAbierto] = useState(defaultAbierto);

  return (
    <Card className="card-institutional border-primary/20">
      <CardHeader className="py-3 px-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <ListChecks className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <CardTitle className="text-base font-semibold">
                Guía de verificación (quiz con IA)
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{descripcion}</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
          >
            {abierto ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {abierto ? (
        <CardContent className="pt-0 px-4 pb-4">
          <ol className="list-decimal list-inside space-y-2 text-sm text-foreground">
            {PASOS.map((paso, i) => (
              <li key={i} className="leading-relaxed pl-1">
                {paso}
              </li>
            ))}
          </ol>
        </CardContent>
      ) : null}
    </Card>
  );
}
