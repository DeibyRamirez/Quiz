import { NextResponse } from "next/server";
import { AuthError, requerirAccesoDocente } from "@/lib/server/auth/requerir-auth";
import { conectarDB } from "@/lib/server/database";
import { QuizIaService } from "@/lib/server/services/quiz-ia.service";
import { refinarQuizIaSchema } from "@/lib/server/validators/quiz-ia";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";
import { esErrorConStatus } from "@/lib/server/utils/errores-dominio";

interface Params {
  params: { quizId: string };
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await conectarDB();

    const payload = await requerirAccesoDocente();

    const quizId = params.quizId?.trim().replace(/\/+$/, "");
    if (!quizId) {
      return respuestaError("quizId es obligatorio", 400);
    }

    const body = await request.json();
    const datos = refinarQuizIaSchema.parse(body);

    const resultado = await QuizIaService.refinar({
      quizId,
      teacherInstruction: datos.teacherInstruction,
      docenteId: payload.sub,
    });

    return NextResponse.json({
      quizId: resultado.quizId,
      titulo: resultado.titulo,
      version: resultado.version,
      questions: resultado.preguntas,
    });
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
