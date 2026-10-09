import {
  TipoPregunta,
  type CrearPregunta,
  type Pregunta,
  type ActualizarPregunta,
} from "@/app/types";
import { normalizarTexto } from "@/lib/similitud-texto";
import { urlPublicaImagenReferencia } from "@/lib/recursos-quiz-url";

/** Tipos en el formulario docente (no son el `tipo` de Mongo). */
export type QuestionTypeUi =
  | "multiple-choice"
  | "true-false"
  | "numerical"
  | "exact-text"
  | "open-text";

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
  imageUrl?: string;
  imagenReferencia?: string;
  revisadaPorDocente?: boolean;
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
  const imagenReferencia = (p as Pregunta & { imagenReferencia?: string })
    .imagenReferencia;
  const revisadaPorDocente = Boolean(
    (p as Pregunta & { revisadaPorDocente?: boolean }).revisadaPorDocente
  );
  const base = {
    id: p.id,
    quizId: p.quizId,
    question: p.texto,
    explanation: p.explicacion ?? "",
    points: p.puntos,
    timeLimit: p.tiempoLimite,
    activa: p.activa,
    tema: topic,
    imageUrl: urlPublicaImagenReferencia(imagenReferencia),
    imagenReferencia,
    revisadaPorDocente,
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

  if (p.requiereCorreccionManual || (p.criteriosEvaluacion && p.criteriosEvaluacion.trim())) {
    const legacyAnswer =
      String(
        Array.isArray(p.respuestaCorrecta)
          ? p.respuestaCorrecta[0]
          : p.respuestaCorrecta ?? ""
      ).trim() || (p.criteriosEvaluacion ?? "").trim();
    return {
      ...base,
      questionType: "exact-text",
      exactAnswerText: legacyAnswer,
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

    case "open-text":
      return {
        ...base,
        tipo: TipoPregunta.RESPUESTA_CORTA,
        respuestaCorrecta: q.exactAnswerText?.trim() ?? "",
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

/** Compara la respuesta del estudiante con la pregunta en UI. */
export function verificarRespuestaUi(
  q: QuestionUi,
  respuestaEstudiante: string
): boolean {
  return evaluarRespuestaUi(q, respuestaEstudiante).correct;
}

export function evaluarRespuestaUi(
  q: QuestionUi,
  respuestaEstudiante: string
): { correct: boolean; similitud?: number } {
  if (q.questionType === "numerical") {
    const student = parseFloat(respuestaEstudiante.replace(",", "."));
    const correct = q.correctValue ?? 0;
    if (Number.isNaN(student)) return { correct: false };
    return { correct: student === correct };
  }

  if (q.questionType === "exact-text" || q.questionType === "open-text") {
    const student = normalizarTexto(respuestaEstudiante);
    const correct = normalizarTexto((q.exactAnswerText ?? "").trim());
    if (!correct) return { correct: false };
    return { correct: student === correct };
  }

  if (q.questionType === "true-false") {
    const esTrue =
      respuestaEstudiante === "true" || respuestaEstudiante === "Verdadero";
    return { correct: q.correctOption === (esTrue ? "true" : "false") };
  }

  if (q.questionType === "multiple-choice") {
    if (q.permiteMultiples) {
      const elegidas = respuestaEstudiante
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .sort();
      const correctas = (q.options ?? [])
        .filter((o) => o.isCorrect)
        .map((o) => o.id)
        .sort();
      return {
        correct:
          elegidas.length === correctas.length &&
          elegidas.every((id, i) => id === correctas[i]),
      };
    }
    if (q.correctOption === respuestaEstudiante) {
      return { correct: true };
    }
    const opcionCorrecta = (q.options ?? []).find((o) => o.isCorrect);
    if (opcionCorrecta) {
      const studentNorm = respuestaEstudiante.trim().toLowerCase();
      const textNorm = opcionCorrecta.text.trim().toLowerCase();
      if (studentNorm === textNorm) return { correct: true };
    }
    return { correct: false };
  }

  return { correct: false };
}

export const QUESTION_TYPE_LABELS: Record<QuestionTypeUi, string> = {
  "multiple-choice": "Opción múltiple",
  "true-false": "Verdadero / Falso",
  numerical: "Respuesta corta",
  "exact-text": "Respuesta corta",
  "open-text": "Respuesta corta",
};

/** Etiqueta corta para la pantalla de juego del estudiante. */
export function etiquetaTipoPreguntaPlay(
  q: Pick<QuestionUi, "questionType" | "permiteMultiples">
): string {
  switch (q.questionType) {
    case "true-false":
      return "Falso/verdadero";
    case "multiple-choice":
      return q.permiteMultiples ? "Opción múltiple" : "Opción única";
    case "numerical":
    case "exact-text":
    case "open-text":
      return "Respuesta corta";
    default:
      return "Pregunta";
  }
}
