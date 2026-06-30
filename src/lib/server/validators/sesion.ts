import { z } from "zod";

export const crearSesionSchema = z.object({
  quizId: z.string().min(1),
});

export const actualizarSesionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("updateName"),
    sessionName: z.string().max(120),
  }),
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("next") }),
  z.object({ action: z.literal("end") }),
]);

export const enviarRespuestaSchema = z.object({
  questionId: z.string().min(1),
  answerId: z.string().min(1),
  answerText: z.string().optional(),
  timeLeft: z.number().int().min(0).max(600),
  questionIndex: z.number().int().min(0),
});
