import { z } from "zod";

export const subirGuiaSchema = z.object({
  cursoId: z.string().trim().optional(),
  titulo: z.string().trim().optional(),
});

export const MIME_GUIA_PERMITIDOS = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const EXTENSIONES_GUIA_PERMITIDAS = [".pdf", ".docx"] as const;
