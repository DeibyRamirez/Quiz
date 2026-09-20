import { z } from "zod";
import { TIPOS_PREGUNTA_IA } from "@/app/types/quiz-ia";

const tipoPreguntaIaSchema = z.enum([
  "true_false",
  "single_choice",
  "multi_choice",
  "open_text",
]);

export const distribucionSchema = z
  .record(tipoPreguntaIaSchema, z.number().int().nonnegative())
  .refine(
    (dist) => Object.values(dist).some((v) => v > 0),
    "La distribución debe incluir al menos un tipo con cantidad > 0"
  );

export const configGeneracionSchema = z
  .object({
    totalPreguntas: z.number().int().min(1).max(50),
    distribucion: distribucionSchema,
  })
  .superRefine((data, ctx) => {
    const suma = TIPOS_PREGUNTA_IA.reduce(
      (acc, tipo) => acc + (data.distribucion[tipo] ?? 0),
      0
    );
    if (suma !== data.totalPreguntas) {
      ctx.addIssue({
        code: "custom",
        message: `La suma de la distribución (${suma}) debe igualar totalPreguntas (${data.totalPreguntas})`,
        path: ["distribucion"],
      });
    }
  });

export const generarQuizIaSchema = z.object({
  guiaId: z.string().trim().min(1, "guiaId es obligatorio"),
  titulo: z.string().trim().min(1, "El título es obligatorio"),
  config: configGeneracionSchema,
});

export const refinarQuizIaSchema = z.object({
  teacherInstruction: z
    .string()
    .trim()
    .min(3, "La instrucción debe tener al menos 3 caracteres")
    .max(2000, "La instrucción no puede superar 2000 caracteres"),
});

const preguntaIaTrueFalseSchema = z.object({
  type: z.literal("true_false"),
  question: z.string().trim().min(1),
  answer: z.boolean(),
  explanation: z.string().trim().optional(),
});

const preguntaIaSingleChoiceSchema = z.object({
  type: z.literal("single_choice"),
  question: z.string().trim().min(1),
  options: z.tuple([
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
    z.string().trim().min(1),
  ]),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().optional(),
});

const preguntaIaMultiChoiceSchema = z.object({
  type: z.literal("multi_choice"),
  question: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).min(4).max(5),
  answer: z.array(z.number().int().nonnegative()).min(1),
  explanation: z.string().trim().optional(),
});

const preguntaIaOpenTextSchema = z.object({
  type: z.literal("open_text"),
  question: z.string().trim().min(1),
  evaluationCriteria: z.string().trim().min(1),
  explanation: z.string().trim().optional(),
});

export const preguntaIaSchema = z.discriminatedUnion("type", [
  preguntaIaTrueFalseSchema,
  preguntaIaSingleChoiceSchema,
  preguntaIaMultiChoiceSchema,
  preguntaIaOpenTextSchema,
]);

export const quizGeneradoIaSchema = z.object({
  title: z.string().trim().min(1),
  questions: z.array(preguntaIaSchema).min(1),
});

export type GenerarQuizIaInput = z.infer<typeof generarQuizIaSchema>;
export type RefinarQuizIaInput = z.infer<typeof refinarQuizIaSchema>;
export type QuizGeneradoIaValidado = z.infer<typeof quizGeneradoIaSchema>;
