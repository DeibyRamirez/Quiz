import { NextResponse } from "next/server";
import { conectarDB } from "@/lib/server/database";
import { UsuarioModel } from "@/lib/server/models/Usuario";
import { actualizarUsuarioSchema } from "@/lib/server/validators/usuario";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";
import { serializarDocumento } from "@/lib/server/utils/serializar";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    await conectarDB();

    const usuario = await UsuarioModel.findById(params.id)
      .select("-contraseña")
      .lean();

    if (!usuario) {
      return respuestaError("Usuario no encontrado", 404);
    }

    return NextResponse.json(serializarDocumento(usuario));
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await conectarDB();

    const body = await request.json();
    const datos = actualizarUsuarioSchema.parse(body);

    const payload = { ...datos };
    if (payload.contraseña) {
      const { hashPassword } = await import("@/lib/server/auth/password");
      payload.contraseña = await hashPassword(payload.contraseña);
    }

    const usuario = await UsuarioModel.findByIdAndUpdate(
      params.id,
      { $set: payload },
      { new: true, runValidators: true }
    )
      .select("-contraseña")
      .lean();

    if (!usuario) {
      return respuestaError("Usuario no encontrado", 404);
    }

    return NextResponse.json(serializarDocumento(usuario));
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await conectarDB();

    const usuario = await UsuarioModel.findByIdAndDelete(params.id).lean();

    if (!usuario) {
      return respuestaError("Usuario no encontrado", 404);
    }

    return NextResponse.json({ ok: true, id: params.id });
  } catch (error) {
    return manejarErrorApi(error);
  }
}
