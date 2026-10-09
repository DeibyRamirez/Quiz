import fs from "fs/promises";
import path from "path";
import { RolUsuario } from "@/app/types/usuario";
import type { JwtPayload } from "@/lib/server/auth/jwt";
import { conectarDB } from "@/lib/server/database";
import { PreguntaModel } from "@/lib/server/models/Pregunta";
import { QuizModel } from "@/lib/server/models/Quiz";
import { AuthError } from "@/lib/server/auth/requerir-auth";

export const RECURSOS_QUIZ_DIR = "recursos-quiz";
export const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;

const MIME_A_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function extensionDesdeMime(mime: string): string | null {
  return MIME_A_EXT[mime] ?? null;
}

export function rutaRelativaImagen(
  quizId: string,
  preguntaId: string,
  ext: string
): string {
  return `${RECURSOS_QUIZ_DIR}/${quizId}/${preguntaId}.${ext}`;
}

export function directorioQuizAbsoluto(quizId: string): string {
  const safe = quizId.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(process.cwd(), RECURSOS_QUIZ_DIR, safe);
}

export function rutaAbsolutaDesdeRelativa(relativa: string): string {
  const normalized = relativa.replace(/^recursos-quiz\//, "");
  const abs = path.join(process.cwd(), RECURSOS_QUIZ_DIR, normalized);
  const base = path.join(process.cwd(), RECURSOS_QUIZ_DIR);
  if (!abs.startsWith(base)) {
    throw new AuthError("Ruta de imagen inválida", 400);
  }
  return abs;
}

export async function asegurarDirectorioQuiz(quizId: string): Promise<void> {
  await fs.mkdir(directorioQuizAbsoluto(quizId), { recursive: true });
}

export async function eliminarArchivoSiExiste(rutaAbsoluta: string): Promise<void> {
  try {
    await fs.unlink(rutaAbsoluta);
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
  }
}

export async function obtenerPreguntaConPermisoDocente(
  preguntaId: string,
  payload: JwtPayload
) {
  await conectarDB();
  const pregunta = await PreguntaModel.findById(preguntaId).lean();
  if (!pregunta) {
    throw new AuthError("Pregunta no encontrada", 404);
  }

  const quiz = await QuizModel.findById(pregunta.quizId).lean();
  if (!quiz) {
    throw new AuthError("Quiz no encontrado", 404);
  }

  const esAdmin = payload.rol === RolUsuario.ADMINISTRADOR;
  if (!esAdmin && quiz.autorId !== payload.sub) {
    throw new AuthError("No autorizado para este quiz", 403);
  }

  return pregunta;
}

export function contentTypeDesdeNombre(archivo: string): string {
  const ext = path.extname(archivo).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}
