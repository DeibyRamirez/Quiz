"use client";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertTriangle, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { salirQuiz } from "@/lib/salirQuiz";
import { obtenerUsuarioActual } from "@/lib/client/auth";
import { useSesionLive } from "@/hooks/useSesionLive";

export default function QuizLobbyPage() {
  const params = useParams();
  const pin = params.code as string;
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const { sesion: session, loading } = useSesionLive(pin, { heartbeat: true });

  useEffect(() => {
    const handleBeforeUnload = () => {
      salirQuiz(pin);
    };

    const handlePopState = () => {
      salirQuiz(pin);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [pin]);

  useEffect(() => {
    obtenerUsuarioActual().then((usuario) => {
      if (!usuario) {
        router.push("/login");
        return;
      }
      setPlayerName(usuario.nombre);
    });
  }, [router]);

  useEffect(() => {
    if (!session) return;
    if (session.status === "active") {
      router.push(`/student/quiz/${pin}/play`);
    }
    if (session.status === "ended") {
      router.push(`/student/quiz/${pin}/podio`);
    }
  }, [session, pin, router]);

  useEffect(() => {
    if (!loading && !session) {
      router.push("/student");
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="page-shell flex items-center justify-center min-h-screen">
        <p className="body-text text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Navigation />
      <main className="page-main">
        <Card className="card-institutional max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="heading-secondary">Lobby del Quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5 text-center">
            <div>
              <h2 className="heading-tertiary text-xl">
                ¡Bienvenido, {playerName || "Estudiante"}!
              </h2>
              <p className="body-small text-muted-foreground mt-1">
                Espera a que el docente inicie el quiz.
              </p>
            </div>

            <div className="p-3 bg-muted rounded-md border border-border">
              <p className="body-small font-medium text-primary">
                PIN del Quiz: <span className="font-bold">{pin}</span>
              </p>
              <div className="flex items-center justify-center gap-2 mt-1 body-small text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{session.players?.length || 0} jugadores unidos</span>
              </div>
            </div>

            <div className="flex justify-center items-center gap-2 body-small text-muted-foreground">
              Estado:{" "}
              <span className="font-semibold text-primary">
                {session.status === "lobby" ? "Esperando" : "Iniciando..."}
              </span>
            </div>

            <div className="p-4 bg-accent/10 border border-accent/30 rounded-xl text-foreground flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-secondary mt-1" />
              <p className="body-small text-left">
                Si ingresaste por error o no perteneces a esta sesión,
                <strong> sal del quiz ahora </strong>.
                De lo contrario, <span className="font-semibold"> tu nombre quedará registrado </span>
                en la lista de estudiantes que presentarán la actividad.
              </p>
            </div>

            <Button
              variant="destructive"
              size="lg"
              className="w-full flex items-center justify-center gap-2 font-semibold"
              onClick={async () => {
                await salirQuiz(pin);
                router.push("/student");
              }}
            >
              <LogOut className="h-5 w-5" />
              Salir del Quiz
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
