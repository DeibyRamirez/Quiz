import { NextResponse } from "next/server";
import { conectarDB } from "@/lib/server/database";
import { PreguntaModel } from "@/lib/server/models/Pregunta";
import {
  lectorPuedeVerRespuestas,
  ocultarRespuestasPregunta,
} from "@/lib/server/services/visibilidad-pregunta";
import { parsearCrearPregunta } from "@/lib/server/validators/pregunta";
import { manejarErrorApi } from "@/lib/server/utils/api-response";
import { serializarDocumentos, serializarDocumento } from "@/lib/server/utils/serializar";

export async function GET(request: Request) {
  try {
    await conectarDB();

    const { searchParams } = new URL(request.url);
    const quizId = searchParams.get("quizId");
    const puedeVerClave = quizId ? await lectorPuedeVerRespuestas(quizId) : false;
    // Sin quiz, o sin ser el docente dueño / admin, solo preguntas activas y sin clave.
    const soloActivas = puedeVerClave
      ? searchParams.get("activa") !== "false"
      : true;

    const filtro: Record<string, unknown> = {};

    if (quizId) {
      filtro.quizId = quizId;
    }

    if (soloActivas) {
      filtro.activa = true;
    }

    const preguntas = await PreguntaModel.find(filtro)
      .sort({ creadoEn: 1 })
      .limit(200)
      .lean();

    const serializadas = serializarDocumentos(preguntas);
    const visibles = puedeVerClave
      ? serializadas
      : serializadas.map((pregunta) => ocultarRespuestasPregunta(pregunta));

    return NextResponse.json(visibles);
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function POST(request: Request) {
  try {
    await conectarDB();

    const body = await request.json();
    const datos = parsearCrearPregunta(body);

    const pregunta = await PreguntaModel.create(datos);

    return NextResponse.json(
      serializarDocumento(pregunta.toObject()),
      { status: 201 }
    );
  } catch (error) {
    return manejarErrorApi(error);
  }
}
