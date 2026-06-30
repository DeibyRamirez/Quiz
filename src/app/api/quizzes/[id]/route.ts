import { NextResponse } from "next/server";
import { conectarDB } from "@/lib/server/database";
import { QuizModel } from "@/lib/server/models/Quiz";
import { PreguntaModel } from "@/lib/server/models/Pregunta";
import { actualizarQuizSchema } from "@/lib/server/validators/quiz";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";
import { serializarDocumento, serializarDocumentos } from "@/lib/server/utils/serializar";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    await conectarDB();

    const quiz = await QuizModel.findById(params.id).lean();

    if (!quiz) {
      return respuestaError("Quiz no encontrado", 404);
    }

    const preguntas = await PreguntaModel.find({ quizId: params.id, activa: true })
      .sort({ creadoEn: 1 })
      .lean();

    return NextResponse.json({
      ...serializarDocumento(quiz),
      preguntas: serializarDocumentos(preguntas),
    });
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await conectarDB();

    const body = await request.json();
    const datos = actualizarQuizSchema.parse(body);

    const quiz = await QuizModel.findByIdAndUpdate(
      params.id,
      { $set: datos },
      { new: true, runValidators: true }
    ).lean();

    if (!quiz) {
      return respuestaError("Quiz no encontrado", 404);
    }

    return NextResponse.json(serializarDocumento(quiz));
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await conectarDB();

    const quiz = await QuizModel.findByIdAndDelete(params.id).lean();

    if (!quiz) {
      return respuestaError("Quiz no encontrado", 404);
    }

    await PreguntaModel.updateMany(
      { quizId: params.id },
      { $set: { activa: false } }
    );

    return NextResponse.json({ ok: true, id: params.id });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
