"use client";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Sello } from "@/components/quiz/sello";
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
      <div className="page-shell flex items-center justify-center min-h-screen min-h-[100dvh]">
        <p className="body-text text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const jugadores = session.players ?? [];

  return (
    <div className="page-shell">
      <Navigation />
      <main className="page-main">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-6 text-center">
          <Sello texto="ESPERANDO AL DOCENTE" />
          <p className="qq-sticker">{playerName || "Estudiante"}</p>
          <h1 className="heading-secondary">Sala de espera</h1>
          <p className="body-text">
            El quiz arranca cuando el docente pulse Empezar. PIN{" "}
            <span className="font-mono font-bold tracking-widest">{pin}</span>
          </p>
          <p className="qq-label">
            <Users className="mr-1 inline h-4 w-4" aria-hidden />
            {jugadores.length} {jugadores.length === 1 ? "jugador" : "jugadores"}
          </p>
          <ul className="flex flex-wrap justify-center gap-2" aria-label="Jugadores en la sala">
            {jugadores.map((jugador) => (
              <li key={jugador.userId} className="qq-chip">
                {jugador.nombre}
              </li>
            ))}
          </ul>
          <div className="qq-card-brutal w-full p-4 text-left">
            <p className="flex items-start gap-3 text-base">
              <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-foreground" aria-hidden />
              <span>
                Si entraste por error, sal ahora. Si te quedas, tu nombre queda en la lista de
                quienes presentan la actividad.
              </span>
            </p>
          </div>
          <Button
            variant="destructive"
            size="lg"
            className="flex min-h-11 w-full items-center justify-center gap-2 font-semibold"
            onClick={async () => {
              await salirQuiz(pin);
              router.push("/student");
            }}
          >
            <LogOut className="h-5 w-5" />
            Salir del Quiz
          </Button>
        </div>
      </main>
    </div>
  );
}
