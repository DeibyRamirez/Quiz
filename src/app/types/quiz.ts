import type { EntidadBase, OmitEntidadPersistida, Timestamps } from "./base";
import type { Pregunta } from "./pregunta";

export enum EstadoQuiz {
  BORRADOR = "borrador",
  PUBLICADO = "publicado",
}

export const ESTADOS_QUIZ = Object.values(EstadoQuiz) as EstadoQuiz[];

/** Lo que guarda MongoDB (preguntas en colección separada con `quizId`) */
export interface QuizBase extends EntidadBase, Timestamps {
  autorId: string;
  titulo: string;
  descripcion: string;
  estado: EstadoQuiz;
}

/** Respuesta de `GET /api/quizzes/[id]` */
export interface QuizConPreguntas extends QuizBase {
  preguntas: Pregunta[];
}

export type Quiz = QuizBase;

export type CrearQuiz = OmitEntidadPersistida<QuizBase> & {
  autorId: string;
  titulo: string;
  descripcion?: string;
  estado?: EstadoQuiz;
};

export type ActualizarQuiz = Partial<Omit<CrearQuiz, "autorId">>;

export function isQuizPublicado(quiz: Pick<QuizBase, "estado">): boolean {
  return quiz.estado === EstadoQuiz.PUBLICADO;
}

export function validarQuiz(quiz: CrearQuiz | QuizBase): boolean {
  if (!quiz.autorId?.trim()) return false;
  if (!quiz.titulo?.trim()) return false;
  if (quiz.estado && !ESTADOS_QUIZ.includes(quiz.estado)) return false;
  return true;
}

export function puedeIniciarSesion(
  quiz: Pick<QuizBase, "estado">,
  cantidadPreguntasActivas: number
): boolean {
  return isQuizPublicado(quiz) && cantidadPreguntasActivas > 0;
}
