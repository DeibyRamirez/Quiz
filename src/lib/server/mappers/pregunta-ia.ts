import { TipoPregunta, type CrearPregunta } from "@/app/types/pregunta";
import type { PreguntaIa } from "@/app/types/quiz-ia";

const PUNTOS_DEFAULT = 1000;
const TIEMPO_DEFAULT = 30;

/** Convierte una pregunta del esquema IA al dominio Mongo existente. */
export function preguntaIaToCrearPregunta(
  pregunta: PreguntaIa,
  quizId: string
): CrearPregunta {
  const base = {
    quizId,
    texto: pregunta.question,
    explicacion: pregunta.explanation,
    puntos: PUNTOS_DEFAULT,
    tiempoLimite: TIEMPO_DEFAULT,
    activa: true,
  };

  switch (pregunta.type) {
    case "true_false":
      return {
        ...base,
        tipo: TipoPregunta.VERDADERO_FALSO,
        opciones: ["Verdadero", "Falso"],
        respuestaCorrecta: pregunta.answer,
      };

    case "single_choice":
      return {
        ...base,
        tipo: TipoPregunta.MULTIPLE_OPCION,
        opciones: [...pregunta.options],
        respuestaCorrecta: pregunta.correctIndex,
        permiteMultiples: false,
      };

    case "multi_choice":
      return {
        ...base,
        tipo: TipoPregunta.MULTIPLE_OPCION,
        opciones: [...pregunta.options],
        respuestaCorrecta: pregunta.answer,
        permiteMultiples: true,
      };

    case "open_text": {
      const expected = (
        pregunta.expectedAnswer ??
        pregunta.evaluationCriteria ??
        ""
      ).trim();
      return {
        ...base,
        tipo: TipoPregunta.RESPUESTA_CORTA,
        respuestaCorrecta: expected,
        caseSensitive: false,
      };
    }

    default: {
      const _exhaustive: never = pregunta;
      throw new Error(`Tipo de pregunta IA no soportado: ${(_exhaustive as PreguntaIa).type}`);
    }
  }
}

/** Convierte un array de preguntas IA a CrearPregunta[]. */
export function preguntasIaToCrearPreguntas(
  preguntas: PreguntaIa[],
  quizId: string
): CrearPregunta[] {
  return preguntas.map((p) => preguntaIaToCrearPregunta(p, quizId));
}

/** Serializa preguntas Mongo a formato compacto para el LLM en modo refine. */
export function preguntasToEstadoCompacto(
  preguntas: Array<{
    texto: string;
    tipo: string;
    opciones?: string[];
    respuestaCorrecta?: unknown;
    explicacion?: string;
    criteriosEvaluacion?: string;
    requiereCorreccionManual?: boolean;
    permiteMultiples?: boolean;
  }>
): PreguntaIa[] {
  return preguntas.map((p) => {
    if (p.tipo === TipoPregunta.VERDADERO_FALSO) {
      return {
        type: "true_false" as const,
        question: p.texto,
        answer: p.respuestaCorrecta as boolean,
        explanation: p.explicacion,
      };
    }

    if (p.tipo === TipoPregunta.MULTIPLE_OPCION) {
      const opciones = p.opciones ?? [];
      if (p.permiteMultiples) {
        return {
          type: "multi_choice" as const,
          question: p.texto,
          options: opciones,
          answer: Array.isArray(p.respuestaCorrecta)
            ? (p.respuestaCorrecta as number[])
            : [p.respuestaCorrecta as number],
          explanation: p.explicacion,
        };
      }

      const correctIndex = Array.isArray(p.respuestaCorrecta)
        ? (p.respuestaCorrecta[0] as number)
        : (p.respuestaCorrecta as number);

      const opcionesCuatro = opciones.slice(0, 4) as [
        string,
        string,
        string,
        string,
      ];
      while (opcionesCuatro.length < 4) {
        opcionesCuatro.push("");
      }

      return {
        type: "single_choice" as const,
        question: p.texto,
        options: opcionesCuatro,
        correctIndex,
        explanation: p.explicacion,
      };
    }

    if (p.tipo === TipoPregunta.RESPUESTA_CORTA) {
      const raw = Array.isArray(p.respuestaCorrecta)
        ? p.respuestaCorrecta[0]
        : p.respuestaCorrecta;
      const expected =
        String(raw ?? "").trim() || (p.criteriosEvaluacion ?? "").trim();
      return {
        type: "open_text" as const,
        question: p.texto,
        expectedAnswer: expected,
        explanation: p.explicacion,
      };
    }

    return {
      type: "open_text" as const,
      question: p.texto,
      expectedAnswer: p.explicacion ?? "",
      explanation: p.explicacion,
    };
  });
}
