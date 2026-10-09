"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { obtenerUsuarioActual } from "@/lib/client/auth";
import { obtenerQuiz } from "@/lib/client/services/quizzes";
import { obtenerSesion, obtenerResultadosQuiz } from "@/lib/client/services/sesiones";
import { preguntaApiToUi } from "@/lib/client/mappers/pregunta-ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Users,
  CheckCircle,
  AlertTriangle,
  TrophyIcon,
} from "lucide-react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
import { PodioKahoot } from "@/components/podio-kahoot";
import type { RespuestaParticipante } from "@/app/types/sesion";

type UserResult = {
  userId: string;
  name: string;
  totalScore: number;
  answers: RespuestaParticipante[];
};

export default function QuizSummaryPage() {
  const { code } = useParams();
  const router = useRouter();

  const [quiz, setQuiz] = useState<{ title: string; description: string } | null>(null);
  const [questions, setQuestions] = useState<
    Array<{
      id: string;
      question: string;
      questionType: string;
      points: number;
      timeLimit: number;
    }>
  >([]);
  const [allUsers, setAllUsers] = useState<UserResult[]>([]);
  const [me, setMe] = useState<UserResult | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [couldnIdentify, setCouldnIdentify] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!code) return;

    const load = async () => {
      setLoading(true);
      try {
        const sesion = await obtenerSesion(String(code));
        const quizData = await obtenerQuiz(sesion.quizId);
        setQuiz({ title: quizData.titulo, description: quizData.descripcion });

        const questionsData = quizData.preguntas.map((p) => {
          const ui = preguntaApiToUi(p);
          return {
            id: ui.id,
            question: ui.question,
            questionType: ui.questionType,
            points: ui.points,
            timeLimit: ui.timeLimit,
          };
        });
        setQuestions(questionsData);

        const resultados = await obtenerResultadosQuiz(sesion.quizId);
        const users: UserResult[] = resultados.participantes
          .filter((p) => p.sessionId === String(code))
          .map((p) => ({
            userId: p.userId,
            name: p.playerName,
            totalScore: p.totalScore,
            answers: p.answers,
          }));

        if (users.length === 0) {
          setAllUsers([]);
          setMe(null);
          setMyRank(null);
          setLoading(false);
          return;
        }

        const sorted = [...users].sort((a, b) => b.totalScore - a.totalScore);
        setAllUsers(sorted);

        const sesionUsuario = await obtenerUsuarioActual();
        const currentUid = sesionUsuario?.id ?? null;

        let meFound: UserResult | null =
          (currentUid && users.find((u) => u.userId === currentUid)) || null;

        if (!meFound) {
          meFound = users[0];
          setCouldnIdentify(true);
        }

        setMe(meFound);
        const rank = sorted.findIndex((u) => u.userId === meFound!.userId);
        setMyRank(rank >= 0 ? rank + 1 : null);
        setLoading(false);
      } catch (e) {
        console.error(e);
        router.push("/student");
        setLoading(false);
      }
    };

    load();
  }, [code, router]);

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center min-h-screen min-h-[100dvh]">
        <p className="body-text text-muted-foreground">Cargando resultados...</p>
      </div>
    );
  }

  if (!me) {
    return (
      <div className="page-shell flex flex-col items-center justify-center min-h-screen min-h-[100dvh] px-4">
        <Card className="w-full max-w-md p-6 sm:p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">No hay resultados disponibles</h2>
            <p className="text-muted-foreground mb-4">
              No pudimos encontrar tu intento en esta sesión.
            </p>
            <Link href="/student">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalQuestions = questions.length;
  const answered = me.answers || [];
  const answeredMap = new Map<string, RespuestaParticipante>();
  answered.forEach((a) => answeredMap.set(a.questionId, a));
  const correctCount = answered.reduce((acc, a) => acc + (a.correct ? 1 : 0), 0);

  return (
    <div className="page-shell podio-shell">
      <Navigation />

      <main className="page-main overflow-x-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="min-w-0 w-full sm:w-auto">
            <h1 className="heading-primary text-2xl sm:text-3xl">Tú Resultado 👤</h1>
            <p className="heading-secondary mt-2 sm:mt-4 text-base sm:text-lg break-words">
              {quiz?.title}
            </p>
          </div>

          <div className="w-full sm:w-auto">
            <Link href="/student" className="w-full sm:w-auto block">
              <Button variant="outline" className="w-full sm:w-auto">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al inicio
              </Button>
            </Link>
          </div>
        </div>

        {couldnIdentify && (
          <Card className="mb-6 border-amber-300 bg-amber-50">
            <CardContent className="flex items-start gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-800">
                No pudimos identificar tu intento con certeza. Se muestra el primer resultado
                encontrado en esta sesión.
              </div>
            </CardContent>
          </Card>
        )}

        {allUsers.length > 0 && (
          <div className="mb-8">
            <PodioKahoot
              titulo="Podio de ganadores"
              ranking={allUsers.map((u) => ({
                nombre: u.name,
                puntos: u.totalScore,
                destacado: me?.userId === u.userId,
              }))}
            />
          </div>
        )}

        <div className="podio-stats-grid mb-8 sm:mb-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tu posición</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums">
                {myRank ?? "-"}
                <span className="text-base text-muted-foreground"> / {allUsers.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Lugar en el ranking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Tus puntos</CardTitle>
              <TrophyIcon className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums">{me.totalScore}</div>
              <p className="text-xs text-muted-foreground">Puntaje total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aciertos</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold tabular-nums">
                {correctCount}
                <span className="text-base text-muted-foreground"> / {totalQuestions}</span>
              </div>
              <p className="text-xs text-muted-foreground">Preguntas correctas</p>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">Tu análisis por pregunta</CardTitle>
            <CardDescription>Cómo te fue en cada una</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-5 px-4 sm:px-6">
            {questions.map((q) => {
              const a = answeredMap.get(q.id);
              const status = !a ? "no-answer" : a.correct ? "correct" : "wrong";
              const pct = a?.correct ? 100 : 0;

              return (
                <div key={q.id} className="space-y-2 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base whitespace-pre-wrap break-words">
                        {q.question}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {status === "correct" && (
                          <>Respuesta: <span className="font-medium">{a?.answerText ?? "—"}</span></>
                        )}
                        {status === "wrong" && (
                          <>Respuesta: <span className="font-medium">{a?.answerText ?? "—"}</span></>
                        )}
                        {status === "no-answer" && <>No respondiste esta pregunta</>}
                      </p>
                      {typeof a?.pointsEarned === "number" && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          +{a.pointsEarned} puntos
                        </p>
                      )}
                    </div>

                    <Badge
                      variant={
                        status === "correct"
                          ? "default"
                          : status === "wrong"
                            ? "destructive"
                            : "secondary"
                      }
                      className="shrink-0 self-start sm:self-auto"
                    >
                      {status === "correct"
                        ? "✓ Correcta"
                        : status === "wrong"
                          ? "✗ Incorrecta"
                          : "No respondida"}
                    </Badge>
                  </div>

                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
