"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { ResultadoSubidaGuia } from "@/app/types/guia";

interface PasoSubirGuiaProps {
  onCompletado: (resultado: ResultadoSubidaGuia) => void;
  onSubir: (archivo: File, titulo?: string, cursoId?: string) => Promise<ResultadoSubidaGuia>;
}

export function PasoSubirGuia({ onCompletado, onSubir }: PasoSubirGuiaProps) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [titulo, setTitulo] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  const procesarArchivo = useCallback((file: File) => {
    const ext = file.name.toLowerCase();
    if (!ext.endsWith(".pdf") && !ext.endsWith(".docx")) {
      return;
    }
    setArchivo(file);
    if (!titulo.trim()) {
      setTitulo(file.name.replace(/\.(pdf|docx)$/i, ""));
    }
  }, [titulo]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setArrastrando(false);
      const file = e.dataTransfer.files[0];
      if (file) procesarArchivo(file);
    },
    [procesarArchivo]
  );

  const handleSubir = async () => {
    if (!archivo) return;
    setSubiendo(true);
    try {
      const resultado = await onSubir(
        archivo,
        titulo.trim() || undefined,
        cursoId.trim() || undefined
      );
      onCompletado(resultado);
    } catch {
      /* El padre ya muestra el toast; no relanzar para evitar el overlay de Next */
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Subir guía de estudio</h2>
        <p className="text-sm text-muted-foreground">
          Carga un PDF o DOCX. Si el archivo ya fue procesado, se reutilizará el contenido extraído.
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          arrastrando ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastrando(true);
        }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={handleDrop}
      >
        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm mb-3">Arrastra tu archivo aquí o selecciónalo</p>
        <Input
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="max-w-xs mx-auto"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) procesarArchivo(file);
          }}
        />
      </div>

      {archivo && (
        <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{archivo.name}</span>
          <Badge variant="secondary">{(archivo.size / 1024).toFixed(0)} KB</Badge>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="titulo-guia">Título de la guía</Label>
          <Input
            id="titulo-guia"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Electrostática — Unidad 3"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="curso-id">ID de curso (opcional)</Label>
          <Input
            id="curso-id"
            value={cursoId}
            onChange={(e) => setCursoId(e.target.value)}
            placeholder="Ej. FIS-101"
          />
        </div>
      </div>

      <Button
        className="btn-primary w-full sm:w-auto"
        disabled={!archivo || subiendo}
        onClick={handleSubir}
      >
        {subiendo ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Procesando guía...
          </>
        ) : (
          "Continuar"
        )}
      </Button>
    </div>
  );
}
