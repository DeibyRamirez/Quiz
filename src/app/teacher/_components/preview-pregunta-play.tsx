"use client";

import { Badge } from "@/components/ui/badge";
import { ImagenReferenciaPregunta } from "@/components/imagen-referencia-pregunta";
import { TableroOpciones } from "@/components/tablero-opciones";

type Props = {
  textoPregunta: string;
  imageUrl?: string;
  etiquetaTipo?: string;
  opcionesEjemplo?: string[];
};

function PlayPreviewFrame({
  variant,
  texto,
  imageUrl,
  etiquetaTipo,
  opciones,
}: {
  variant: "movil" | "escritorio";
  texto: string;
  imageUrl?: string;
  etiquetaTipo: string;
  opciones: { id: string; text: string }[];
}) {
  const frameClass =
    variant === "escritorio"
      ? "preview-play-frame preview-play-escritorio"
      : "preview-play-frame preview-play-movil";

  return (
    <div className={frameClass}>
      <p className="preview-play-frame-label">
        {variant === "movil" ? "Teléfono" : "PC"}
      </p>
      <div className="preview-play-device-chrome">
        <div className="preview-play-device-bar" aria-hidden="true" />
        <div className="preview-play-device">
          <div className="preview-play-tablero">
            <section className="preview-play-pregunta">
              <Badge variant="secondary" className="preview-play-badge">
                {etiquetaTipo}
              </Badge>
              <p className="preview-play-kicker">Responde a continuación</p>
              <p className="preview-play-enunciado whitespace-pre-wrap break-words">
                {texto}
              </p>
            </section>
            <section className="preview-play-respuestas">
              {imageUrl ? <ImagenReferenciaPregunta imageUrl={imageUrl} /> : null}
              <TableroOpciones opciones={opciones} deshabilitado />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PreviewPreguntaPlay({
  textoPregunta,
  imageUrl,
  etiquetaTipo = "Pregunta",
  opcionesEjemplo = ["Opción A", "Opción B"],
}: Props) {
  const texto = textoPregunta.trim() || "Texto de la pregunta…";
  const opciones = opcionesEjemplo.slice(0, 4).map((text, i) => ({
    id: String(i),
    text: text.trim() || `Opción ${i + 1}`,
  }));

  if (!imageUrl) return null;

  return (
    <div className="space-y-3 mt-3 w-full">
      <p className="text-sm font-medium text-foreground">Vista previa (estudiante)</p>
      <div className="flex flex-col xl:flex-row gap-6 justify-center items-stretch xl:items-start">
        <PlayPreviewFrame
          variant="movil"
          texto={texto}
          imageUrl={imageUrl}
          etiquetaTipo={etiquetaTipo}
          opciones={opciones}
        />
        <PlayPreviewFrame
          variant="escritorio"
          texto={texto}
          imageUrl={imageUrl}
          etiquetaTipo={etiquetaTipo}
          opciones={opciones}
        />
      </div>
    </div>
  );
}
