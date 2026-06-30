import { NextResponse } from "next/server";
import { conectarDB } from "@/lib/server/database";
import { QuizModel } from "@/lib/server/models/Quiz";
import { crearQuizSchema } from "@/lib/server/validators/quiz";
import { manejarErrorApi } from "@/lib/server/utils/api-response";
import { serializarDocumentos, serializarDocumento } from "@/lib/server/utils/serializar";

export async function GET(request: Request) {
  try {
    await conectarDB();

    const { searchParams } = new URL(request.url);
    const autorId = searchParams.get("autorId")?.trim().replace(/\/+$/, "");

    const filtro = autorId ? { autorId } : {};
    const quizzes = await QuizModel.find(filtro)
      .sort({ creadoEn: -1 })
      .lean();

    return NextResponse.json(serializarDocumentos(quizzes));
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function POST(request: Request) {
  try {
    await conectarDB();

    const body = await request.json();
    const datos = crearQuizSchema.parse(body);

    const quiz = await QuizModel.create(datos);

    return NextResponse.json(serializarDocumento(quiz.toObject()), { status: 201 });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
