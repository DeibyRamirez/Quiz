import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import {
  RECURSOS_QUIZ_DIR,
  contentTypeDesdeNombre,
  rutaAbsolutaDesdeRelativa,
} from "@/lib/server/utils/recursos-quiz";
import { respuestaError } from "@/lib/server/utils/api-response";

type Params = { params: { quizId: string; archivo: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const quizId = params.quizId.replace(/[^a-zA-Z0-9_-]/g, "");
    const archivo = path.basename(params.archivo);
    if (!quizId || !archivo || archivo.includes("..")) {
      return respuestaError("Archivo no válido", 400);
    }

    const relativa = `${RECURSOS_QUIZ_DIR}/${quizId}/${archivo}`;
    const abs = rutaAbsolutaDesdeRelativa(relativa);
    const buffer = await fs.readFile(abs);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentTypeDesdeNombre(archivo),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return respuestaError("Imagen no encontrada", 404);
    }
    return respuestaError("Error al cargar imagen", 500);
  }
}
