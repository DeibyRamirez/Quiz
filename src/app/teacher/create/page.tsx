"use client";

import { Navigation } from "@/components/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Save, Plus, Trash2, Edit, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { EstadoQuiz } from "@/app/types";
import {
  type QuizFormState,
  type QuestionFormState,
  DEFAULT_QUESTION_FORM,
  TIME_OPTIONS,
  POINTS_OPTIONS,
  FieldGroup,
  answersEqual,
  buildCanSaveQuestion,
} from "@/app/teacher/_components/quiz-form-shared";
import { obtenerUsuarioActual } from "@/lib/client/auth";
import { crearQuiz, actualizarQuiz } from "@/lib/client/services/quizzes";
import {
  listarPreguntas,
  crearPregunta,
  actualizarPregunta,
  eliminarPregunta,
} from "@/lib/client/services/preguntas";
import {
  type AnswerUi,
  type QuestionTypeUi,
  type QuestionUi,
  QUESTION_TYPE_LABELS,
  preguntaApiToUi,
  preguntaUiToCrear,
  preguntaUiToActualizar,
} from "@/lib/client/mappers/pregunta-ui";

export default function CreateQuizUnified() {
  const [quizData, setQuizData] = useState<QuizFormState>({
    title: "",
    description: "",
    estado: EstadoQuiz.BORRADOR,
  });
  const [originalQuizData, setOriginalQuizData] = useState<QuizFormState>({
    title: "",
    description: "",
    estado: EstadoQuiz.BORRADOR,
  });

  const [savedQuizId, setSavedQuizId] = useState<string | null>(null);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [quizSaved, setQuizSaved] = useState(false);

  const [questions, setQuestions] = useState<QuestionUi[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<QuestionTypeUi>("multiple-choice");
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  const [questionForm, setQuestionForm] = useState<QuestionFormState>(DEFAULT_QUESTION_FORM);
  const [originalQuestionForm, setOriginalQuestionForm] = useState<QuestionFormState>(DEFAULT_QUESTION_FORM);
  const [originalQuestionType, setOriginalQuestionType] = useState<QuestionTypeUi>("multiple-choice");

  const [answers, setAnswers] = useState<AnswerUi[]>([
    { id: "1", text: "", isCorrect: false },
    { id: "2", text: "", isCorrect: false },
  ]);
  const [originalAnswers, setOriginalAnswers] = useState<AnswerUi[]>([]);

  const [numericalInput, setNumericalInput] = useState("");
  const [numericalUnit, setNumericalUnit] = useState("");
  const [originalNumericalInput, setOriginalNumericalInput] = useState("");
  const [originalNumericalUnit, setOriginalNumericalUnit] = useState("");

  const [exactAnswerText, setExactAnswerText] = useState("");
  const [originalExactAnswerText, setOriginalExactAnswerText] = useState("");

  const recargarPreguntas = async (quizId: string) => {
    const data = await listarPreguntas(quizId, { incluirInactivas: true });
    setQuestions(data.map(preguntaApiToUi));
  };

  useEffect(() => {
    if (!savedQuizId) return;
    recargarPreguntas(savedQuizId).catch(() =>
      toast.error("Error al cargar preguntas.")
    );
  }, [savedQuizId]);

  const hasQuizChanges = () =>
    quizData.title !== originalQuizData.title ||
    quizData.description !== originalQuizData.description ||
    quizData.estado !== originalQuizData.estado ||
    (!quizSaved && quizData.title.trim() !== "");

  const hasQuestionChanges = () => {
    if (!selectedQuestionId && questionForm.question.trim() !== "") return true;

    const formChanged =
      questionForm.question !== originalQuestionForm.question ||
      questionForm.explanation !== originalQuestionForm.explanation ||
      questionForm.points !== originalQuestionForm.points ||
      questionForm.timeLimit !== originalQuestionForm.timeLimit ||
      questionForm.tema !== originalQuestionForm.tema ||
      questionForm.activa !== originalQuestionForm.activa ||
      questionForm.permiteMultiples !== originalQuestionForm.permiteMultiples ||
      questionType !== originalQuestionType;

    if (formChanged) return true;

    if (questionType === "numerical") {
      return (
        numericalInput !== originalNumericalInput ||
        numericalUnit !== originalNumericalUnit
      );
    }
    if (questionType === "exact-text") {
      return exactAnswerText !== originalExactAnswerText;
    }
    return !answersEqual(answers, originalAnswers);
  };

  const canSaveQuestion = useMemo(
    () =>
      buildCanSaveQuestion(
        questionForm,
        questionType,
        answers,
        numericalInput,
        numericalUnit,
        exactAnswerText
      ),
    [
      questionForm,
      questionType,
      answers,
      numericalInput,
      numericalUnit,
      exactAnswerText,
    ]
  );

  async function handleSaveQuiz() {
    const user = await obtenerUsuarioActual();
    if (!user) {
      toast.error("Debes iniciar sesión.");
      return;
    }
    if (!quizData.title.trim()) {
      toast.warning("El título es obligatorio.");
      return;
    }

    setIsSavingQuiz(true);
    try {
      if (savedQuizId) {
        await actualizarQuiz(savedQuizId, {
          titulo: quizData.title,
          descripcion: quizData.description,
          estado: quizData.estado,
        });
        toast.success("Quiz actualizado correctamente.");
      } else {
        const quiz = await crearQuiz({
          autorId: user.id,
          titulo: quizData.title,
          descripcion: quizData.description,
          estado: quizData.estado,
        });
        setSavedQuizId(quiz.id);
        setQuizSaved(true);
        toast.success("Quiz guardado correctamente.");
      }
      setOriginalQuizData(quizData);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar el quiz.");
    } finally {
      setIsSavingQuiz(false);
    }
  }

  const resetTypeSpecificFields = (type: QuestionTypeUi) => {
    if (type === "true-false") {
      setAnswers([
        { id: "true", text: "Verdadero", isCorrect: false },
        { id: "false", text: "Falso", isCorrect: false },
      ]);
    } else if (type === "multiple-choice") {
      setAnswers([
        { id: Date.now().toString() + "1", text: "", isCorrect: false },
        { id: Date.now().toString() + "2", text: "", isCorrect: false },
      ]);
      setQuestionForm((prev) => ({ ...prev, permiteMultiples: false }));
    } else if (type === "numerical") {
      setNumericalInput("");
      setNumericalUnit("");
    } else if (type === "exact-text") {
      setExactAnswerText("");
    }
  };

  const handleQuestionTypeChange = (type: QuestionTypeUi) => {
    setQuestionType(type);
    resetTypeSpecificFields(type);
  };

  const handleNumericalInput = (value: string) => {
    const regex = /^-?\d*\.?\d*$/;
    if (value === "" || regex.test(value)) {
      setNumericalInput(value);
    }
  };

  function buildQuestionUi(): QuestionUi {
    return {
      id: selectedQuestionId ?? "",
      quizId: savedQuizId ?? undefined,
      question: questionForm.question,
      explanation: questionForm.explanation,
      questionType,
      points: Number(questionForm.points),
      timeLimit: Number(questionForm.timeLimit),
      activa: questionForm.activa,
      tema: questionForm.tema.trim() || undefined,
      permiteMultiples: questionForm.permiteMultiples,
      exactAnswerText:
        questionType === "exact-text" ? exactAnswerText.trim() : undefined,
    };
  }

  async function handleSaveQuestion() {
    if (!(await obtenerUsuarioActual())) {
      toast.error("Debes iniciar sesión.");
      return;
    }
    if (!savedQuizId) {
      toast.warning("Primero guarda el quiz.");
      return;
    }

    if (!questionForm.question.trim()) {
      toast.warning("La pregunta es obligatoria.");
      return;
    }

    if (questionType === "multiple-choice") {
      if (answers.some((a) => !a.text.trim())) {
        toast.warning("Todas las opciones deben tener texto.");
        return;
      }
      const correctCount = answers.filter((a) => a.isCorrect).length;
      if (correctCount === 0) {
        toast.warning("Marca al menos una opción correcta.");
        return;
      }
      if (!questionForm.permiteMultiples && correctCount > 1) {
        toast.warning("Solo una opción puede ser correcta.");
        return;
      }
    }

    if (questionType === "numerical") {
      const trimmed = numericalInput.trim();
      if (!trimmed || Number.isNaN(parseFloat(trimmed))) {
        toast.warning("Ingresa un valor numérico válido.");
        return;
      }
      if (!numericalUnit) {
        toast.warning("Selecciona una unidad.");
        return;
      }
    }

    if (questionType === "exact-text" && !exactAnswerText.trim()) {
      toast.warning("La respuesta correcta es obligatoria.");
      return;
    }

    setIsSavingQuestion(true);

    try {
      const questionUi = buildQuestionUi();
      const numerical =
        questionType === "numerical"
          ? { value: parseFloat(numericalInput), unit: numericalUnit }
          : undefined;

      if (selectedQuestionId) {
        await actualizarPregunta(
          selectedQuestionId,
          preguntaUiToActualizar(questionUi, answers, numerical)
        );
        toast.success("Pregunta actualizada.");
      } else {
        await crearPregunta(
          preguntaUiToCrear(questionUi, savedQuizId, answers, numerical)
        );
        toast.success("Pregunta agregada.");
      }

      await recargarPreguntas(savedQuizId);
      resetQuestionForm();
    } catch (err) {
      console.error("Error al guardar la pregunta:", err);
      toast.error("Error al guardar la pregunta.");
    } finally {
      setIsSavingQuestion(false);
    }
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm("¿Eliminar pregunta?")) return;
    if (!savedQuizId) return;
    try {
      await eliminarPregunta(id);
      await recargarPreguntas(savedQuizId);
      toast.success("Pregunta eliminada.");
    } catch {
      toast.error("Error al eliminar la pregunta.");
    }
  }

  function snapshotQuestionState() {
    setOriginalQuestionForm({ ...questionForm });
    setOriginalQuestionType(questionType);
    setOriginalAnswers(JSON.parse(JSON.stringify(answers)));
    setOriginalNumericalInput(numericalInput);
    setOriginalNumericalUnit(numericalUnit);
    setOriginalExactAnswerText(exactAnswerText);
  }

  function editQuestion(q: QuestionUi) {
    setSelectedQuestionId(q.id);
    setQuestionType(q.questionType);

    const form: QuestionFormState = {
      question: q.question,
      explanation: q.explanation,
      points: String(q.points),
      timeLimit: String(q.timeLimit),
      tema: q.tema ?? "",
      activa: q.activa,
      permiteMultiples: q.permiteMultiples ?? false,
    };
    setQuestionForm(form);

    if (q.questionType === "numerical") {
      setNumericalInput(q.correctValue?.toString() ?? "");
      setNumericalUnit(q.unit ?? "");
      setAnswers([
        { id: "1", text: "", isCorrect: false },
        { id: "2", text: "", isCorrect: false },
      ]);
      setExactAnswerText("");
    } else if (q.questionType === "exact-text") {
      setExactAnswerText(q.exactAnswerText ?? "");
      setNumericalInput("");
      setNumericalUnit("");
      setAnswers([
        { id: "1", text: "", isCorrect: false },
        { id: "2", text: "", isCorrect: false },
      ]);
    } else if (q.questionType === "true-false") {
      const correctId = q.correctOption ?? "";
      setAnswers([
        { id: "true", text: "Verdadero", isCorrect: correctId === "true" },
        { id: "false", text: "Falso", isCorrect: correctId === "false" },
      ]);
      setNumericalInput("");
      setNumericalUnit("");
      setExactAnswerText("");
    } else {
      const correctId = q.correctOption ?? "";
      const mcAnswers = (q.options ?? []).map((opt) => ({
        ...opt,
        isCorrect: q.permiteMultiples
          ? opt.isCorrect
          : opt.id === correctId,
      }));
      setAnswers(mcAnswers);
      setNumericalInput("");
      setNumericalUnit("");
      setExactAnswerText("");
    }

    snapshotQuestionState();
  }

  function resetQuestionForm() {
    setSelectedQuestionId(null);
    setQuestionType("multiple-choice");
    setQuestionForm(DEFAULT_QUESTION_FORM);
    setAnswers([
      { id: Date.now().toString() + "1", text: "", isCorrect: false },
      { id: Date.now().toString() + "2", text: "", isCorrect: false },
    ]);
    setNumericalInput("");
    setNumericalUnit("");
    setExactAnswerText("");
    setOriginalQuestionForm(DEFAULT_QUESTION_FORM);
    setOriginalQuestionType("multiple-choice");
    setOriginalAnswers([]);
    setOriginalNumericalInput("");
    setOriginalNumericalUnit("");
    setOriginalExactAnswerText("");
  }

  const toggleCorrectAnswer = (id: string) => {
    if (questionType === "multiple-choice" && questionForm.permiteMultiples) {
      setAnswers(
        answers.map((a) =>
          a.id === id ? { ...a, isCorrect: !a.isCorrect } : a
        )
      );
    } else {
      setAnswers(
        answers.map((a) => ({ ...a, isCorrect: a.id === id }))
      );
    }
  };

  const updateAnswer = (id: string, text: string) =>
    setAnswers(answers.map((a) => (a.id === id ? { ...a, text } : a)));

  const addAnswer = () =>
    setAnswers([
      ...answers,
      { id: Date.now().toString(), text: "", isCorrect: false },
    ]);

  const removeAnswer = (id: string) => {
    if (answers.length > 2) {
      setAnswers(answers.filter((a) => a.id !== id));
    }
  };

  const updateQuestionForm = (patch: Partial<QuestionFormState>) =>
    setQuestionForm((prev) => ({ ...prev, ...patch }));

  return (
    <div className="page-shell">
      <Navigation />
      <main className="page-main space-y-8">
        <div className="flex items-center gap-4 mb-4">
          <Link href="/teacher">
            <Button variant="outline" size="sm" className="border-primary text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
          </Link>
          <h1 className="heading-primary">Crear Quiz con Preguntas</h1>
        </div>

        <Card className="card-institutional">
          <CardHeader>
            <CardTitle className="heading-secondary">Información del Quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FieldGroup label="Título" htmlFor="quiz-title">
                <Input
                  id="quiz-title"
                  placeholder="Ej: Fuerzas entre cargas puntuales"
                  value={quizData.title}
                  onChange={(e) =>
                    setQuizData({ ...quizData, title: e.target.value })
                  }
                  className="input-institutional"
                />
              </FieldGroup>

              <FieldGroup label="Estado" htmlFor="quiz-estado">
                <Select
                  value={quizData.estado}
                  onValueChange={(v) =>
                    setQuizData({ ...quizData, estado: v as EstadoQuiz })
                  }
                >
                  <SelectTrigger id="quiz-estado" className="input-institutional">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={EstadoQuiz.BORRADOR}>Borrador</SelectItem>
                    <SelectItem value={EstadoQuiz.PUBLICADO}>Publicado</SelectItem>
                  </SelectContent>
                </Select>
              </FieldGroup>
            </div>

            <FieldGroup
              label="Descripción"
              htmlFor="quiz-description"
              hint="Opcional. Contexto o instrucciones para el estudiante."
            >
              <Textarea
                id="quiz-description"
                placeholder="Describe el objetivo del quiz..."
                value={quizData.description}
                onChange={(e) =>
                  setQuizData({ ...quizData, description: e.target.value })
                }
                rows={3}
              />
            </FieldGroup>

            <Button
              className="btn-primary"
              onClick={handleSaveQuiz}
              disabled={isSavingQuiz || !hasQuizChanges()}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSavingQuiz
                ? "Guardando..."
                : quizSaved
                  ? "Actualizar Quiz"
                  : "Guardar Quiz"}
            </Button>

            {!savedQuizId && (
              <p className="caption">
                Guarda el quiz antes de agregar preguntas.
              </p>
            )}
          </CardContent>
        </Card>

        {savedQuizId && (
          <Card className="card-institutional">
            <CardHeader>
              <CardTitle className="heading-secondary">Preguntas guardadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {questions.length === 0 ? (
                <p className="text-muted-foreground">Aún no hay preguntas.</p>
              ) : (
                questions.map((q, index) => (
                  <div
                    key={q.id}
                    className="p-4 border border-border rounded-lg flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <Badge className="badge-primary">
                          {QUESTION_TYPE_LABELS[q.questionType]}
                        </Badge>
                        <Badge variant="secondary">{q.points} pts</Badge>
                        <Badge variant="outline">{q.timeLimit}s</Badge>
                        {q.tema ? (
                          <Badge variant="outline">{q.tema}</Badge>
                        ) : null}
                        {!q.activa ? (
                          <Badge variant="destructive">Inactiva</Badge>
                        ) : null}
                      </div>
                      <p className="text-sm sm:text-base whitespace-pre-wrap wrap-break-word">
                        {q.question}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => editQuestion(q)}>
                        <Edit className="h-4 w-4 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteQuestion(q.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        <Card className="card-institutional">
          <CardHeader>
            <CardTitle className="heading-secondary">
              {selectedQuestionId ? "Editar pregunta" : "Agregar pregunta"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {!savedQuizId ? (
              <p className="body-small text-muted-foreground">
                Guarda el quiz para habilitar el formulario de preguntas.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FieldGroup label="Tipo de pregunta">
                    <Select
                      value={questionType}
                      onValueChange={(v) =>
                        handleQuestionTypeChange(v as QuestionTypeUi)
                      }
                    >
                      <SelectTrigger className="input-institutional">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="multiple-choice">
                          Opción múltiple
                        </SelectItem>
                        <SelectItem value="true-false">
                          Verdadero / Falso
                        </SelectItem>
                        <SelectItem value="numerical">
                          Numérica (con unidad)
                        </SelectItem>
                        <SelectItem value="exact-text">
                          Respuesta exacta (palabra o número)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldGroup>

                  <FieldGroup
                    label="Tema / subtema"
                    htmlFor="question-tema"
                    hint="Opcional. Ej: Campo eléctrico, Coulomb."
                  >
                    <Input
                      id="question-tema"
                      value={questionForm.tema}
                      onChange={(e) => updateQuestionForm({ tema: e.target.value })}
                      placeholder="Clasificación del contenido"
                      className="input-institutional"
                    />
                  </FieldGroup>
                </div>

                <FieldGroup label="Texto de la pregunta" htmlFor="question-text">
                  <Textarea
                    id="question-text"
                    placeholder="Escribe la pregunta..."
                    value={questionForm.question}
                    onChange={(e) =>
                      updateQuestionForm({ question: e.target.value })
                    }
                    rows={4}
                  />
                </FieldGroup>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FieldGroup label="Tiempo límite" htmlFor="question-time">
                    <Select
                      value={questionForm.timeLimit}
                      onValueChange={(v) => updateQuestionForm({ timeLimit: v })}
                    >
                      <SelectTrigger id="question-time" className="input-institutional">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_OPTIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t} seg</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldGroup>

                  <FieldGroup label="Puntos" htmlFor="question-points">
                    <Select
                      value={questionForm.points}
                      onValueChange={(v) => updateQuestionForm({ points: v })}
                    >
                      <SelectTrigger id="question-points" className="input-institutional">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POINTS_OPTIONS.map((p) => (
                          <SelectItem key={p} value={p}>{p} pts</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldGroup>

                  <FieldGroup label="Estado de la pregunta">
                    <Select
                      value={questionForm.activa ? "activa" : "inactiva"}
                      onValueChange={(v) =>
                        updateQuestionForm({ activa: v === "activa" })
                      }
                    >
                      <SelectTrigger className="input-institutional">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activa">Activa</SelectItem>
                        <SelectItem value="inactiva">Inactiva</SelectItem>
                      </SelectContent>
                    </Select>
                  </FieldGroup>

                  {questionType === "multiple-choice" && (
                    <FieldGroup label="Respuestas múltiples">
                      <Select
                        value={questionForm.permiteMultiples ? "si" : "no"}
                        onValueChange={(v) =>
                          updateQuestionForm({ permiteMultiples: v === "si" })
                        }
                      >
                        <SelectTrigger className="input-institutional">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">Una sola correcta</SelectItem>
                          <SelectItem value="si">Varias correctas</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldGroup>
                  )}
                </div>

                <FieldGroup
                  label="Explicación"
                  htmlFor="question-explanation"
                  hint="Opcional. Se muestra tras responder."
                >
                  <Textarea
                    id="question-explanation"
                    placeholder="Explica la respuesta correcta..."
                    value={questionForm.explanation}
                    onChange={(e) =>
                      updateQuestionForm({ explanation: e.target.value })
                    }
                    rows={3}
                  />
                </FieldGroup>

                {questionType === "numerical" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-border rounded-lg bg-muted/30">
                    <FieldGroup label="Valor correcto" htmlFor="numerical-value">
                      <Input
                        id="numerical-value"
                        type="text"
                        inputMode="decimal"
                        placeholder="Ej: -144.25, 0.001"
                        className="input-institutional font-mono hide-number-arrows"
                        value={numericalInput}
                        onChange={(e) => handleNumericalInput(e.target.value)}
                      />
                    </FieldGroup>
                    <FieldGroup label="Unidad" htmlFor="numerical-unit">
                      <Select
                        value={numericalUnit}
                        onValueChange={setNumericalUnit}
                      >
                        <SelectTrigger id="numerical-unit" className="input-institutional">
                          <SelectValue placeholder="Seleccionar unidad" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="N">Newton (N)</SelectItem>
                          <SelectItem value="C">Coulomb (C)</SelectItem>
                          <SelectItem value="V">Voltio (V)</SelectItem>
                          <SelectItem value="m">Metro (m)</SelectItem>
                          <SelectItem value="J">Joule (J)</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </FieldGroup>
                  </div>
                )}

                {questionType === "exact-text" && (
                  <div className="p-4 border border-border rounded-lg bg-muted/30">
                    <FieldGroup
                      label="Respuesta correcta"
                      htmlFor="exact-answer"
                      hint="Una sola respuesta válida. Ej: Rojo, 8, Programación Orientada a Objetos."
                    >
                      <Input
                        id="exact-answer"
                        value={exactAnswerText}
                        onChange={(e) => setExactAnswerText(e.target.value)}
                        placeholder="Ej: Rojo"
                        className="input-institutional"
                      />
                    </FieldGroup>
                  </div>
                )}

                {questionType === "multiple-choice" && (
                  <div className="space-y-3">
                    <Label>
                      Opciones de respuesta
                      {questionForm.permiteMultiples
                        ? " (marca todas las correctas)"
                        : " (marca una correcta)"}
                    </Label>
                    {questionForm.permiteMultiples ? (
                      <div className="space-y-3">
                        {answers.map((a, i) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-3 border p-3 rounded-lg"
                          >
                            <input
                              type="checkbox"
                              checked={a.isCorrect}
                              onChange={() => toggleCorrectAnswer(a.id)}
                              className="h-5 w-5 accent-primary"
                              aria-label={`Marcar opción ${i + 1} como correcta`}
                            />
                            <Input
                              value={a.text}
                              onChange={(e) => updateAnswer(a.id, e.target.value)}
                              placeholder={`Opción ${i + 1}`}
                              className="flex-1 input-institutional"
                            />
                            {answers.length > 2 && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removeAnswer(a.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <RadioGroup
                        value={answers.find((a) => a.isCorrect)?.id ?? ""}
                        onValueChange={toggleCorrectAnswer}
                      >
                        {answers.map((a, i) => (
                          <div
                            key={a.id}
                            className="flex items-center gap-3 border p-3 rounded-lg"
                          >
                            <RadioGroupItem
                              value={a.id}
                              className="w-5 h-5 border-2 border-primary"
                            />
                            <Input
                              value={a.text}
                              onChange={(e) => updateAnswer(a.id, e.target.value)}
                              placeholder={`Opción ${i + 1}`}
                              className="flex-1 input-institutional"
                            />
                            {answers.length > 2 && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => removeAnswer(a.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </RadioGroup>
                    )}
                    <Button size="sm" variant="outline" onClick={addAnswer}>
                      <Plus className="mr-1 h-4 w-4" /> Agregar opción
                    </Button>
                  </div>
                )}

                {questionType === "true-false" && (
                  <div className="space-y-2">
                    <Label>Respuesta correcta</Label>
                    <RadioGroup
                      value={answers.find((a) => a.isCorrect)?.id ?? ""}
                      onValueChange={toggleCorrectAnswer}
                    >
                      {answers.map((a) => (
                        <div
                          key={a.id}
                          className="flex gap-3 items-center border p-3 rounded-lg"
                        >
                          <RadioGroupItem
                            value={a.id}
                            className="w-5 h-5 border-2 border-primary"
                          />
                          <span className="text-base font-medium">{a.text}</span>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    className="btn-primary"
                    onClick={handleSaveQuestion}
                    disabled={
                      isSavingQuestion ||
                      !hasQuestionChanges() ||
                      !canSaveQuestion
                    }
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isSavingQuestion
                      ? "Guardando..."
                      : selectedQuestionId
                        ? "Actualizar pregunta"
                        : "Guardar pregunta"}
                  </Button>

                  {selectedQuestionId && (
                    <Button variant="outline" onClick={resetQuestionForm}>
                      <X className="mr-2 h-4 w-4" /> Cancelar
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
