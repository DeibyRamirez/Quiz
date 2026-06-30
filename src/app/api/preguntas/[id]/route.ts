import { NextResponse } from "next/server";
import { conectarDB } from "@/lib/server/database";
import { PreguntaModel } from "@/lib/server/models/Pregunta";
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
    await conectarDB();

    const body = await request.json();
    const datos = actualizarPreguntaSchema.parse(body);

    const pregunta = await PreguntaModel.findByIdAndUpdate(
      params.id,
      { $set: datos },
      { new: true, runValidators: true }
    ).lean();

    if (!pregunta) {
      return respuestaError("Pregunta no encontrada", 404);
    }

    return NextResponse.json(serializarDocumento(pregunta));
  } catch (error) {
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
