"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
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
import { BarraTiempoSesion } from "@/components/barra-tiempo-sesion";
import { ImagenReferenciaPregunta } from "@/components/imagen-referencia-pregunta";
import { TableroOpciones } from "@/components/tablero-opciones";
import { useSesionLive } from "@/hooks/useSesionLive";
import { useSesionTimer } from "@/hooks/useSesionTimer";

function pistaCantidadOpcionMultiple(cantidad: number): string {
  if (cantidad === 1) {
    return "Selecciona 1 respuesta correcta.";
  }
  if (cantidad >= 2) {
    return `Hay ${cantidad} respuestas correctas. Selecciónalas todas antes de pulsar Listo.`;
  }
  return "Puedes marcar varias opciones. Pulsa Listo cuando termines.";
}

export default function StudentPlayPage() {
  const params = useParams();
  const pin = params.code as string;
  const router = useRouter();

  const { sesion: session, serverOffsetMs } = useSesionLive(pin, { heartbeat: true });
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

  const cantidadCorrectas = useMemo(() => {
    if (!esOpcionMultiple || !currentQuestion?.options) return 0;
    return currentQuestion.options.filter((o) => o.isCorrect).length;
  }, [esOpcionMultiple, currentQuestion?.id, currentQuestion?.options]);

  const textoPistaMultiple = useMemo(() => {
    if (!esOpcionMultiple) return null;
    return pistaCantidadOpcionMultiple(cantidadCorrectas);
  }, [esOpcionMultiple, cantidadCorrectas]);

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
    listarPreguntas(session.quizId).then((data) => {
      setQuestions(data.map(preguntaApiToUi));
    });
  }, [session?.quizId]);

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

      obtenerProgresoSesion(pin).then((progreso) => {
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
      setSimilitud(
        typeof result.similitud === "number" ? result.similitud : null
      );
      setAnswered(true);
    } catch (error) {
      console.error("Error al guardar respuesta:", error);
      setFrozenTimeLeft(null);
      if (currentQuestion.permiteMultiples) {
        setSelectedIds([]);
      } else {
        setSelectedOption(null);
      }
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
    if (session && questions.length > 0 && currentQuestion) {
      setLoading(false);
    }
  }, [session, questions, currentQuestion]);

  if (loading || !session || !currentQuestion) {
    return (
      <div className="page-shell flex items-center justify-center min-h-screen min-h-[100dvh]">
        <p className="body-text text-muted-foreground">Cargando quiz...</p>
      </div>
    );
  }

  const porcentajeSimilitud =
    similitud !== null ? Math.round(similitud * 100) : null;

  return (
    <div className="page-shell quiz-play-shell">
      <main className="quiz-play-main">
        <BarraTiempoSesion
          formatted={displayFormatted}
          timeLeft={displayTimeLeft}
          progress={displayProgress}
          etiqueta={`Pregunta ${currentQuestionIndex + 1} de ${questions.length}`}
        />

        <div className="quiz-play-tablero">
          <section className="quiz-play-pregunta">
            <Badge variant="secondary" className="quiz-play-tipo-badge mb-2">
              {etiquetaTipoPreguntaPlay(currentQuestion)}
            </Badge>
            <p className="quiz-play-pregunta-kicker">Responde a continuación</p>
            {esOpcionMultiple && cantidadCorrectas > 0 && textoPistaMultiple ? (
              <p className="text-sm font-medium text-primary mb-2">
                {textoPistaMultiple}
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
                  className="input-institutional w-full min-h-11 text-base bg-white text-black placeholder:text-neutral-500"
                  disabled={answered || submitting}
                  value={selectedOption ?? ""}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  placeholder="Palabra, número o código (ej. 5, Software , derecho)"
                />
                <Button
                  className="btn-primary w-full min-h-11 text-base"
                  disabled={answered || submitting || !selectedOption?.trim()}
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
                  deshabilitado={answered || submitting}
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
                    <p className="text-sm text-muted-foreground text-center sm:text-left">
                      {textoPistaMultiple ??
                        "Puedes marcar varias opciones. Pulsa Listo cuando termines."}
                    </p>
                    {cantidadCorrectas > 0 ? (
                      <p className="text-sm font-medium text-center sm:text-left">
                        Seleccionadas: {selectedIds.length} de {cantidadCorrectas}
                      </p>
                    ) : null}
                    <Button
                      className="btn-primary w-full min-h-11 text-base"
                      disabled={
                        answered || submitting || selectedIds.length === 0
                      }
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

        {submitting && (
          <div className="quiz-play-feedback">
            <p className="body-small text-muted-foreground">Verificando respuesta...</p>
          </div>
        )}

        {answered && isCorrect !== null && (
          <div
            className={`quiz-play-feedback ${
              isCorrect ? "quiz-play-feedback-ok" : "quiz-play-feedback-error"
            }`}
          >
            {isCorrect ? (
              <CheckCircle2 className="icono-acierto h-10 w-10 text-success mx-auto" />
            ) : (
              <XCircle className="icono-error h-10 w-10 text-error mx-auto" />
            )}
            <p className="body-small text-muted-foreground mt-2">
              Puntaje total:{" "}
              <span className="font-bold text-lg text-primary">{totalScore}</span> puntos
            </p>
            <p
              className={`text-xl sm:text-2xl font-semibold ${
                isCorrect ? "text-success" : "text-error"
              }`}
            >
              {isCorrect ? "¡Respuesta correcta!" : "¡Respuesta incorrecta!"}
            </p>
            {porcentajeSimilitud !== null && (
              <p className="text-sm sm:text-base font-medium mt-1">
                Parecido al {porcentajeSimilitud}% —{" "}
                {isCorrect ? "válida" : "no válida"}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Espera a que el docente avance a la siguiente pregunta
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
