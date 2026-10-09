import { NextResponse } from "next/server";
import { AuthError, requerirAccesoDocente } from "@/lib/server/auth/requerir-auth";
import { conectarDB } from "@/lib/server/database";
import { GuiaService } from "@/lib/server/services/guia.service";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";
import { esErrorConStatus } from "@/lib/server/utils/errores-dominio";

export async function POST(request: Request) {
  try {
    await conectarDB();

    const payload = await requerirAccesoDocente();

    const formData = await request.formData();
    const archivo = formData.get("file");

    if (!(archivo instanceof File)) {
      return respuestaError("El campo 'file' es obligatorio", 400);
    }

    const cursoId = formData.get("cursoId");
    const titulo = formData.get("titulo");

    const buffer = Buffer.from(await archivo.arrayBuffer());

    const resultado = await GuiaService.subirYProcesar({
      buffer,
      nombreArchivo: archivo.name,
      mimeType: archivo.type,
      docenteId: payload.sub,
      cursoId: typeof cursoId === "string" ? cursoId : undefined,
      titulo: typeof titulo === "string" ? titulo : undefined,
    });

    return NextResponse.json(
      {
        guideId: resultado.guiaId,
        titulo: resultado.titulo,
        tokenEstimate: resultado.estimacionTokens,
        cached: resultado.enCache,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    if (esErrorConStatus(error)) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}
