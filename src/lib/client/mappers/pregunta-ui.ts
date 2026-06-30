import {
  TipoPregunta,
  type CrearPregunta,
  type Pregunta,
  type ActualizarPregunta,
} from "@/app/types";

/** Tipos en el formulario docente (no son el `tipo` de Mongo). */
export type QuestionTypeUi =
  | "multiple-choice"
  | "true-false"
  | "numerical"
  | "exact-text";

export interface AnswerUi {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionUi {
  id: string;
  quizId?: string;
  question: string;
  explanation: string;
  questionType: QuestionTypeUi;
  points: number;
  timeLimit: number;
  activa: boolean;
  tema?: string;
  permiteMultiples?: boolean;
  /** Respuesta exacta (palabra, frase o número sin unidad física). */
  exactAnswerText?: string;
  options?: AnswerUi[];
  correctOption?: string;
  correctValue?: number;
  unit?: string;
}

const UNIT_PREFIX = "unit:";
/** Valor legacy guardado en Mongo antes de corregir el enum. */
const TIPO_RESPUESTA_CORTA_LEGACY = "numerical";

export function esTipoRespuestaCorta(tipo: string): boolean {
  return tipo === TipoPregunta.RESPUESTA_CORTA || tipo === TIPO_RESPUESTA_CORTA_LEGACY;
}

export function decodeTema(tema?: string): { topic?: string; unit?: string } {
  if (!tema?.trim()) return {};

  const parts = tema.split("|");
  let topic: string | undefined;
  let unit: string | undefined;

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(UNIT_PREFIX)) {
      unit = trimmed.slice(UNIT_PREFIX.length);
    } else if (trimmed.startsWith("topic:")) {
      topic = trimmed.slice(6);
    } else if (!trimmed.includes(":")) {
      topic = trimmed;
    }
  }

  return { topic, unit };
}

export function encodeTema(topic?: string, unit?: string): string | undefined {
  const parts: string[] = [];
  const cleanTopic = topic?.trim();
  if (cleanTopic) parts.push(`topic:${cleanTopic}`);
  if (unit) parts.push(`${UNIT_PREFIX}${unit}`);
  if (parts.length === 0) return undefined;
  return parts.join("|");
}

export function preguntaApiToUi(p: Pregunta): QuestionUi {
  const { topic, unit } = decodeTema(p.tema);
  const base = {
    id: p.id,
    quizId: p.quizId,
    question: p.texto,
    explanation: p.explicacion ?? "",
    points: p.puntos,
    timeLimit: p.tiempoLimite,
    activa: p.activa,
    tema: topic,
  };

  if (p.tipo === TipoPregunta.MULTIPLE_OPCION) {
    const correctIndices = Array.isArray(p.respuestaCorrecta)
      ? p.respuestaCorrecta
      : [p.respuestaCorrecta];
    const firstCorrect = correctIndices[0] ?? 0;
    return {
      ...base,
      questionType: "multiple-choice",
      permiteMultiples: p.permiteMultiples,
      options: p.opciones.map((text, i) => ({
        id: String(i),
        text,
        isCorrect: correctIndices.includes(i),
      })),
      correctOption: String(firstCorrect),
    };
  }

  if (p.tipo === TipoPregunta.VERDADERO_FALSO) {
    return {
      ...base,
      questionType: "true-false",
      options: [
        { id: "true", text: "Verdadero", isCorrect: p.respuestaCorrecta === true },
        { id: "false", text: "Falso", isCorrect: p.respuestaCorrecta === false },
      ],
      correctOption: p.respuestaCorrecta ? "true" : "false",
    };
  }

  if (esTipoRespuestaCorta(p.tipo)) {
    const raw =
      Array.isArray(p.respuestaCorrecta)
        ? p.respuestaCorrecta[0]
        : p.respuestaCorrecta;

    if (unit) {
      const numeric = parseFloat(raw);
      return {
        ...base,
        questionType: "numerical",
        correctValue: Number.isNaN(numeric) ? 0 : numeric,
        unit,
      };
    }

    return {
      ...base,
      questionType: "exact-text",
      exactAnswerText: raw,
    };
  }

  return { ...base, questionType: "multiple-choice", activa: p.activa };
}

export function preguntaUiToCrear(
  q: QuestionUi,
  quizId: string,
  answers: AnswerUi[],
  numerical?: { value: number; unit: string }
): CrearPregunta {
  const base = {
    quizId,
    texto: q.question,
    explicacion: q.explanation || undefined,
    puntos: q.points,
    tiempoLimite: q.timeLimit,
    activa: q.activa,
  };

  switch (q.questionType) {
    case "multiple-choice":
      const opciones = answers.map((a) => a.text);
      const correctIndices = answers
        .map((a, i) => (a.isCorrect ? i : -1))
        .filter((i) => i >= 0);
      const permiteMultiples = q.permiteMultiples ?? false;
      const respuestaCorrecta = permiteMultiples
        ? correctIndices
        : correctIndices[0] ?? 0;
      return {
        ...base,
        tipo: TipoPregunta.MULTIPLE_OPCION,
        opciones,
        respuestaCorrecta,
        permiteMultiples,
        tema: q.tema?.trim() ? encodeTema(q.tema) : undefined,
      };

    case "true-false":
      const correct = answers.find((a) => a.isCorrect)?.id === "true";
      return {
        ...base,
        tipo: TipoPregunta.VERDADERO_FALSO,
        opciones: ["Verdadero", "Falso"],
        respuestaCorrecta: correct,
        tema: q.tema?.trim() ? encodeTema(q.tema) : undefined,
      };

    case "numerical":
      const value = numerical?.value ?? q.correctValue ?? 0;
      const unit = numerical?.unit ?? q.unit ?? "";
      return {
        ...base,
        tipo: TipoPregunta.RESPUESTA_CORTA,
        respuestaCorrecta: String(value),
        tema: encodeTema(q.tema, unit),
        caseSensitive: false,
      };

    case "exact-text":
      const textoExacto = q.exactAnswerText?.trim() ?? "";
      return {
        ...base,
        tipo: TipoPregunta.RESPUESTA_CORTA,
        respuestaCorrecta: textoExacto,
        tema: q.tema?.trim() ? encodeTema(q.tema) : undefined,
        caseSensitive: false,
      };

    default:
      return {
        ...base,
        tipo: TipoPregunta.MULTIPLE_OPCION,
        opciones: [],
        respuestaCorrecta: 0,
        permiteMultiples: false,
      };
  }
}

export function preguntaUiToActualizar(
  q: QuestionUi,
  answers: AnswerUi[],
  numerical?: { value: number; unit: string }
): ActualizarPregunta {
  return preguntaUiToCrear(
    { ...q, quizId: q.quizId ?? "" },
    q.quizId ?? "",
    answers,
    numerical
  );
}

/** Compara la respuesta del estudiante con la pregunta en UI (Kahoot: una sola respuesta correcta). */
export function verificarRespuestaUi(
  q: QuestionUi,
  respuestaEstudiante: string
): boolean {
  if (q.questionType === "numerical") {
    const student = parseFloat(respuestaEstudiante.replace(",", "."));
    const correct = q.correctValue ?? 0;
    if (Number.isNaN(student)) return false;
    return student === correct;
  }

  if (q.questionType === "exact-text") {
    const student = respuestaEstudiante.trim();
    const correct = (q.exactAnswerText ?? "").trim();
    return student.toLowerCase() === correct.toLowerCase();
  }

  if (q.questionType === "true-false") {
    const esTrue =
      respuestaEstudiante === "true" || respuestaEstudiante === "Verdadero";
    return q.correctOption === (esTrue ? "true" : "false");
  }

  if (q.questionType === "multiple-choice") {
    return q.correctOption === respuestaEstudiante;
  }

  return false;
}

export const QUESTION_TYPE_LABELS: Record<QuestionTypeUi, string> = {
  "multiple-choice": "Opción múltiple",
  "true-false": "Verdadero / Falso",
  numerical: "Numérica (con unidad)",
  "exact-text": "Respuesta exacta",
};
