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
  Trophy,
  Medal,
  ArrowLeft,
  Users,
  CheckCircle,
  AlertTriangle,
  TrophyIcon,
} from "lucide-react";
import Link from "next/link";
import { Navigation } from "@/components/navigation";
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
  const [topStudents, setTopStudents] = useState<UserResult[]>([]);
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
          setTopStudents([]);
          setMe(null);
          setMyRank(null);
          setLoading(false);
          return;
        }

        const sorted = [...users].sort((a, b) => b.totalScore - a.totalScore);
        setTopStudents(sorted.slice(0, 3));
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

        {topStudents.length > 0 && (
          <Card className="mb-8 overflow-hidden">
            <CardHeader>
              <CardTitle className="heading-secondary text-center">Podio de Ganadores</CardTitle>
            </CardHeader>
            <CardContent className="px-2 py-4 sm:px-6 sm:py-8 overflow-hidden">
              <div className="mx-auto w-full max-w-[820px] mt-0 md:mt-10">
                <div className="grid grid-cols-3 items-end justify-items-center gap-4 sm:gap-6 md:gap-10 min-w-0 mt-2">
                  <div className="flex flex-col items-center min-w-0">
                    <div className="flex items-center justify-center rounded-full bg-gradient-to-b from-gray-400 to-gray-600 text-white shadow-xl w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24">
                      <Medal className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                    </div>
                    {topStudents[1] ? (
                      <div className="bg-card rounded-lg shadow-lg text-center mt-2 px-4 py-2 w-20 sm:w-40 md:w-full max-w-full">
                        <div className="font-bold text-muted-foreground text-xs sm:text-sm">2°</div>
                        <div className="font-semibold truncate text-[11px] sm:text-sm" title={topStudents[1].name}>
                          {topStudents[1].name}
                        </div>
                        <div className="font-bold text-muted-foreground text-[11px] sm:text-sm">
                          {topStudents[1].totalScore} pts
                        </div>
                      </div>
                    ) : (
                      <div className="h-0" />
                    )}
                  </div>

                  <div className="flex flex-col items-center min-w-0 scale-[1.06] sm:scale-110 md:scale-125">
                    <div className="flex items-center justify-center rounded-full bg-gradient-to-b from-yellow-400 to-yellow-600 text-white shadow-2xl w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 animate-bounce">
                      <Trophy className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10" />
                    </div>
                    <div className="bg-card rounded-lg shadow-2xl text-center border-4 border-yellow-400 mt-2 px-2 py-2 w-28 sm:w-40 md:w-full max-w-full animate-pulse">
                      <div className="font-bold text-yellow-600 text-xs sm:text-sm">1°</div>
                      <div className="font-bold truncate text-[11px] sm:text-sm" title={topStudents[0].name}>
                        {topStudents[0].name}
                      </div>
                      <div className="font-bold text-yellow-600 text-[11px] sm:text-sm">
                        {topStudents[0].totalScore} pts
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center min-w-0">
                    <div className="flex items-center justify-center rounded-full bg-gradient-to-b from-orange-400 to-orange-600 text-white shadow-xl w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24">
                      <Medal className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                    </div>
                    {topStudents[2] ? (
                      <div className="bg-card rounded-lg shadow-lg text-center mt-2 px-4 py-2 w-20 sm:w-40 md:w-full max-w-full">
                        <div className="font-bold text-orange-600 text-xs sm:text-sm">3°</div>
                        <div className="font-semibold truncate text-[11px] sm:text-sm" title={topStudents[2].name}>
                          {topStudents[2].name}
                        </div>
                        <div className="font-bold text-orange-600 text-[11px] sm:text-sm">
                          {topStudents[2].totalScore} pts
                        </div>
                      </div>
                    ) : (
                      <div className="h-0" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
