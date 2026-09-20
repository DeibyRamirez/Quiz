"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Navigation } from "@/components/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { RolUsuario } from "@/app/types";
import type { ResultadoSubidaGuia } from "@/app/types/guia";
import type { ConfigGeneracion } from "@/app/types/quiz-ia";
import type { Pregunta } from "@/app/types/pregunta";
import { subirGuia } from "@/lib/client/services/guias";
import { generarQuizIa, refinarQuizIa } from "@/lib/client/services/quiz-ia";
import { PasoSubirGuia } from "@/app/teacher/_components/ia/paso-subir-guia";
import { PasoConfigurar } from "@/app/teacher/_components/ia/paso-configurar";
import { PasoPreviewRefinar } from "@/app/teacher/_components/ia/paso-preview-refinar";

type PasoWizard = "subir" | "configurar" | "preview";

function CrearQuizIaContent() {
  const [paso, setPaso] = useState<PasoWizard>("subir");
  const [guia, setGuia] = useState<ResultadoSubidaGuia | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [tituloQuiz, setTituloQuiz] = useState("");
  const [version, setVersion] = useState(1);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [generando, setGenerando] = useState(false);
  const [refinando, setRefinando] = useState(false);

  const handleSubir = async (
    archivo: File,
    titulo?: string,
    cursoId?: string
  ) => {
    const formData = new FormData();
    formData.append("file", archivo);
    if (titulo) formData.append("titulo", titulo);
    if (cursoId) formData.append("cursoId", cursoId);

    try {
      const resultado = await subirGuia(formData);
      toast.success(
        resultado.enCache
          ? "Guía recuperada desde caché (hash coincidente)."
          : "Guía procesada correctamente."
      );
      return resultado;
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error al subir la guía";
      toast.error(mensaje);
      throw error;
    }
  };

  const handleGuiaCompletada = (resultado: ResultadoSubidaGuia) => {
    setGuia(resultado);
    setPaso("configurar");
  };

  const handleGenerar = async (titulo: string, config: ConfigGeneracion) => {
    if (!guia) return;
    setGenerando(true);
    try {
      const resultado = await generarQuizIa({
        guiaId: guia.guiaId,
        titulo,
        config,
      });
      setQuizId(resultado.quizId);
      setTituloQuiz(resultado.titulo);
      setVersion(resultado.version);
      setPreguntas(resultado.questions);
      setPaso("preview");
      toast.success("Quiz generado con IA.");
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error al generar el quiz";
      toast.error(mensaje);
    } finally {
      setGenerando(false);
    }
  };

  const handleRefinar = async (instruccion: string) => {
    if (!quizId) return;
    setRefinando(true);
    try {
      const resultado = await refinarQuizIa(quizId, instruccion);
      setTituloQuiz(resultado.titulo);
      setVersion(resultado.version);
      setPreguntas(resultado.questions);
      toast.success(`Quiz actualizado a versión ${resultado.version}.`);
    } catch (error) {
      const mensaje =
        error instanceof Error ? error.message : "Error al refinar el quiz";
      toast.error(mensaje);
    } finally {
      setRefinando(false);
    }
  };

  const pasos: { id: PasoWizard; label: string }[] = [
    { id: "subir", label: "1. Guía" },
    { id: "configurar", label: "2. Configurar" },
    { id: "preview", label: "3. Preview" },
  ];

  return (
    <div className="page-shell">
      <Navigation />
      <main className="page-main max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/teacher/">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al panel
            </Button>
          </Link>
          <h1 className="heading-primary">Crear quiz con IA</h1>
          <p className="body-text text-muted-foreground mt-1">
            Sube una guía de estudio y genera un quiz estructurado automáticamente.
          </p>
        </div>

        <div className="flex gap-2 mb-8">
          {pasos.map((p) => (
            <div
              key={p.id}
              className={`text-sm px-3 py-1 rounded-full ${
                paso === p.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {p.label}
            </div>
          ))}
        </div>

        <div className="card-institutional p-6">
          {paso === "subir" && (
            <PasoSubirGuia onCompletado={handleGuiaCompletada} onSubir={handleSubir} />
          )}

          {paso === "configurar" && guia && (
            <PasoConfigurar
              tituloGuia={guia.titulo}
              estimacionTokens={guia.estimacionTokens}
              enCache={guia.enCache}
              onGenerar={handleGenerar}
              generando={generando}
            />
          )}

          {paso === "preview" && quizId && (
            <PasoPreviewRefinar
              quizId={quizId}
              titulo={tituloQuiz}
              version={version}
              preguntas={preguntas}
              onRefinar={handleRefinar}
              refinando={refinando}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default function CrearQuizIaPage() {
  return (
    <ProtectedRoute allowedRoles={[RolUsuario.DOCENTE, RolUsuario.ADMINISTRADOR]}>
      <CrearQuizIaContent />
    </ProtectedRoute>
  );
}
