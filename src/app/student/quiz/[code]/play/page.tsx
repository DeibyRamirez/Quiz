"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock } from "lucide-react";
import { obtenerUsuarioActual } from "@/lib/client/auth";
import { listarPreguntas } from "@/lib/client/services/preguntas";
import {
  enviarRespuestaSesion,
  obtenerProgresoSesion,
  unirseSesion,
} from "@/lib/client/services/sesiones";
import {
  preguntaApiToUi,
  type QuestionUi,
} from "@/lib/client/mappers/pregunta-ui";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useSesionLive } from "@/hooks/useSesionLive";
import { useSesionTimer } from "@/hooks/useSesionTimer";

export default function StudentPlayPage() {
  const params = useParams();
  const pin = params.code as string;
  const router = useRouter();

  const { sesion: session, serverOffsetMs } = useSesionLive(pin, { heartbeat: true });
  const [questions, setQuestions] = useState<QuestionUi[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionUi | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [player, setPlayer] = useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
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
      setIsCorrect(null);
      setFrozenTimeLeft(null);

      obtenerProgresoSesion(pin).then((progreso) => {
        const prev = progreso.currentQuestionAnswer;
        if (prev && prev.questionIndex === index) {
          setAnswered(true);
          setSelectedOption(prev.answerId);
          setIsCorrect(prev.correct);
          setTotalScore(progreso.totalScore);
          setFrozenTimeLeft(prev.timeLeft);
        }
      }).catch(() => {});
    }
  }, [currentQuestionIndex, questions, currentQuestion?.id, pin]);

  const sendAnswer = async (optionId: string | null = selectedOption) => {
    if (!player || !currentQuestion || !session || answered || submitting) return;

    const answerId = optionId || selectedOption || "";
    if (!answerId) return;

    setSubmitting(true);
    setFrozenTimeLeft(timeLeft);
    setSelectedOption(answerId);

    let answerText = answerId;
    if (currentQuestion.questionType === "multiple-choice" && currentQuestion.options) {
      const opt = currentQuestion.options.find((o) => o.id === answerId);
      answerText = opt?.text ?? answerId;
    }

    try {
      const result = await enviarRespuestaSesion(pin, {
        questionId: currentQuestion.id,
        answerId,
        answerText,
        timeLeft,
        questionIndex: currentQuestionIndex,
      });

      setIsCorrect(result.correct);
      setTotalScore(result.totalScore);
      setAnswered(true);
    } catch (error) {
      console.error("Error al guardar respuesta:", error);
      setFrozenTimeLeft(null);
      setSelectedOption(null);
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="page-shell quiz-play-shell">
      <main className="quiz-play-main">
        {/* Timer sincronizado con docente (qScheduledAt + qTimeLimitSec) */}
        <div className="quiz-timer-bar">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Pregunta {currentQuestionIndex + 1} de {questions.length}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <Clock className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <span
                className={`text-xl sm:text-2xl font-bold tabular-nums ${
                  displayTimeLeft <= 10 ? "text-destructive" : "text-primary"
                }`}
              >
                {displayFormatted}
              </span>
            </div>
          </div>
          <Progress value={displayProgress} className="h-2 sm:h-2.5" />
        </div>

        <Card className="card-institutional w-full shadow-sm">
          <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
            <CardTitle className="heading-tertiary text-base sm:text-lg">
              Responde a continuación
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <h2 className="question-text mb-4 sm:mb-6 whitespace-pre-wrap break-words">
              {currentQuestion.question}
            </h2>

            {currentQuestion.questionType === "numerical" ||
            currentQuestion.questionType === "exact-text" ? (
              <div className="mb-4 sm:mb-6 space-y-3">
                <Input
                  type="text"
                  inputMode={
                    currentQuestion.questionType === "numerical" ? "decimal" : "text"
                  }
                  className="input-institutional w-full min-h-11 text-base"
                  disabled={answered || submitting}
                  value={selectedOption ?? ""}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  placeholder={
                    currentQuestion.questionType === "numerical"
                      ? `Respuesta numérica (${currentQuestion.unit ?? "unidad"})`
                      : "Escribe tu respuesta exacta"
                  }
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
              <div className="answers-grid mb-4 sm:mb-6">
                {currentQuestion.options?.map((opt, i) => (
                  <Button
                    key={opt.id || i}
                    variant={selectedOption === opt.id ? "default" : "outline"}
                    className="answer-button text-left justify-start h-auto py-3 sm:py-4"
                    disabled={answered || submitting}
                    onClick={() => {
                      setSelectedOption(opt.id);
                      sendAnswer(opt.id);
                    }}
                  >
                    <span className="break-words">{opt.text}</span>
                  </Button>
                ))}
              </div>
            )}

            {submitting && (
              <div className="mt-4 p-4 sm:p-5 bg-muted/50 border border-border rounded-xl text-center">
                <p className="body-small text-muted-foreground">Verificando respuesta...</p>
              </div>
            )}

            {answered && isCorrect !== null && (
              <div className="mt-4 p-4 sm:p-5 bg-muted/80 border border-border rounded-xl">
                <div className="text-center space-y-2">
                  <p className="body-small text-muted-foreground">
                    Puntaje total:{" "}
                    <span className="font-bold text-lg text-primary">{totalScore}</span> puntos
                  </p>
                  <p
                    className={`text-xl sm:text-2xl font-semibold ${
                      isCorrect === true ? "text-success" : "text-error"
                    }`}
                  >
                    {isCorrect === true ? "¡Respuesta correcta!" : "¡Respuesta incorrecta!"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Espera a que el docente avance a la siguiente pregunta
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
