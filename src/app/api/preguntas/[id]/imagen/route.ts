import { NextResponse } from "next/server";
import fs from "fs/promises";
import { AuthError, requerirAccesoDocente } from "@/lib/server/auth/requerir-auth";
import { conectarDB } from "@/lib/server/database";
import { PreguntaModel } from "@/lib/server/models/Pregunta";
import {
  MAX_IMAGEN_BYTES,
  asegurarDirectorioQuiz,
  eliminarArchivoSiExiste,
  extensionDesdeMime,
  obtenerPreguntaConPermisoDocente,
  rutaAbsolutaDesdeRelativa,
  rutaRelativaImagen,
} from "@/lib/server/utils/recursos-quiz";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";
import { serializarDocumento } from "@/lib/server/utils/serializar";

type Params = { params: { id: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    const payload = await requerirAccesoDocente();
    const pregunta = await obtenerPreguntaConPermisoDocente(params.id, payload);

    const formData = await request.formData();
    const archivo = formData.get("file");
    if (!(archivo instanceof File)) {
      return respuestaError("El campo 'file' es obligatorio", 400);
    }

    if (archivo.size > MAX_IMAGEN_BYTES) {
      return respuestaError("La imagen no puede superar 5 MB", 400);
    }

    const ext = extensionDesdeMime(archivo.type);
    if (!ext) {
      return respuestaError("Formato no permitido (usa JPG, PNG o WebP)", 400);
    }

    const quizId = String(pregunta.quizId);
    const preguntaId = params.id;
    const relativa = rutaRelativaImagen(quizId, preguntaId, ext);
    const abs = rutaAbsolutaDesdeRelativa(relativa);

    if (pregunta.imagenReferencia) {
      try {
        await eliminarArchivoSiExiste(
          rutaAbsolutaDesdeRelativa(pregunta.imagenReferencia)
        );
      } catch {
        /* ruta anterior inválida */
      }
    }

    await asegurarDirectorioQuiz(quizId);
    const buffer = Buffer.from(await archivo.arrayBuffer());
    await fs.writeFile(abs, buffer);

    await conectarDB();
    const actualizada = await PreguntaModel.findByIdAndUpdate(
      preguntaId,
      { $set: { imagenReferencia: relativa } },
      { new: true }
    ).lean();

    if (!actualizada) {
      return respuestaError("Pregunta no encontrada", 404);
    }

    return NextResponse.json(serializarDocumento(actualizada));
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const payload = await requerirAccesoDocente();
    const pregunta = await obtenerPreguntaConPermisoDocente(params.id, payload);

    if (pregunta.imagenReferencia) {
      try {
        await eliminarArchivoSiExiste(
          rutaAbsolutaDesdeRelativa(pregunta.imagenReferencia)
        );
      } catch {
        /* ignorar */
      }
    }

    await conectarDB();
    const actualizada = await PreguntaModel.findByIdAndUpdate(
      params.id,
      { $unset: { imagenReferencia: "" } },
      { new: true }
    ).lean();

    if (!actualizada) {
      return respuestaError("Pregunta no encontrada", 404);
    }

    return NextResponse.json(serializarDocumento(actualizada));
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}
