import { OrigenGeneracion } from "@/app/types/quiz-ia";

export function esQuizGeneradoConIa(quiz: {
  origenGeneracion?: string;
  guiaId?: unknown;
}): boolean {
  return (
    quiz.origenGeneracion === OrigenGeneracion.IA || Boolean(quiz.guiaId)
  );
}
