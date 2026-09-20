/** Tipos internos del motor IA (no expuestos directamente al UI). */
export type TipoPreguntaIa =
  | "true_false"
  | "single_choice"
  | "multi_choice"
  | "open_text";

export const TIPOS_PREGUNTA_IA: TipoPreguntaIa[] = [
  "true_false",
  "single_choice",
  "multi_choice",
  "open_text",
];

export interface PreguntaIaBase {
  type: TipoPreguntaIa;
  question: string;
  explanation?: string;
}

export interface PreguntaIaTrueFalse extends PreguntaIaBase {
  type: "true_false";
  answer: boolean;
}

export interface PreguntaIaSingleChoice extends PreguntaIaBase {
  type: "single_choice";
  options: [string, string, string, string];
  correctIndex: number;
}

export interface PreguntaIaMultiChoice extends PreguntaIaBase {
  type: "multi_choice";
  options: string[];
  answer: number[];
}

export interface PreguntaIaOpenText extends PreguntaIaBase {
  type: "open_text";
  evaluationCriteria: string;
}

export type PreguntaIa =
  | PreguntaIaTrueFalse
  | PreguntaIaSingleChoice
  | PreguntaIaMultiChoice
  | PreguntaIaOpenText;

export interface ConfigGeneracion {
  totalPreguntas: number;
  distribucion: Partial<Record<TipoPreguntaIa, number>>;
}

export interface QuizGeneradoIa {
  title: string;
  questions: PreguntaIa[];
}

export enum OrigenGeneracion {
  MANUAL = "manual",
  IA = "ia",
}

export interface ResultadoGeneracionQuiz {
  quizId: string;
  titulo: string;
  version: number;
  preguntas: import("./pregunta").Pregunta[];
}

export interface ResultadoRefinamientoQuiz extends ResultadoGeneracionQuiz {
  version: number;
}
