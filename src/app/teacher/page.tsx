"use client";



import { useEffect, useMemo, useState } from "react";

import { Navigation } from "@/components/navigation";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { Plus, Play, BarChart3, Clock, ChevronDown } from "lucide-react";

import Link from "next/link";

import { toast } from "sonner";

import {

  EstadoQuiz,

  etiquetaEstadoQuiz,

  esQuizListoParaUi,

  type Quiz,

} from "@/app/types";

import { obtenerUsuarioActual } from "@/lib/client/auth";

import {

  listarQuizzes,

  eliminarQuiz,

  formatearFechaQuiz,

} from "@/lib/client/services/quizzes";

import { InstruccionesVerificacionQuiz } from "@/app/teacher/_components/ia/instrucciones-verificacion-quiz";

type OpcionesFilaQuiz = {

  mostrarResultados: boolean;

  mostrarIniciar: boolean;

};



function TeacherDashboardContent() {

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    const cargar = async () => {

      const user = await obtenerUsuarioActual();

      if (!user) {

        setLoading(false);

        return;

      }

      try {

        const data = await listarQuizzes(user.id);

        setQuizzes(data);

      } catch {

        toast.error("Error al cargar quizzes. Intenta recargar la página.");

      } finally {

        setLoading(false);

      }

    };

    cargar();

  }, []);



  const borradores = useMemo(

    () => quizzes.filter((q) => q.estado === EstadoQuiz.BORRADOR),

    [quizzes]

  );

  const listos = useMemo(

    () => quizzes.filter((q) => esQuizListoParaUi(q.estado)),

    [quizzes]

  );



  const handleEliminar = async (id: string) => {

    if (!confirm("¿Seguro que deseas eliminar este quiz?")) return;

    try {

      await eliminarQuiz(id);

      setQuizzes((prev) => prev.filter((q) => q.id !== id));

      toast.success("Quiz eliminado correctamente.");

    } catch {

      toast.error("Error al eliminar el quiz.");

    }

  };



  const renderQuizRow = (quiz: Quiz, opciones: OpcionesFilaQuiz) => (

    <div

      key={quiz.id}

      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"

    >

      <div className="min-w-0 flex-1 space-y-1">

        <div className="flex flex-wrap items-center gap-2">

          <h3 className="font-semibold text-foreground truncate max-w-full">

            {quiz.titulo}

          </h3>

          <Badge variant="outline">{etiquetaEstadoQuiz(quiz.estado)}</Badge>

        </div>

        {quiz.descripcion ? (

          <p className="text-sm text-muted-foreground line-clamp-2">

            {quiz.descripcion}

          </p>

        ) : null}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">

          <span className="flex items-center gap-1">

            <Clock className="h-3 w-3" aria-hidden="true" />

            {formatearFechaQuiz(quiz.creadoEn)}

          </span>

        </div>

      </div>



      <div className="flex flex-row flex-wrap items-center justify-start sm:justify-end gap-2 mt-1">

        <Button

          variant="destructive"

          size="sm"

          className="h-10 px-3 shrink-0"

          onClick={() => handleEliminar(quiz.id)}

        >

          Eliminar

        </Button>



        <Link href={`/teacher/quiz/${quiz.id}/edit`} className="shrink-0">

          <Button variant="outline" size="sm" className="h-10 px-3">

            Editar

          </Button>

        </Link>



        {opciones.mostrarResultados ? (

          <Link href={`/teacher/quiz/${quiz.id}/resultados`} className="shrink-0">

            <Button variant="secondary" size="sm" className="h-10 px-3">

              Resultados

            </Button>

          </Link>

        ) : null}



        {opciones.mostrarIniciar ? (

          <Link href={`/teacher/quiz/${quiz.id}/live`} className="shrink-0">

            <Button size="sm" className="h-10 px-3">

              <Play className="mr-2 h-4 w-4" aria-hidden="true" />

              Iniciar

            </Button>

          </Link>

        ) : null}

      </div>

    </div>

  );



  const renderSeccion = (

    titulo: string,

    items: Quiz[],

    vacio: string,

    opciones: OpcionesFilaQuiz

  ) => (

    <details

      className="group border border-border rounded-lg overflow-hidden"

      open={items.length > 0}

    >

      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 bg-muted/40 px-4 py-3 font-medium text-foreground hover:bg-muted/60 [&::-webkit-details-marker]:hidden">

        <span>{titulo} ({items.length})</span>

        <ChevronDown

          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"

          aria-hidden="true"

        />

      </summary>

      <div className="space-y-4 p-4 pt-2">

        {items.length === 0 ? (

          <p className="text-sm text-muted-foreground py-4 text-center">{vacio}</p>

        ) : (

          items.map((quiz) => renderQuizRow(quiz, opciones))

        )}

      </div>

    </details>

  );



  return (

    <div className="page-shell">

      <Navigation />

      <main className="page-main">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 px-1 min-w-0">

          <div className="min-w-0">

            <h1 className="heading-primary">Panel Docente</h1>

            <p className="body-text text-muted-foreground">Gestiona tus quizzes</p>

          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">

            <Link href="/teacher/create/ia/" className="w-full sm:w-auto">

              <Button size="lg" variant="outline" className="h-11 w-full">

                <Plus className="mr-2 h-5 w-5" />

                Crear con IA

              </Button>

            </Link>

            <Link href="/teacher/create/" className="w-full sm:w-auto">

              <Button size="lg" className="btn-primary h-11 w-full">

                <Plus className="mr-2 h-5 w-5" />

                Crear Nuevo Quiz

              </Button>

            </Link>

          </div>

        </div>

        <div className="mb-8">
          <InstruccionesVerificacionQuiz defaultAbierto={false} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <Card className="card-institutional">

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">

              <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>

              <BarChart3 className="h-4 w-4 text-muted-foreground" />

            </CardHeader>

            <CardContent>

              <div className="text-2xl font-bold">{quizzes.length}</div>

              <p className="text-xs text-muted-foreground">

                {borradores.length} borradores · {listos.length} listos

              </p>

            </CardContent>

          </Card>

        </div>



        <Card className="card-institutional">

          <CardHeader>

            <CardTitle className="text-primary">Mis Quizzes</CardTitle>

            <CardDescription>Gestiona y monitorea tus quizzes guardados</CardDescription>

          </CardHeader>

          <CardContent>

            {loading ? (

              <p className="text-center text-muted-foreground py-8">Cargando quizzes...</p>

            ) : quizzes.length === 0 ? (

              <p className="text-center text-muted-foreground py-8">

                No hay quizzes registrados aún.

              </p>

            ) : (

              <div className="space-y-4">

                {renderSeccion("Borradores", borradores, "No hay borradores.", {

                  mostrarResultados: false,

                  mostrarIniciar: false,

                })}

                {renderSeccion("Listos", listos, "No hay quizzes listos.", {

                  mostrarResultados: true,

                  mostrarIniciar: true,

                })}

              </div>

            )}

          </CardContent>

        </Card>

      </main>

    </div>

  );

}



export default function TeacherPage() {

  return <TeacherDashboardContent />;

}

