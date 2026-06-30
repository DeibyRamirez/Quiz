"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import type { EstadoQuiz } from "@/app/types";
import type {
  AnswerUi,
  QuestionTypeUi,
} from "@/lib/client/mappers/pregunta-ui";

export interface QuizFormState {
  title: string;
  description: string;
  estado: EstadoQuiz;
}

export interface QuestionFormState {
  question: string;
  explanation: string;
  points: string;
  timeLimit: string;
  tema: string;
  activa: boolean;
  permiteMultiples: boolean;
}

export const DEFAULT_QUESTION_FORM: QuestionFormState = {
  question: "",
  explanation: "",
  points: "100",
  timeLimit: "30",
  tema: "",
  activa: true,
  permiteMultiples: false,
};

export const TIME_OPTIONS = ["15", "30", "45", "60", "90", "120"];
export const POINTS_OPTIONS = ["50", "100", "200", "300", "500"];

export function FieldGroup({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="caption">{hint}</p> : null}
    </div>
  );
}

export function answersEqual(a: AnswerUi[], b: AnswerUi[]) {
  if (a.length !== b.length) return false;
  return a.every(
    (item, i) =>
      item.text === b[i].text && item.isCorrect === b[i].isCorrect
  );
}

export function buildCanSaveQuestion(
  questionForm: QuestionFormState,
  questionType: QuestionTypeUi,
  answers: AnswerUi[],
  numericalInput: string,
  numericalUnit: string,
  exactAnswerText: string
): boolean {
  if (!questionForm.question.trim()) return false;

  if (questionType === "multiple-choice") {
    const allFilled = answers.every((a) => a.text.trim().length > 0);
    const hasCorrect = answers.some((a) => a.isCorrect);
    if (!allFilled || !hasCorrect) return false;
    if (questionForm.permiteMultiples) {
      return answers.filter((a) => a.isCorrect).length >= 1;
    }
    return answers.filter((a) => a.isCorrect).length === 1;
  }

  if (questionType === "true-false") {
    return answers.some((a) => a.isCorrect);
  }

  if (questionType === "numerical") {
    const trimmed = numericalInput.trim();
    if (!trimmed || !numericalUnit) return false;
    return !Number.isNaN(parseFloat(trimmed));
  }

  if (questionType === "exact-text") {
    return exactAnswerText.trim().length > 0;
  }

  return false;
}
