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
import { ArrowLeft, Save, Plus, Trash2, Edit, X, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { EstadoQuiz, etiquetaEstadoQuiz } from "@/app/types";
import { obtenerUsuarioActual } from "@/lib/client/auth";
import {
  obtenerQuiz,
  actualizarQuiz,
  verificarQuizDocente,
  extraerErroresVerificacionQuiz,
  type ErrorVerificacionQuiz,
} from "@/lib/client/services/quizzes";
import { ApiError } from "@/lib/client/api";
import { OrigenGeneracion } from "@/app/types/quiz-ia";
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
  preguntaApiToUi,
  preguntaUiToCrear,
  preguntaUiToActualizar,
  etiquetaTipoPreguntaPlay,
} from "@/lib/client/mappers/pregunta-ui";
import {
  type QuizFormState,
  type QuestionFormState,
  DEFAULT_QUESTION_FORM,
  TIME_OPTIONS,
  POINTS_OPTIONS,
  FieldGroup,
  answersEqual,
  buildCanSaveQuestion,
  textareaFormularioSolido,
  inputFormularioSolido,
} from "@/app/teacher/_components/quiz-form-shared";
import { ImagenPreguntaField } from "@/app/teacher/_components/imagen-pregunta-field";

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.id as string;

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

  const [questions, setQuestions] = useState<QuestionUi[]>([]);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [questionType, setQuestionType] = useState<QuestionTypeUi>("multiple-choice");
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [loading, setLoading] = useState(true);
  const seccionEditarRef = useRef<HTMLDivElement>(null);

  const [questionForm, setQuestionForm] = useState<QuestionFormState>(DEFAULT_QUESTION_FORM);
  const [originalQuestionForm, setOriginalQuestionForm] =
    useState<QuestionFormState>(DEFAULT_QUESTION_FORM);
  const [originalQuestionType, setOriginalQuestionType] =
    useState<QuestionTypeUi>("multiple-choice");

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
  const [questionImagenRef, setQuestionImagenRef] = useState<string | undefined>();
  const [esQuizIa, setEsQuizIa] = useState(false);
  const [verificandoQuiz, setVerificandoQuiz] = useState(false);
  const [erroresVerificacion, setErroresVerificacion] = useState<
    ErrorVerificacionQuiz[]
  >([]);

  const recargarPreguntas = async () => {
    const data = await listarPreguntas(quizId, { incluirInactivas: true });
    setQuestions(data.map(preguntaApiToUi));
  };

  useEffect(() => {
    if (!quizId) {
      setLoading(false);
      return;
    }

    const cargar = async () => {
      try {
        const quiz = await obtenerQuiz(quizId);
        const initialQuiz: QuizFormState = {
          title: quiz.titulo || "",
          description: quiz.descripcion || "",
          estado: quiz.estado || EstadoQuiz.BORRADOR,
        };
        setQuizData(initialQuiz);
        setOriginalQuizData(initialQuiz);
        setEsQuizIa(
          quiz.origenGeneracion === OrigenGeneracion.IA || Boolean(quiz.guiaId)
        );
        await recargarPreguntas();
      } catch {
        router.push("/teacher");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, [quizId, router]);

  useEffect(() => {
    if (!selectedQuestionId) return;
    seccionEditarRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [selectedQuestionId]);

  const hasQuizChanges = () =>
    quizData.title !== originalQuizData.title ||
    quizData.description !== originalQuizData.description ||
    quizData.estado !== originalQuizData.estado;

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
    if (questionType === "exact-text" || questionType === "open-text") {
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

  const opcionesPreviewImagen = useMemo(() => {
    if (questionType === "true-false") return ["Verdadero", "Falso"];
    if (questionType === "multiple-choice") {
      const texts = answers.map((a) => a.text.trim()).filter(Boolean);
      return texts.length > 0 ? texts : undefined;
    }
    return undefined;
  }, [questionType, answers]);

  const etiquetaTipoImagen = useMemo(
    () =>
      etiquetaTipoPreguntaPlay({
        questionType,
        permiteMultiples: questionForm.permiteMultiples,
      }),
    [questionType, questionForm.permiteMultiples]
  );

  const preguntasActivas = useMemo(
    () => questions.filter((q) => q.activa),
    [questions]
  );

  const preguntasRevisadasCount = useMemo(
    () => preguntasActivas.filter((q) => q.revisadaPorDocente).length,
    [preguntasActivas]
  );

  const todasRevisadasIa =
    esQuizIa &&
    preguntasActivas.length > 0 &&
    preguntasActivas.every((q) => q.revisadaPorDocente);

  const puntosSelectOptions = useMemo(() => {
    const base = [...POINTS_OPTIONS];
    const actual = questionForm.points.trim();
    if (actual && !base.includes(actual)) {
      base.push(actual);
    }
    return base.sort((a, b) => Number(a) - Number(b));
  }, [questionForm.points]);

  const puedeGuardarPreguntaActual =
    canSaveQuestion &&
    (hasQuestionChanges() ||
      (esQuizIa && Boolean(selectedQuestionId)));

  async function handleSaveQuiz() {
    if (!(await obtenerUsuarioActual())) {
      toast.error("Debes iniciar sesión.");
      return;
    }
    if (!quizData.title.trim()) {
      toast.warning("El título es obligatorio.");
      return;
    }

    setIsSavingQuiz(true);
    try {
      await actualizarQuiz(quizId, {
        titulo: quizData.title,
        descripcion: quizData.description,
        estado: quizData.estado,
      });
      toast.success("Quiz actualizado correctamente.");
      setOriginalQuizData(quizData);
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar el quiz.");
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
    } else if (type === "exact-text" || type === "open-text") {
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
      quizId,
      question: questionForm.question,
      explanation: questionForm.explanation,
      questionType,
      points: Number(questionForm.points),
      timeLimit: Number(questionForm.timeLimit),
      activa: questionForm.activa,
      tema: questionForm.tema.trim() || undefined,
      permiteMultiples: questionForm.permiteMultiples,
      exactAnswerText:
        questionType === "exact-text" || questionType === "open-text"
          ? exactAnswerText.trim()
          : undefined,
    };
  }

  async function persistCurrentQuestion(options?: {
    resetAfterSave?: boolean;
    showSuccessToast?: boolean;
  }): Promise<boolean> {
    const { resetAfterSave = false, showSuccessToast = true } = options ?? {};

    if (!(await obtenerUsuarioActual())) {
      toast.error("Debes iniciar sesión.");
      return false;
    }

    if (!questionForm.question.trim()) {
      toast.warning("La pregunta es obligatoria.");
      return false;
    }

    if (questionType === "multiple-choice") {
      if (answers.some((a) => !a.text.trim())) {
        toast.warning("Todas las opciones deben tener texto.");
        return false;
      }
      const correctCount = answers.filter((a) => a.isCorrect).length;
      if (correctCount === 0) {
        toast.warning("Marca al menos una opción correcta.");
        return false;
      }
      if (!questionForm.permiteMultiples && correctCount > 1) {
        toast.warning("Solo una opción puede ser correcta.");
        return false;
      }
    }

    if (questionType === "numerical") {
      if (!numericalInput.trim()) {
        toast.warning("La respuesta correcta es obligatoria.");
        return false;
      }
    }

    if (
      (questionType === "exact-text" || questionType === "open-text") &&
      !exactAnswerText.trim()
    ) {
      toast.warning("La respuesta correcta es obligatoria.");
      return false;
    }

    const puntos = Number(questionForm.points);
    if (!Number.isFinite(puntos) || puntos <= 0) {
      toast.warning("Los puntos son obligatorios (elige un valor mayor a 0).");
      return false;
    }

    setIsSavingQuestion(true);

    try {
      const questionUi = buildQuestionUi();
      const numerical =
        questionType === "numerical"
          ? { value: parseFloat(numericalInput), unit: numericalUnit }
          : undefined;

      if (selectedQuestionId) {
        const preguntaIdGuardada = selectedQuestionId;
        const payload = preguntaUiToActualizar(questionUi, answers, numerical);
        await actualizarPregunta(preguntaIdGuardada, {
          ...payload,
          ...(esQuizIa ? { confirmarRevisionDocente: true } : {}),
        });
        if (showSuccessToast) {
          toast.success(
            esQuizIa
              ? "Pregunta actualizada y marcada como revisada."
              : "Pregunta actualizada."
          );
        }
        await recargarPreguntas();
        if (esQuizIa) {
          setQuestions((prev) =>
            prev.map((q) =>
              q.id === preguntaIdGuardada
                ? { ...q, revisadaPorDocente: true }
                : q
            )
          );
        }
        if (resetAfterSave) {
          resetQuestionForm();
        } else {
          snapshotQuestionState();
        }
      } else {
        const creada = await crearPregunta(
          preguntaUiToCrear(questionUi, quizId, answers, numerical)
        );
        setSelectedQuestionId(creada.id);
        setQuestionImagenRef(
          (creada as { imagenReferencia?: string }).imagenReferencia
        );
        if (showSuccessToast) {
          toast.success("Pregunta agregada. Ya puedes subir una imagen opcional.");
        }
        await recargarPreguntas();
        if (resetAfterSave) {
          resetQuestionForm();
        } else {
          snapshotQuestionState();
        }
      }
      return true;
    } catch (err) {
      console.error("Error al guardar la pregunta:", err);
      toast.error("Error al guardar la pregunta.");
      return false;
    } finally {
      setIsSavingQuestion(false);
    }
  }

  async function handleSaveQuestion() {
    await persistCurrentQuestion({ resetAfterSave: true, showSuccessToast: true });
  }

  async function handleVerificarQuiz() {
    if (!(await obtenerUsuarioActual())) {
      toast.error("Debes iniciar sesión.");
      return;
    }

    setErroresVerificacion([]);

    if (hasQuestionChanges()) {
      if (!canSaveQuestion) {
        toast.warning(
          "Guarda o corrige la pregunta abierta antes de verificar el quiz."
        );
        return;
      }
      const guardado = await persistCurrentQuestion({
        resetAfterSave: false,
        showSuccessToast: false,
      });
      if (!guardado) return;
      toast.success("Pregunta guardada.");
    }

    setVerificandoQuiz(true);
    try {
      const resultado = await verificarQuizDocente(quizId);
      const listo = EstadoQuiz.PUBLICADO;
      setQuizData((prev) => ({ ...prev, estado: listo }));
      setOriginalQuizData((prev) => ({ ...prev, estado: listo }));
      toast.success(
        `Quiz verificado (${resultado.preguntasValidadas} preguntas). Estado: Listo.`
      );
    } catch (error) {
      const errores = extraerErroresVerificacionQuiz(error);
      if (errores?.length) {
        setErroresVerificacion(errores);
        toast.error("Hay preguntas con respuestas inválidas. Revisa la lista.");
      } else {
        const mensaje =
          error instanceof ApiError ? error.message : "No se pudo verificar el quiz.";
        toast.error(mensaje);
      }
    } finally {
      setVerificandoQuiz(false);
    }
  }

  function irAPreguntaVerificacion(preguntaId: string) {
    const q = questions.find((item) => item.id === preguntaId);
    if (q) editQuestion(q);
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm("¿Eliminar pregunta?")) return;
    try {
      await eliminarPregunta(id);
      await recargarPreguntas();
      toast.success("Pregunta eliminada.");
      if (selectedQuestionId === id) resetQuestionForm();
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
    setQuestionImagenRef(q.imagenReferencia);
    setQuestionType(q.questionType);
    const numero = questions.findIndex((item) => item.id === q.id) + 1;
    toast.info(numero > 0 ? `Editando pregunta ${numero}` : "Editando pregunta");

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
      setQuestionType("exact-text");
      setExactAnswerText(
        q.correctValue !== undefined ? String(q.correctValue) : ""
      );
      setNumericalInput("");
      setNumericalUnit("");
      setAnswers([
        { id: "1", text: "", isCorrect: false },
        { id: "2", text: "", isCorrect: false },
      ]);
    } else if (
      q.questionType === "exact-text" ||
      q.questionType === "open-text"
    ) {
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
        isCorrect: q.permiteMultiples ? opt.isCorrect : opt.id === correctId,
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
    setQuestionImagenRef(undefined);
  }

  const toggleCorrectAnswer = (id: string) => {
    if (questionType === "multiple-choice" && questionForm.permiteMultiples) {
      setAnswers(
        answers.map((a) =>
          a.id === id ? { ...a, isCorrect: !a.isCorrect } : a
        )
      );
    } else {
      setAnswers(answers.map((a) => ({ ...a, isCorrect: a.id === id })));
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

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center min-h-screen min-h-[100dvh]">
        <div className="text-center">
          <div className="loading-spinner" />
          <p className="body-text text-muted-foreground mt-4">Cargando quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Navigation />
      <main className="page-main space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 min-w-0">
          <Link href="/teacher">
            <Button variant="outline" size="sm" className="border-primary text-primary min-h-11">
              <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>
          </Link>
          <h1 className="heading-primary">Editar Quiz</h1>
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
                  className={`input-institutional ${inputFormularioSolido}`}
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
                    <SelectItem value={EstadoQuiz.PUBLICADO}>
                      {etiquetaEstadoQuiz(EstadoQuiz.PUBLICADO)}
                    </SelectItem>
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
                className={textareaFormularioSolido}
              />
            </FieldGroup>

            <Button
              className="btn-primary"
              onClick={handleSaveQuiz}
              disabled={isSavingQuiz || !hasQuizChanges()}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSavingQuiz ? "Actualizando..." : "Actualizar Quiz"}
            </Button>
          </CardContent>
        </Card>

        <Card className="card-institutional border-primary/15">
          <CardHeader>
            <CardTitle className="heading-secondary text-base">
              Publicación segura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {esQuizIa
                ? "Abre cada pregunta activa y pulsa Actualizar pregunta. Cuando todas estén revisadas, podrás marcar el quiz como Listo."
                : "Valida que todas las preguntas activas tengan respuestas correctas guardadas en la base de datos y marca el quiz como Listo."}
            </p>
            {esQuizIa && quizData.estado !== EstadoQuiz.PUBLICADO ? (
              <p className="text-sm font-medium">
                Progreso de revisión: {preguntasRevisadasCount} /{" "}
                {preguntasActivas.length} preguntas
              </p>
            ) : null}
            {quizData.estado === EstadoQuiz.PUBLICADO ? (
              <p className="text-sm text-primary font-medium">
                Este quiz ya está en Listo. Puedes iniciar la sesión desde el panel.
              </p>
            ) : (
              <Button
                type="button"
                className="btn-primary min-h-11"
                onClick={handleVerificarQuiz}
                disabled={
                  verificandoQuiz ||
                  isSavingQuestion ||
                  preguntasActivas.length === 0 ||
                  (esQuizIa && !todasRevisadasIa)
                }
                title={
                  esQuizIa && !todasRevisadasIa
                    ? "Debes actualizar cada pregunta activa antes de verificar"
                    : undefined
                }
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                {verificandoQuiz ? "Verificando..." : "Quiz verificado por mí"}
              </Button>
            )}
            {erroresVerificacion.length > 0 ? (
              <div
                className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-2"
                role="alert"
              >
                <p className="text-sm font-medium text-destructive">
                  Corrige estas preguntas y vuelve a verificar:
                </p>
                <ul className="space-y-2 text-sm">
                  {erroresVerificacion.map((err) => (
                    <li key={err.preguntaId} className="flex flex-col gap-1">
                      <span>
                        #{err.indice}: {err.mensaje}
                        {err.textoCorto ? ` — «${err.textoCorto}»` : ""}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="self-start"
                        onClick={() => irAPreguntaVerificacion(err.preguntaId)}
                      >
                        Editar pregunta #{err.indice}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>

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
                        {etiquetaTipoPreguntaPlay(q)}
                      </Badge>
                      <Badge variant="secondary">{q.points} pts</Badge>
                      <Badge variant="outline">{q.timeLimit}s</Badge>
                      {q.tema ? <Badge variant="outline">{q.tema}</Badge> : null}
                      {!q.activa ? (
                        <Badge variant="destructive">Inactiva</Badge>
                      ) : null}
                      {esQuizIa && q.activa ? (
                        <Badge
                          variant={
                            q.revisadaPorDocente ? "secondary" : "outline"
                          }
                        >
                          {q.revisadaPorDocente ? "Revisada" : "Pendiente"}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="text-sm sm:text-base whitespace-pre-wrap wrap-break-word">
                      {q.question}
                    </p>
                    {q.imageUrl ? (
                      <img
                        src={q.imageUrl}
                        alt=""
                        className="mt-2 max-h-20 rounded border border-border object-contain bg-white"
                      />
                    ) : null}
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

        <div
          id="seccion-editar-pregunta"
          ref={seccionEditarRef}
          className="scroll-mt-24"
        >
        <Card className="card-institutional">
          <CardHeader>
            <CardTitle className="heading-secondary">
              {selectedQuestionId ? "Editar pregunta" : "Agregar pregunta"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                    <SelectItem value="multiple-choice">Opción múltiple</SelectItem>
                    <SelectItem value="true-false">Verdadero / Falso</SelectItem>
                    <SelectItem value="exact-text">
                      Respuesta corta (palabra o número)
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
                  className={`input-institutional ${inputFormularioSolido}`}
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
                className={textareaFormularioSolido}
              />
            </FieldGroup>

            <ImagenPreguntaField
              preguntaId={selectedQuestionId}
              imagenReferencia={questionImagenRef}
              textoPregunta={questionForm.question}
              opcionesPreview={opcionesPreviewImagen}
              etiquetaTipo={etiquetaTipoImagen}
              onChange={(ref) => {
                setQuestionImagenRef(ref);
                recargarPreguntas().catch(() => {});
              }}
            />

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

              <FieldGroup
                label="Puntos"
                htmlFor="question-points"
                hint="Obligatorio. Revisa el valor en cada pregunta generada por IA."
              >
                <Select
                  value={questionForm.points}
                  onValueChange={(v) => updateQuestionForm({ points: v })}
                >
                  <SelectTrigger id="question-points" className="input-institutional">
                    <SelectValue placeholder="Elige puntos" />
                  </SelectTrigger>
                  <SelectContent>
                    {puntosSelectOptions.map((p) => (
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
                className={textareaFormularioSolido}
              />
            </FieldGroup>

            {questionType === "exact-text" && (
              <div className="p-4 border border-border rounded-lg bg-muted/30">
                <FieldGroup
                  label="Respuesta correcta"
                  htmlFor="exact-answer"
                  hint="Una palabra, número o código. No importan mayúsculas (ej. 5, Software , Derecho)."
                >
                  <Input
                    id="exact-answer"
                    value={exactAnswerText}
                    onChange={(e) => setExactAnswerText(e.target.value)}
                    placeholder="Ej: 5, Software, Derecho"
                    className={`input-institutional ${inputFormularioSolido}`}
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
                          className={`flex-1 input-institutional ${inputFormularioSolido}`}
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
                          className={`flex-1 input-institutional ${inputFormularioSolido}`}
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
                disabled={isSavingQuestion || !puedeGuardarPreguntaActual}
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
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
  );
}
