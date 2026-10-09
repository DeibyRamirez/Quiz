"use client";



import { useEffect, useRef, useState } from "react";

import { ImagePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";

import {

  eliminarImagenPregunta,

  subirImagenPregunta,

} from "@/lib/client/services/preguntas";

import { urlPublicaImagenReferencia } from "@/lib/recursos-quiz-url";

import { toast } from "sonner";

import { PreviewPreguntaPlay } from "@/app/teacher/_components/preview-pregunta-play";



type Props = {

  preguntaId: string | null;

  imagenReferencia?: string | null;

  onChange: (imagenReferencia?: string) => void;

  textoPregunta?: string;

  opcionesPreview?: string[];

  etiquetaTipo?: string;

};



export function ImagenPreguntaField({

  preguntaId,

  imagenReferencia,

  onChange,

  textoPregunta = "",

  opcionesPreview,

  etiquetaTipo,

}: Props) {

  const inputRef = useRef<HTMLInputElement>(null);

  const [subiendo, setSubiendo] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<string | number | undefined>();

  useEffect(() => {
    setPreviewVersion(undefined);
  }, [preguntaId]);

  const previewUrl = urlPublicaImagenReferencia(
    imagenReferencia ?? undefined,
    previewVersion
  );



  const handleFile = async (file: File | null) => {

    if (!file || !preguntaId) return;

    setSubiendo(true);

    try {

      const actualizada = await subirImagenPregunta(preguntaId, file);

      const ref = (actualizada as { imagenReferencia?: string }).imagenReferencia;
      const updatedAt = (actualizada as { updatedAt?: string }).updatedAt;

      onChange(ref);
      setPreviewVersion(updatedAt ?? Date.now());

      toast.success("Imagen guardada.");

    } catch (e) {

      toast.error(e instanceof Error ? e.message : "Error al subir imagen.");

    } finally {

      setSubiendo(false);

      if (inputRef.current) inputRef.current.value = "";

    }

  };



  const handleQuitar = async () => {

    if (!preguntaId) return;

    setSubiendo(true);

    try {

      await eliminarImagenPregunta(preguntaId);

      onChange(undefined);

      toast.success("Imagen eliminada.");

    } catch {

      toast.error("No se pudo eliminar la imagen.");

    } finally {

      setSubiendo(false);

    }

  };



  return (

    <div className="space-y-2">

      <Label className="text-foreground">Imagen de referencia (opcional)</Label>

      {!preguntaId ? (

        <p className="caption text-muted-foreground">

          Guarda la pregunta primero para poder adjuntar una imagen.

        </p>

      ) : (

        <>

          {previewUrl ? (

            <div className="space-y-2">

              <Button

                type="button"

                variant="outline"

                size="sm"

                disabled={subiendo}

                onClick={handleQuitar}

              >

                <Trash2 className="h-4 w-4 mr-1" />

                Quitar imagen

              </Button>

              <PreviewPreguntaPlay
                key={previewUrl}
                textoPregunta={textoPregunta}
                imageUrl={previewUrl}
                etiquetaTipo={etiquetaTipo}
                opcionesPreview={opcionesPreview}
              />

            </div>

          ) : null}

          <div className="flex flex-wrap gap-2 items-center">

            <input

              ref={inputRef}

              type="file"

              accept="image/jpeg,image/png,image/webp"

              className="hidden"

              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}

            />

            <Button

              type="button"

              variant="secondary"

              size="sm"

              disabled={subiendo}

              onClick={() => inputRef.current?.click()}

            >

              <ImagePlus className="h-4 w-4 mr-1" />

              {previewUrl ? "Reemplazar imagen" : "Subir imagen"}

            </Button>

          </div>

        </>

      )}

    </div>

  );

}


