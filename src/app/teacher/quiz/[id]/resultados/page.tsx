"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Users,
  TrendingUp,
  Filter,
  Medal,
} from "lucide-react";
import { Navigation } from "@/components/navigation";
import { Progress } from "@/components/ui/progress";
import { obtenerQuiz } from "@/lib/client/services/quizzes";
import { obtenerResultadosQuiz } from "@/lib/client/services/sesiones";

export default function TeacherRespuestasPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [allAnswers, setAllAnswers] = useState<any[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [sessionGroups, setSessionGroups] = useState<any[]>([]);
  const [selectedGroupName, setSelectedGroupName] = useState<string>("all");

  // Preguntas en orden real + su texto (para mostrar todas aunque nadie responda)
  const [questionOrder, setQuestionOrder] = useState<string[]>([]);
  const [questionsMeta, setQuestionsMeta] = useState<{ id: string; question: string }[]>([]);

  useEffect(() => {
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const quiz = await obtenerQuiz(id);
        setQuizTitle(quiz.titulo || "Sin título");

        const meta = quiz.preguntas.map((p) => ({
          id: p.id,
          question: p.texto || "",
        }));
        setQuestionsMeta(meta);
        setQuestionOrder(meta.map((m) => m.id));

        const resultados = await obtenerResultadosQuiz(id);
        const answersList = resultados.participantes.map((p) => ({
          userId: p.userId,
          sessionId: p.sessionId,
          sessionName: p.sessionName,
          playerName: p.playerName,
          totalScore: p.totalScore,
          answers: p.answers,
        }));

        setSessionGroups(resultados.sessionGroups);
        setAllAnswers(answersList);
        setLoading(false);
      } catch (err) {
        console.error("Error cargando resultados:", err);
        setLoading(false);
      }
    };

    loadData();
  }, [id, router]);

  // Filtro por nombre de grupo
  const filteredAnswers = useMemo(() => {
    let result =
      selectedGroupName === "all"
        ? allAnswers
        : allAnswers.filter((a) => a.sessionName === selectedGroupName);
    return [...result].sort((a, b) => b.totalScore - a.totalScore);
  }, [allAnswers, selectedGroupName]);

  const stats = {
    totalPlayers: filteredAnswers.length,
    averageScore:
      filteredAnswers.length > 0
        ? (
          filteredAnswers.reduce((sum, a) => sum + a.totalScore, 0) /
          filteredAnswers.length
        ).toFixed(1)
        : "0",
    highestScore: filteredAnswers[0]?.totalScore || 0,
  };

  const top3 = filteredAnswers.slice(0, 3);
  const currentGroupName =
    selectedGroupName === "all" ? "Todas las sesiones" : selectedGroupName;

  // ===== Análisis por pregunta (para todos) =====
  const perQuestionStats = useMemo(() => {
    const participantsTotal = new Set(filteredAnswers.map((u) => u.userId)).size;
    const answeredByQ = new Map<string, Set<string>>();
    const correctByQ = new Map<string, Set<string>>();

    for (const user of filteredAnswers) {
      for (const a of user.answers || []) {
        const qid = a.questionId || a.question || `unknown-${a.question}`;
        if (!answeredByQ.has(qid)) answeredByQ.set(qid, new Set());
        answeredByQ.get(qid)!.add(user.userId);

        if (a.correct) {
          if (!correctByQ.has(qid)) correctByQ.set(qid, new Set());
          correctByQ.get(qid)!.add(user.userId);
        }
      }
    }

    const rows = (questionsMeta.length ? questionsMeta : []).map((q) => {
      const answeredUsers = answeredByQ.get(q.id)?.size ?? 0;
      const correctUsers = correctByQ.get(q.id)?.size ?? 0;
      const percent =
        answeredUsers > 0 ? Math.min(100, Math.round((correctUsers / answeredUsers) * 100)) : 0;

      return {
        id: q.id,
        question: q.question,
        answered: answeredUsers,
        correct: correctUsers,
        percent,
        participants: participantsTotal,
      };
    });

    for (const [qid, setAnswered] of answeredByQ.entries()) {
      const already = rows.find((r) => r.id === qid);
      if (already) continue;
      const corr = correctByQ.get(qid)?.size ?? 0;
      const ans = setAnswered.size;
      rows.push({
        id: qid,
        question: qid.startsWith("unknown-") ? qid.replace("unknown-", "") : "Pregunta",
        answered: ans,
        correct: corr,
        percent: ans > 0 ? Math.min(100, Math.round((corr / ans) * 100)) : 0,
        participants: participantsTotal,
      });
    }

    if (questionOrder.length) {
      const pos = new Map(questionOrder.map((qid, i) => [qid, i]));
      rows.sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9));
    }

    return rows;
  }, [filteredAnswers, questionsMeta, questionOrder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p>Cargando resultados...</p>
        </div>
      </div>
    );
  }

  if (allAnswers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-sm p-6 sm:p-8 text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-foreground flex flex-col items-center gap-3">
              <div className="bg-yellow-100 text-yellow-600 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full shadow-inner">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 sm:h-12 sm:w-12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="13" />
                  <circle cx="12" cy="16" r="1" />
                </svg>
              </div>
              No hay respuestas disponibles
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm sm:text-base">
              Aún no se han enviado respuestas a este quiz.
            </p>

            <Link href="/teacher" className="inline-block">
              <Button className="w-full h-11 text-base rounded-md">
                Volver al inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Navigation />
      <main className="page-main">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="heading-primary flex items-center gap-3">
              Resultados del Quiz
            </h1>
            <p className="heading-secondary mt-2">{quizTitle}</p>
          </div>
          <Link href="/teacher">
            <Button variant="outline" size="lg">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </Link>
        </div>

        {/* FILTRO POR NOMBRE DE SESIÓN */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle className="text-lg">
                Filtrar por nombre de sesión
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedGroupName}
              onValueChange={setSelectedGroupName}
            >
              <SelectTrigger className="w-full md:w-96">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Todas las sesiones ({allAnswers.length} jugadores)
                </SelectItem>
                {sessionGroups.map((group) => (
                  <SelectItem key={group.name} value={group.name}>
                    {group.name} ({group.playerCount} jugador
                    {group.playerCount !== 1 ? "es" : ""})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* ESTADÍSTICAS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participantes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalPlayers}</div>
              <p className="text-xs text-muted-foreground">
                En {currentGroupName}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.averageScore}</div>
              <p className="text-xs text-muted-foreground">Puntos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mejor</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {stats.highestScore}
              </div>
              <p className="text-xs text-muted-foreground">Puntos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Grupos</CardTitle>
              <Badge variant="secondary">{sessionGroups.length}</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{sessionGroups.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* PODIO */}
        {top3.length > 0 && (
          <Card className="mb-8 overflow-hidden">
            <CardHeader>
              <CardTitle className="heading-secondary text-center">
                Top 3 de {currentGroupName}
              </CardTitle>
            </CardHeader>

            <CardContent className="px-2 py-4 sm:px-6 sm:py-8 overflow-hidden">
              <div className="mx-auto w-full max-w-[820px] mt-0 md:mt-10">
                <div className="grid grid-cols-3 items-end justify-items-center gap-4 sm:gap-6 md:gap-10 min-w-0 mt-2">
                  {/* 2° */}
                  <div className="flex flex-col items-center min-w-0">
                    <div className="flex items-center justify-center rounded-full bg-linear-to-b from-gray-400 to-gray-600 text-white shadow-xl w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24">
                      <Medal className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                    </div>

                    {top3[1] ? (
                      <div className="bg-card rounded-lg shadow-lg text-center mt-2 px-4 py-2 w-20 sm:w-40 md:w-full max-w-full">
                        <div className="font-bold text-muted-foreground text-xs sm:text-sm">
                          2°
                        </div>
                        <div
                          className="font-semibold truncate text-[11px] sm:text-sm"
                          title={top3[1].playerName}
                        >
                          {top3[1].playerName}
                        </div>
                        <div className="font-bold text-muted-foreground text-[11px] sm:text-sm">
                          {top3[1].totalScore} pts
                        </div>
                      </div>
                    ) : (
                      <div className="h-0" />
                    )}
                  </div>

                  {/* 1° */}
                  <div className="flex flex-col items-center min-w-0 scale-[1.06] sm:scale-110 md:scale-125">
                    <div className="flex items-center justify-center rounded-full bg-linear-to-b from-yellow-400 to-yellow-600 text-white shadow-2xl w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 animate-bounce">
                      <Trophy className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10" />
                    </div>

                    <div className="bg-card rounded-lg shadow-2xl text-center border-4 border-yellow-400 mt-2 px-2 py-2 w-28 sm:w-40 md:w-full max-w-full animate-pulse">
                      <div className="font-bold text-yellow-600 text-xs sm:text-sm">
                        1°
                      </div>
                      <div
                        className="font-bold truncate text-[11px] sm:text-sm"
                        title={top3[0].playerName}
                      >
                        {top3[0].playerName}
                      </div>
                      <div className="font-bold text-yellow-600 text-[11px] sm:text-sm">
                        {top3[0].totalScore} pts
                      </div>
                    </div>
                  </div>

                  {/* 3° */}
                  <div className="flex flex-col items-center min-w-0">
                    <div className="flex items-center justify-center rounded-full bg-linear-to-b from-orange-400 to-orange-600 text-white shadow-xl w-14 h-14 sm:w-20 sm:h-20 md:w-24 md:h-24">
                      <Medal className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10" />
                    </div>

                    {top3[2] ? (
                      <div className="bg-card rounded-lg shadow-lg text-center mt-2 px-4 py-2 w-20 sm:w-40 md:w-full max-w-full">
                        <div className="font-bold text-orange-600 text-xs sm:text-sm">
                          3°
                        </div>
                        <div
                          className="font-semibold truncate text-[11px] sm:text-sm"
                          title={top3[2].playerName}
                        >
                          {top3[2].playerName}
                        </div>
                        <div className="font-bold text-orange-600 text-[11px] sm:text-sm">
                          {top3[2].totalScore} pts
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

        {/* ===== Análisis por pregunta (para TODOS en el grupo filtrado) ===== */}
        <Card className="mb-10">
          <CardHeader>
            <CardTitle>Análisis por pregunta</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Grupo: <span className="font-medium">{currentGroupName}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {perQuestionStats.length === 0 ? (
              <p className="text-muted-foreground">
                No hay respuestas para analizar en este grupo.
              </p>
            ) : (
              perQuestionStats.map((q) => (
                <div key={q.id} className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium whitespace-pre-wrap wrap-break-word">{q.question}</p>
                      <p className="text-xs text-muted-foreground">
                        {q.correct}/{q.answered} correctas · {q.answered}/{q.participants} respondieron
                      </p>
                      {q.answered === 0 && (
                        <p className="text-xs text-amber-600">Nadie respondió esta pregunta.</p>
                      )}
                    </div>
                    <Badge
                      variant={
                        q.percent >= 80 ? "default" : q.percent >= 50 ? "secondary" : "destructive"
                      }
                      className="shrink-0"
                    >
                      {q.percent}% acierto
                    </Badge>
                  </div>
                  <Progress value={q.percent} className="h-2" />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* RANKING */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">
            Ranking completo de {currentGroupName}
          </h2>
          {filteredAnswers.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No hay participantes en este grupo
            </p>
          ) : (
            filteredAnswers.map((user, index) => (
              <ResultCard
                key={`${user.sessionId}-${user.userId}`}
                user={user}
                rank={index + 1}
                questionsMeta={questionsMeta}  // <<-- 🔧 pasamos la lista ordenada de preguntas
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

// 🔧 ResultCard ahora muestra TODAS las preguntas (orden Firestore) y marca “No respondida”
function ResultCard({
  user,
  rank,
  questionsMeta,
}: {
  user: any;
  rank: number;
  questionsMeta: { id: string; question: string }[];
}) {
  // Mapas para localizar respuestas por id y por texto (compat. con datos viejos)
  const mapById = new Map<string, any>();
  const mapByText = new Map<string, any>();
  (user.answers || []).forEach((a: any) => {
    if (a.questionId) mapById.set(a.questionId, a);
    if (a.question) mapByText.set(a.question, a);
  });

  // Respuestas huérfanas (sin id y sin texto coincidente en meta)
  const orphanAnswers = (user.answers || []).filter(
    (a: any) =>
      !a.questionId &&
      a.question &&
      !questionsMeta.some((q) => q.question === a.question)
  );

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="bg-muted/50">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="text-2xl md:text-3xl font-bold">
              {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`}
            </div>
            <div>
              <CardTitle className="text-lg md:text-xl">
                {user.playerName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Sesión: {user.sessionName}
              </p>
            </div>
          </div>
          <Badge variant="default" className="text-lg px-4 py-2">
            {user.totalScore} pts
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        <h3 className="font-semibold text-foreground mb-3">Respuestas:</h3>
        <div className="space-y-3">
          {questionsMeta.map((qMeta, idx) => {
            // Buscar respuesta por id o, si falta, por el texto exacto de la pregunta
            const a =
              mapById.get(qMeta.id) ||
              mapByText.get(qMeta.question) ||
              null;

            const status = !a ? "no-answer" : a.correct ? "correct" : "wrong";

            return (
              <div
                key={qMeta.id}
                className={`p-4 rounded-lg border-2 whitespace-pre-wrap wrap-break-word ${status === "correct"
                  ? "bg-green-50 border-green-300"
                  : status === "wrong"
                    ? "bg-red-50 border-red-300"
                    : "bg-slate-50 border-slate-300"
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-foreground">
                    {idx + 1}. {qMeta.question}
                  </p>
                  <Badge
                    variant={
                      status === "correct"
                        ? "default"
                        : status === "wrong"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {status === "correct"
                      ? "✓ Correcta"
                      : status === "wrong"
                        ? "✗ Incorrecta"
                        : "No respondida"}
                  </Badge>
                </div>

                {status !== "no-answer" ? (
                  <>
                    <p className="text-sm text-foreground">
                      <span className="font-medium">Respuesta:</span>{" "}
                      {a?.answerText}
                    </p>
                    {typeof a?.pointsEarned === "number" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        +{a.pointsEarned} puntos
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No respondió esta pregunta.
                  </p>
                )}
              </div>
            );
          })}

          {/* Opcional: mostrar al final respuestas que no correspondan a preguntas en meta */}
          {orphanAnswers.length > 0 &&
            orphanAnswers.map((a: any, i: number) => (
              <div
                key={`orphan-${i}`}
                className={`p-4 rounded-lg border-2 whitespace-pre-wrap wrap-break-word ${a.correct
                  ? "bg-green-50 border-green-300"
                  : "bg-red-50 border-red-300"
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="font-semibold text-foreground">
                    {questionsMeta.length + i + 1}. {a.question || "Pregunta"}
                  </p>
                  <Badge variant={a.correct ? "default" : "destructive"}>
                    {a.correct ? "✓ Correcta" : "✗ Incorrecta"}
                  </Badge>
                </div>
                <p className="text-sm text-foreground">
                  <span className="font-medium">Respuesta:</span>{" "}
                  {a.answerText}
                </p>
                {typeof a.pointsEarned === "number" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    +{a.pointsEarned} puntos
                  </p>
                )}
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
