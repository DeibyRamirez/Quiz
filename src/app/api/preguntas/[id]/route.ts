import { NextResponse } from "next/server";
import { RolUsuario } from "@/app/types/usuario";
import { AuthError, requerirAccesoDocente } from "@/lib/server/auth/requerir-auth";
import { conectarDB } from "@/lib/server/database";
import { PreguntaModel } from "@/lib/server/models/Pregunta";
import { QuizModel } from "@/lib/server/models/Quiz";
import { actualizarPreguntaSchema } from "@/lib/server/validators/pregunta";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";
import { serializarDocumento } from "@/lib/server/utils/serializar";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    await conectarDB();

    const pregunta = await PreguntaModel.findById(params.id).lean();

    if (!pregunta) {
      return respuestaError("Pregunta no encontrada", 404);
    }

    return NextResponse.json(serializarDocumento(pregunta));
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const payload = await requerirAccesoDocente();
    await conectarDB();

    const body = (await request.json()) as Record<string, unknown>;
    const confirmarRevisionDocente = body.confirmarRevisionDocente === true;
    const datos = actualizarPreguntaSchema.parse(body);

    const existente = await PreguntaModel.findById(params.id).lean();
    if (!existente) {
      return respuestaError("Pregunta no encontrada", 404);
    }

    const quiz = await QuizModel.findById(existente.quizId).lean();
    if (!quiz) {
      return respuestaError("Quiz asociado no encontrado", 400);
    }

    const esAdmin = payload.rol === RolUsuario.ADMINISTRADOR;
    if (!esAdmin && quiz.autorId !== payload.sub) {
      return respuestaError("No autorizado para este quiz", 403);
    }

    const actualizada = await PreguntaModel.findByIdAndUpdate(
      params.id,
      { $set: datos },
      { new: true, runValidators: true }
    ).lean();

    if (!actualizada) {
      return respuestaError("Pregunta no encontrada", 404);
    }

    if (confirmarRevisionDocente) {
      await PreguntaModel.updateOne(
        { _id: params.id },
        {
          $set: {
            revisadaPorDocente: true,
            revisadaPorDocenteEn: new Date(),
          },
        }
      );
    }

    const pregunta = await PreguntaModel.findById(params.id).lean();
    if (!pregunta) {
      return respuestaError("Pregunta no encontrada", 404);
    }

    return NextResponse.json(serializarDocumento(pregunta));
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await conectarDB();

    const pregunta = await PreguntaModel.findByIdAndUpdate(
      params.id,
      { $set: { activa: false } },
      { new: true }
    ).lean();

    if (!pregunta) {
      return respuestaError("Pregunta no encontrada", 404);
    }

    return NextResponse.json({ ok: true, id: params.id });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
