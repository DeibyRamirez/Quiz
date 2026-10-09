import type { EntidadBase, OmitEntidadPersistida, Timestamps } from "./base";
import type { Pregunta } from "./pregunta";
import type { ConfigGeneracion, OrigenGeneracion } from "./quiz-ia";

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
  guiaId?: string;
  version?: number;
  configGeneracion?: ConfigGeneracion;
  origenGeneracion?: OrigenGeneracion;
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

/** Etiqueta en UI: `publicado` se muestra como Listo. */
export function etiquetaEstadoQuiz(estado: EstadoQuiz): string {
  if (estado === EstadoQuiz.PUBLICADO) return "Listo";
  if (estado === EstadoQuiz.BORRADOR) return "Borrador";
  return estado;
}

export function esQuizListoParaUi(estado: EstadoQuiz): boolean {
  return estado === EstadoQuiz.PUBLICADO;
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
