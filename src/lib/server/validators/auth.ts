import { z } from "zod";

export const loginSchema = z.object({
  correo: z.string().trim().email("Correo inválido"),
  contraseña: z.string().min(1, "La contraseña es obligatoria"),
});

export const registroSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  correo: z.string().trim().email("Correo inválido"),
  contraseña: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const googleAuthSchema = z.object({
  idToken: z.string().trim().min(1, "Token de Google inválido"),
});
