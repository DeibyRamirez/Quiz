import { z } from "zod";
import { RolUsuario } from "@/app/types/usuario";

export const rolUsuarioSchema = z.nativeEnum(RolUsuario);

export const crearUsuarioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio"),
  correo: z.string().trim().email("Correo inválido"),
  contraseña: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .optional(),
  rol: rolUsuarioSchema.default(RolUsuario.ESTUDIANTE),
  firebaseUid: z.string().trim().min(1).optional(),
});

export const actualizarUsuarioSchema = crearUsuarioSchema.partial();
