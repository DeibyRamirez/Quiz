"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError } from "@/lib/client/api";
import { obtenerUsuarioActual } from "@/lib/client/auth";
import { listarPreguntas } from "@/lib/client/services/preguntas";
import {
  enviarRespuestaSesion,
  obtenerProgresoSesion,
  unirseSesion,
} from "@/lib/client/services/sesiones";
import {
  etiquetaTipoPreguntaPlay,
  preguntaApiToUi,
  type QuestionUi,
} from "@/lib/client/mappers/pregunta-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimerPill } from "@/components/barra-tiempo-sesion";
import { ImagenReferenciaPregunta } from "@/components/imagen-referencia-pregunta";
import { TableroOpciones } from "@/components/tablero-opciones";
import { BarraProgreso } from "@/components/quiz/barra-progreso";
import { ChipPuntaje } from "@/components/quiz/chip-puntaje";
import { DespertarServidor } from "@/components/quiz/despertar-servidor";
import { EstadoTiempoAgotado } from "@/components/quiz/estado-tiempo-agotado";
import { FeedbackCard } from "@/components/quiz/feedback-card";
import { useSesionLive } from "@/hooks/useSesionLive";
import { useSesionTimer } from "@/hooks/useSesionTimer";

const PISTA_OPCION_MULTIPLE =
  "Puedes marcar varias opciones. Pulsa Listo cuando termines.";

function calcularRacha(historial: Array<boolean | null>, index: number, correcta: boolean) {
  if (!correcta) return 0;
  let racha = 1;
  for (let i = index - 1; i >= 0; i -= 1) {
    if (historial[i] === true) racha += 1;
    else break;
  }
  return racha;
}

export default function StudentPlayPage() {
  const params = useParams();
  const pin = params.code as string;
  const router = useRouter();

  const {
    sesion: session,
    serverOffsetMs,
    error: errorSesion,
    loading: cargandoSesion,
    refresh: recargarSesion,
  } = useSesionLive(pin, { heartbeat: true });
  const [questions, setQuestions] = useState<QuestionUi[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionUi | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const timeoutSubmitRef = useRef(false);
  const [player, setPlayer] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [similitud, setSimilitud] = useState<number | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [frozenTimeLeft, setFrozenTimeLeft] = useState<number | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [reintentoCarga, setReintentoCarga] = useState(0);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [puntosGanados, setPuntosGanados] = useState(0);
  const [respuestaRevelada, setRespuestaRevelada] = useState("");
  const [idsCorrectos, setIdsCorrectos] = useState<string[]>([]);
  const [racha, setRacha] = useState(0);
  const [historial, setHistorial] = useState<Array<boolean | null>>([]);
  const [lento, setLento] = useState(false);

  const isInitializedRef = useRef(false);
  const progresoLoadedRef = useRef(false);

  const { timeLeft, limitSec, progress, formatted } = useSesionTimer(
    session,
    serverOffsetMs,
    { paused: answered }
  );

  const displayTimeLeft = answered && frozenTimeLeft !== null ? frozenTimeLeft : timeLeft;
  const displayFormatted =
    answered && frozenTimeLeft !== null
      ? `${Math.floor(frozenTimeLeft / 60)}:${(frozenTimeLeft % 60)
          .toString()
          .padStart(2, "0")}`
      : formatted;
  const displayProgress =
    answered && frozenTimeLeft !== null
      ? Math.min(100, Math.max(0, (frozenTimeLeft / limitSec) * 100))
      : progress;

  const esEscrita =
    currentQuestion?.questionType === "numerical" ||
    currentQuestion?.questionType === "exact-text" ||
    currentQuestion?.questionType === "open-text";
  const esOpcionMultiple =
    currentQuestion?.questionType === "multiple-choice" &&
    Boolean(currentQuestion?.permiteMultiples);

  useEffect(() => {
    if (!pin) return;
    unirseSesion(pin).catch(() => {});
  }, [pin]);

  useEffect(() => {
    obtenerUsuarioActual().then((usuario) => {
      if (!usuario) {
        router.push("/login");
        return;
      }
      setPlayer({ id: usuario.id, name: usuario.nombre });
    });
  }, [router]);

  useEffect(() => {
    if (!session) return;

    const newIndex = Number(session.currentQuestion) || 0;
    setCurrentQuestionIndex(newIndex);

    if (session.status === "ended") {
      router.push(`/student/quiz/${pin}/podio`);
    }
  }, [session, pin, router]);

  useEffect(() => {
    if (!session?.quizId) return;
    let cancelado = false;
    setErrorCarga(null);
    listarPreguntas(session.quizId)
      .then((data) => {
        if (cancelado) return;
        if (data.length === 0) {
          setQuestions([]);
          setErrorCarga("Este quiz no tiene preguntas activas.");
          return;
        }
        setQuestions(data.map(preguntaApiToUi));
      })
      .catch((error) => {
        if (cancelado) return;
        setQuestions([]);
        setErrorCarga(
          error instanceof Error
            ? error.message
            : "No pudimos cargar las preguntas."
        );
      });
    return () => {
      cancelado = true;
    };
  }, [session?.quizId, reintentoCarga]);

  useEffect(() => {
    if (!pin || progresoLoadedRef.current) return;
    obtenerProgresoSesion(pin)
      .then((progreso) => {
        setTotalScore(progreso.totalScore);
        progresoLoadedRef.current = true;
      })
      .catch(() => {
        progresoLoadedRef.current = true;
      });
  }, [pin]);

  useEffect(() => {
    if (questions.length === 0) return;

    let index = currentQuestionIndex;
    if (isNaN(index) || index < 0 || index >= questions.length) {
      index = 0;
    }

    const current = questions[index];
    if (!current) return;

    if (!isInitializedRef.current || currentQuestion?.id !== current.id) {
      isInitializedRef.current = true;
      setCurrentQuestion(current);
      setAnswered(false);
      setSubmitting(false);
      setSelectedOption(null);
      setSelectedIds([]);
      timeoutSubmitRef.current = false;
      setIsCorrect(null);
      setSimilitud(null);
      setFrozenTimeLeft(null);
      setPuntosGanados(0);
      setRespuestaRevelada("");
      setIdsCorrectos([]);
      setRacha(0);

      obtenerProgresoSesion(pin).then((progreso) => {
        const marcas: Array<boolean | null> = [];
        for (const respuesta of progreso.answers) {
          marcas[respuesta.questionIndex] = respuesta.correct;
        }
        setHistorial(marcas);
        const prev = progreso.currentQuestionAnswer;
        if (prev && prev.questionIndex === index) {
          setAnswered(true);
          if (prev.answerId.includes(",")) {
            setSelectedIds(
              prev.answerId
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            );
            setSelectedOption(null);
          } else {
            setSelectedOption(prev.answerId);
            setSelectedIds([]);
          }
          setIsCorrect(prev.correct);
          setTotalScore(progreso.totalScore);
          setFrozenTimeLeft(prev.timeLeft);
          setPuntosGanados(prev.pointsEarned ?? 0);
          setRespuestaRevelada(prev.respuestaRevelada ?? "");
          setIdsCorrectos(prev.opcionesCorrectas ?? []);
          setRacha(calcularRacha(marcas, index, prev.correct));
        }
      }).catch(() => {});
    }
  }, [currentQuestionIndex, questions, currentQuestion?.id, pin]);

  const buildAnswerPayload = (
    question: QuestionUi,
    answerId: string
  ): { answerId: string; answerText: string } => {
    if (question.questionType !== "multiple-choice" || !question.options) {
      return { answerId, answerText: answerId };
    }
    if (question.permiteMultiples) {
      const ids = answerId
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .sort();
      const normalizedId = ids.join(",");
      const answerText = ids
        .map((id) => question.options!.find((o) => o.id === id)?.text ?? id)
        .join(" | ");
      return { answerId: normalizedId, answerText };
    }
    const opt = question.options.find((o) => o.id === answerId);
    return { answerId, answerText: opt?.text ?? answerId };
  };

  const sendAnswer = async (optionId?: string | null) => {
    if (!player || !currentQuestion || !session || answered || submitting) return;

    let answerId: string;
    if (currentQuestion.permiteMultiples && currentQuestion.questionType === "multiple-choice") {
      if (optionId != null && optionId !== "") {
        answerId = optionId;
      } else {
        answerId = [...selectedIds].sort().join(",");
      }
    } else {
      answerId = optionId ?? selectedOption ?? "";
    }

    if (!answerId) return;

    setSubmitting(true);
    setErrorEnvio(null);
    setFrozenTimeLeft(timeLeft);

    const { answerId: normalizedId, answerText } = buildAnswerPayload(
      currentQuestion,
      answerId
    );

    if (currentQuestion.permiteMultiples) {
      setSelectedIds(normalizedId.split(",").filter(Boolean));
      setSelectedOption(null);
    } else {
      setSelectedOption(normalizedId);
    }

    try {
      const result = await enviarRespuestaSesion(pin, {
        questionId: currentQuestion.id,
        answerId: normalizedId,
        answerText,
        timeLeft,
        questionIndex: currentQuestionIndex,
      });

      setIsCorrect(result.correct);
      setTotalScore(result.totalScore);
      setPuntosGanados(result.pointsEarned);
      setRespuestaRevelada(result.respuestaRevelada ?? "");
      setIdsCorrectos(result.opcionesCorrectas ?? []);
      setHistorial((prev) => {
        const siguiente = [...prev];
        siguiente[currentQuestionIndex] = result.correct;
        setRacha(calcularRacha(siguiente, currentQuestionIndex, result.correct));
        return siguiente;
      });
      setSimilitud(
        typeof result.similitud === "number" ? result.similitud : null
      );
      setAnswered(true);
    } catch (error) {
      console.error("Error al guardar respuesta:", error);
      setFrozenTimeLeft(null);
      const mensaje =
        error instanceof Error
          ? error.message
          : "No pudimos enviar tu respuesta.";
      if (error instanceof ApiError && error.status === 409) {
        try {
          const progreso = await obtenerProgresoSesion(pin);
          const previa = progreso.currentQuestionAnswer;
          if (previa && previa.questionIndex === currentQuestionIndex) {
            setAnswered(true);
            setIsCorrect(previa.correct);
            setTotalScore(progreso.totalScore);
            setFrozenTimeLeft(previa.timeLeft);
            setPuntosGanados(previa.pointsEarned ?? 0);
            setRespuestaRevelada(previa.respuestaRevelada ?? "");
            setIdsCorrectos(previa.opcionesCorrectas ?? []);
            setErrorEnvio(null);
            return;
          }
        } catch {
          /* se muestra el mensaje de abajo */
        }
      }
      setErrorEnvio(mensaje);
      toast.error(mensaje);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleOpcionMultiple = (id: string) => {
    if (answered || submitting) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    if (
      !esOpcionMultiple ||
      answered ||
      submitting ||
      session?.status !== "active" ||
      timeLeft > 0 ||
      selectedIds.length === 0 ||
      timeoutSubmitRef.current
    ) {
      return;
    }
    timeoutSubmitRef.current = true;
    const payload = [...selectedIds].sort().join(",");
    sendAnswer(payload);
  }, [
    esOpcionMultiple,
    answered,
    submitting,
    session?.status,
    timeLeft,
    selectedIds,
  ]);

  useEffect(() => {
    if (errorCarga) {
      setLoading(false);
      return;
    }
    if (session && questions.length > 0 && currentQuestion) {
      setLoading(false);
    }
  }, [session, questions, currentQuestion, errorCarga]);

  useEffect(() => {
    if (!loading) {
      setLento(false);
      return;
    }
    const id = window.setTimeout(() => setLento(true), 700);
    return () => window.clearTimeout(id);
  }, [loading]);

  const falloSesion = !cargandoSesion && !session && Boolean(errorSesion);

  if (errorCarga || falloSesion) {
    return (
      <div className="page-shell flex items-center justify-center min-h-screen min-h-[100dvh] px-4">
        <div className="max-w-md text-center" role="alert">
          <p className="body-text font-semibold">No pudimos cargar el quiz</p>
          <p className="text-error mt-2">{errorCarga || errorSesion}</p>
          <Button
            className="btn-primary mt-4 min-h-11"
            onClick={() => {
              setLoading(true);
              setErrorCarga(null);
              setReintentoCarga((n) => n + 1);
              recargarSesion();
            }}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  if (loading || !session || !currentQuestion) {
    if (lento) return <DespertarServidor />;
    return (
      <div className="page-shell flex items-center justify-center min-h-screen min-h-[100dvh]">
        <p className="body-text text-muted-foreground">Cargando quiz...</p>
      </div>
    );
  }

  const tiempoAgotado =
    session.status === "active" &&
    displayTimeLeft <= 0 &&
    !answered &&
    !submitting &&
    !(esOpcionMultiple && selectedIds.length > 0);
  const bloqueado = answered || submitting || tiempoAgotado;

  return (
    <div className="page-shell quiz-play-shell">
      <main className="quiz-play-main">
        <div className="qq-play-top">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="qq-label">
              Pregunta {currentQuestionIndex + 1} de {questions.length}
            </p>
            <ChipPuntaje total={totalScore} />
          </div>
          <BarraProgreso
            total={questions.length}
            actual={currentQuestionIndex}
            resultados={historial}
          />
          <div className="mt-3">
            <TimerPill
              formatted={displayFormatted}
              timeLeft={displayTimeLeft}
              progress={displayProgress}
              etiqueta={`Pregunta ${currentQuestionIndex + 1}`}
            />
          </div>
        </div>

        <div className="quiz-play-tablero">
          <section className="quiz-play-pregunta">
            <Badge variant="secondary" className="quiz-play-tipo-badge mb-2">
              {etiquetaTipoPreguntaPlay(currentQuestion)}
            </Badge>
            <p className="quiz-play-pregunta-kicker">Responde a continuación</p>
            {esOpcionMultiple ? (
              <p className="mb-2 text-sm font-medium text-foreground">
                {PISTA_OPCION_MULTIPLE}
              </p>
            ) : null}
            <h2 className="question-text quiz-play-enunciado whitespace-pre-wrap break-words">
              {currentQuestion.question}
            </h2>
          </section>

          <section className="quiz-play-respuestas">
            {currentQuestion.imageUrl ? (
              <ImagenReferenciaPregunta imageUrl={currentQuestion.imageUrl} />
            ) : null}
            {esEscrita ? (
              <div className="space-y-3">
                <Input
                  type="text"
                  inputMode="text"
                  className="input-institutional w-full min-h-11 bg-white text-base text-black placeholder:text-neutral-500"
                  disabled={bloqueado}
                  value={selectedOption ?? ""}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  placeholder="Palabra, número o código (ej. 5, Software , derecho)"
                />
                <Button
                  className="btn-primary w-full min-h-11 text-base"
                  disabled={bloqueado || !selectedOption?.trim()}
                  onClick={() => sendAnswer()}
                >
                  Enviar respuesta
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <TableroOpciones
                  opciones={currentQuestion.options ?? []}
                  modoMultiple={esOpcionMultiple}
                  seleccionada={esOpcionMultiple ? null : selectedOption}
                  seleccionadas={esOpcionMultiple ? selectedIds : []}
                  deshabilitado={bloqueado}
                  revelar={answered}
                  idsCorrectos={idsCorrectos}
                  onSeleccionar={(id) => {
                    if (esOpcionMultiple) {
                      toggleOpcionMultiple(id);
                      return;
                    }
                    setSelectedOption(id);
                    sendAnswer(id);
                  }}
                />
                {esOpcionMultiple ? (
                  <>
                    <p className="text-center text-sm text-foreground sm:text-left">
                      {PISTA_OPCION_MULTIPLE}
                    </p>
                    <p className="text-center text-sm font-medium sm:text-left">
                      Seleccionadas: {selectedIds.length}
                    </p>
                    <Button
                      className="btn-primary w-full min-h-11 text-base"
                      disabled={bloqueado || selectedIds.length === 0}
                      onClick={() => sendAnswer()}
                    >
                      Listo
                    </Button>
                  </>
                ) : null}
              </div>
            )}
          </section>
        </div>

        {errorEnvio && (
          <div className="quiz-play-feedback" role="alert">
            <p className="text-error">{errorEnvio}</p>
          </div>
        )}

        {submitting && (
          <div className="quiz-play-feedback">
            <p className="body-small text-muted-foreground">Verificando respuesta...</p>
          </div>
        )}

        {tiempoAgotado ? <EstadoTiempoAgotado /> : null}

        {answered && isCorrect !== null ? (
          <FeedbackCard
            correcta={isCorrect}
            puntos={puntosGanados}
            total={totalScore}
            respuesta={respuestaRevelada}
            racha={racha}
            similitud={similitud}
          />
        ) : null}
      </main>
    </div>
  );
}
