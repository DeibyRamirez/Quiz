import { NextResponse } from "next/server";
import { RolUsuario } from "@/app/types/usuario";
import { AuthError, requerirRol } from "@/lib/server/auth/requerir-auth";
import { conectarDB } from "@/lib/server/database";
import { QuizIaService } from "@/lib/server/services/quiz-ia.service";
import { generarQuizIaSchema } from "@/lib/server/validators/quiz-ia";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";
import { esErrorConStatus } from "@/lib/server/utils/errores-dominio";

export async function POST(request: Request) {
  try {
    await conectarDB();

    const payload = await requerirRol([
      RolUsuario.DOCENTE,
      RolUsuario.ADMINISTRADOR,
    ]);

    const body = await request.json();
    const datos = generarQuizIaSchema.parse(body);

    const resultado = await QuizIaService.generar({
      guiaId: datos.guiaId,
      titulo: datos.titulo,
      config: {
        totalPreguntas: datos.config.totalPreguntas,
        distribucion: datos.config.distribucion,
      },
      docenteId: payload.sub,
    });

    return NextResponse.json(
      {
        quizId: resultado.quizId,
        titulo: resultado.titulo,
        version: resultado.version,
        questions: resultado.preguntas,
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
