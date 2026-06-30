import { z } from "zod";
import { EstadoQuiz } from "@/app/types/quiz";

export const estadoQuizSchema = z.nativeEnum(EstadoQuiz);

export const crearQuizSchema = z.object({
  autorId: z.string().trim().min(1, "autorId es obligatorio"),
  titulo: z.string().trim().min(1, "El título es obligatorio"),
  descripcion: z.string().trim().default(""),
  estado: estadoQuizSchema.default(EstadoQuiz.BORRADOR),
});

export const actualizarQuizSchema = crearQuizSchema.partial();
