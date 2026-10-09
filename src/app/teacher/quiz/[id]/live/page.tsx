"use client";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Copy, Check, Hash } from "lucide-react";
import { ArrowLeft, Users, Play, SkipForward } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { obtenerQuiz } from "@/lib/client/services/quizzes";
import {
  preguntaApiToUi,
  etiquetaTipoPreguntaPlay,
} from "@/lib/client/mappers/pregunta-ui";
import {
  crearSesion,
  actualizarNombreSesion,
  iniciarSesion,
  siguientePreguntaSesion,
} from "@/lib/client/services/sesiones";
import { useSesionLive } from "@/hooks/useSesionLive";
import { useSesionTimer } from "@/hooks/useSesionTimer";
import { timerSesionExpirado } from "@/lib/client/sesion-timer";
import { BarraTiempoSesion } from "@/components/barra-tiempo-sesion";
import { TableroOpciones } from "@/components/tablero-opciones";
import type { QuestionUi } from "@/lib/client/mappers/pregunta-ui";

export default function LiveQuizPage() {
  const params = useParams();
  const quizId = params.id as string;
  const router = useRouter();

  const [quiz, setQuiz] = useState<{ title: string; description: string } | null>(null);
  const [questions, setQuestions] = useState<QuestionUi[]>([]);
  const [pin, setPin] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [sessionName, setSessionName] = useState("");
  const [isSessionNameTouched, setIsSessionNameTouched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const isTransitioningRef = useRef(false);
  const hasInitializedSession = useRef(false);
  const sessionNameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [reconnectedToActive, setReconnectedToActive] = useState(false);

  const { sesion: session, serverOffsetMs } = useSesionLive(pin || null);
  const { timeLeft, limitSec, progress, formatted } = useSesionTimer(session, serverOffsetMs);

  const currentQuestion = session?.currentQuestion ?? 0;
  const status = session?.status ?? "lobby";
  const players = session?.players ?? [];

  const isSessionNameValid = sessionName.trim().length > 0;
  const canStartQuiz = players.length > 0 && isSessionNameValid;
  const urlUnion =
    typeof window !== "undefined" && pin
      ? `${window.location.origin}/student/quiz/${pin}/`
      : "";

  useEffect(() => {
    if (!quizId) return;

    obtenerQuiz(quizId)
      .then((data) => {
        setQuiz({ title: data.titulo, description: data.descripcion });
        setQuestions(data.preguntas.map(preguntaApiToUi));
      })
      .catch(() => { });
  }, [quizId]);

  useEffect(() => {
    if (!quizId || hasInitializedSession.current) return;

    crearSesion(quizId)
      .then((s) => {
        setPin(s.pin);
        setSessionName(s.sessionName || "");
        if (s.status === "active") {
          setReconnectedToActive(true);
        }
        try {
          localStorage.setItem(`eq_teacher_sesion_${quizId}`, s.pin);
        } catch {
          /* ignore */
        }
        hasInitializedSession.current = true;
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Error inicializando sesión:", err);
        setIsLoading(false);
      });
  }, [quizId]);

  useEffect(() => {
    if (!session) return;
    if (!isSessionNameTouched) setSessionName(session.sessionName || "");
    if (session.status === "ended") {
      router.push(`/teacher/quiz/${quizId}/resultados`);
    }
  }, [session, quizId, router, isSessionNameTouched]);

  const updateSessionName = (newName: string) => {
    if (!pin) return;
    if (sessionNameTimeoutRef.current) clearTimeout(sessionNameTimeoutRef.current);

    sessionNameTimeoutRef.current = setTimeout(() => {
      const trimmed = newName.trim();
      if (trimmed !== session?.sessionName) {
        actualizarNombreSesion(pin, trimmed).catch(console.error);
      }
    }, 500);
  };

  const handleSessionNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSessionName(value);
    setIsSessionNameTouched(true);
    updateSessionName(value);
  };

  const copyPin = async () => {
    try {
      await navigator.clipboard.writeText(pin);
      setCopied(true);
      setCopiedUrl(false);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("No se pudo copiar");
    }
  };

  const copyUrlUnion = async () => {
    if (!urlUnion) return;
    try {
      await navigator.clipboard.writeText(urlUnion);
      setCopiedUrl(true);
      setCopied(false);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      alert("No se pudo copiar la URL");
    }
  };

  const startQuiz = async () => {
    if (!canStartQuiz) {
      if (players.length === 0) alert("Espera a un jugador");
      if (!isSessionNameValid) alert("Ingresa un nombre");
      return;
    }
    if (!pin) return;
    try {
      await iniciarSesion(pin);
    } catch (e) {
      console.error(e);
      alert("No se pudo iniciar el quiz");
    }
  };

  const handleNextQuestion = useCallback(async () => {
    if (!pin) return;
    try {
      await siguientePreguntaSesion(pin);
    } catch (e) {
      console.error("No se pudo avanzar de pregunta:", e);
      isTransitioningRef.current = false;
    }
  }, [pin]);

  useEffect(() => {
    if (status !== "active") return;
    if (!session?.qScheduledAt) return;
    isTransitioningRef.current = false;
  }, [status, session?.qScheduledAt, session?.currentQuestion]);

  useEffect(() => {
    if (status !== "active") return;
    if (!session?.qScheduledAt || !session?.qTimeLimitSec) return;
    if (
      !timerSesionExpirado(
        session.qScheduledAt,
        session.qTimeLimitSec,
        serverOffsetMs
      )
    ) {
      return;
    }
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setTimeout(handleNextQuestion, 120);
  }, [
    status,
    timeLeft,
    session?.qScheduledAt,
    session?.qTimeLimitSec,
    serverOffsetMs,
    handleNextQuestion,
  ]);

  useEffect(() => {
    return () => {
      if (sessionNameTimeoutRef.current) clearTimeout(sessionNameTimeoutRef.current);
    };
  }, []);

  if (isLoading || !quiz || !session) {
    return (
      <div className="page-shell flex items-center justify-center min-h-screen min-h-[100dvh]">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="body-text text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  const preguntaActual = questions[currentQuestion];
  const esEscrita =
    preguntaActual?.questionType === "numerical" ||
    preguntaActual?.questionType === "exact-text" ||
    preguntaActual?.questionType === "open-text";

  return (
    <div className="page-shell min-h-[100dvh]">
      <Navigation />

      <main className="page-main">
        {reconnectedToActive && status === "active" && (
          <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-secondary mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">Sesión en curso — reconectado</p>
              <p className="body-small text-muted-foreground mt-1">
                Retomaste una sesión activa. Puedes continuar avanzando preguntas con el botón
                &quot;Siguiente&quot; o esperar a que termine el temporizador.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 md:gap-4 mb-6 sm:mb-8">
          <Link href="/teacher" className="shrink-0">
            <Button variant="outline" size="sm" className="min-h-11">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>

          <div className="w-full md:w-auto md:flex-1 order-3 md:order-none text-center md:text-left min-w-0">
            <h1 className="heading-secondary leading-snug break-words">
              {quiz.title}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">Monitoreo en tiempo real</p>
          </div>

          <div className="flex items-end gap-2 md:gap-3 ml-auto order-1 md:order-none">
            <Button
              onClick={handleNextQuestion}
              disabled={status === "lobby"}
              className="btn-primary shrink-0 flex items-center gap-2 min-h-11"
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Siguiente
            </Button>
          </div>
        </div>

        {status === "lobby" && (
          <Card className="card-institutional">
            <CardHeader>
              <CardTitle className="heading-secondary">Lobby del Quiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="session-name">
                  Nombre de la sesión <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="session-name"
                  value={sessionName}
                  onChange={handleSessionNameChange}
                  placeholder="Ej: Clase 1A - 27 Oct"
                  className={`input-institutional max-w-md min-h-11 text-base ${isSessionNameTouched && !isSessionNameValid ? "border-destructive" : ""}`}
                />
                {isSessionNameTouched && !isSessionNameValid && (
                  <p className="text-error flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    El nombre no puede estar vacío
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Aparecerá en los resultados</p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Hash className="h-7 w-7 text-primary icono-pin-lobby" aria-hidden="true" />
                  <span className="text-lg">PIN:</span>
                  <span className="font-bold text-3xl sm:text-4xl text-primary tracking-widest tabular-nums">
                    {pin}
                  </span>
                  <Button size="sm" variant="outline" onClick={copyPin} className="min-h-11">
                    {copied ? <Check className="h-4 w-4 text-green-600 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                    {copied ? "PIN copiado" : "Copiar PIN"}
                  </Button>
                </div>

                {urlUnion ? (
                  <div className="space-y-2">
                    <Label htmlFor="url-union">URL para unirse (este mismo servidor)</Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="url-union"
                        readOnly
                        value={urlUnion}
                        className="input-institutional font-mono text-sm min-h-11"
                      />
                      <Button size="sm" variant="outline" onClick={copyUrlUnion} className="shrink-0 min-h-11">
                        {copiedUrl ? (
                          <Check className="h-4 w-4 text-green-600 mr-1" />
                        ) : (
                          <Copy className="h-4 w-4 mr-1" />
                        )}
                        {copiedUrl ? "URL copiada" : "Copiar URL"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Los estudiantes deben entrar por esta URL o por el PIN en esta misma web.
                      Unirse desde otro dominio (por ejemplo producción si tú estás en local) no encuentra esta sesión.
                    </p>
                  </div>
                ) : null}
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary icono-usuarios-lobby" aria-hidden="true" />
                  Jugadores conectados ({players.length}):
                </h3>
                {players.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {players.map((p) => (
                      <li key={p.userId} className="text-sm break-words">
                        {p.nombre}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Esperando jugadores...</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={startQuiz} disabled={!canStartQuiz} size="lg" className="btn-primary w-full md:w-auto min-h-11">
                  <Play className="mr-2 h-5 w-5" />
                  Empezar Quiz
                </Button>
                {!canStartQuiz && (
                  <p className="text-sm text-orange-600 text-center">
                    {players.length === 0 ? "Espera a un jugador" : "Ingresa un nombre"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {status !== "lobby" && (
          <>
            <div className="live-stats-bar mb-4 sm:mb-6">
              <div className="live-stat">
                <span className="live-stat-label">Pregunta</span>
                <span className="live-stat-value tabular-nums">
                  {currentQuestion + 1}/{questions.length}
                </span>
              </div>
              <div className="live-stat">
                <span className="live-stat-label flex items-center gap-1">
                  <Users className="h-4 w-4 icono-usuarios-lobby" aria-hidden="true" />
                  Participantes
                </span>
                <span className="live-stat-value tabular-nums">{players.length}</span>
              </div>
            </div>

            <BarraTiempoSesion
              formatted={formatted}
              timeLeft={timeLeft}
              progress={progress}
              etiqueta={
                preguntaActual
                  ? etiquetaTipoPreguntaPlay(preguntaActual)
                  : "Tiempo"
              }
            />

            {preguntaActual && (
              <div className="quiz-play-tablero live-proyeccion mt-4 sm:mt-6">
                <section className="quiz-play-pregunta">
                  <p className="quiz-play-pregunta-kicker">Pregunta actual</p>
                  <h2 className="question-text whitespace-pre-wrap break-words text-left lg:text-left">
                    {preguntaActual.question}
                  </h2>
                  {preguntaActual.imageUrl ? (
                    <img
                      src={preguntaActual.imageUrl}
                      alt="Referencia de la pregunta"
                      className="mt-4 max-w-full max-h-48 sm:max-h-64 rounded-lg border border-border object-contain bg-white"
                    />
                  ) : null}
                </section>
                <section className="quiz-play-respuestas">
                  {esEscrita ? (
                    <div className="p-4 sm:p-6 rounded-xl border border-border bg-card">
                      <p className="text-sm uppercase tracking-wide text-muted-foreground mb-1">
                        Respuesta corta
                      </p>
                      <p className="body-text">
                        Los estudiantes escriben su respuesta. Se califica al enviar.
                      </p>
                    </div>
                  ) : (
                    <TableroOpciones opciones={preguntaActual.options ?? []} />
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
