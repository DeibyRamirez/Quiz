import { NextResponse } from "next/server";
import { RolUsuario } from "@/app/types/usuario";
import { AuthError, requerirAuth, requerirRol } from "@/lib/server/auth/requerir-auth";
import { conectarDB } from "@/lib/server/database";
import { UsuarioModel } from "@/lib/server/models/Usuario";
import { actualizarUsuarioSchema } from "@/lib/server/validators/usuario";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";
import { serializarDocumento } from "@/lib/server/utils/serializar";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  try {
    const sesion = await requerirAuth();
    await conectarDB();

    const usuario = await UsuarioModel.findById(params.id)
      .select("-contraseña")
      .lean();

    if (!usuario) {
      return respuestaError("Usuario no encontrado", 404);
    }

    const esAdmin = sesion.rol === RolUsuario.ADMINISTRADOR;
    const esPropio = params.id === sesion.sub;
    if (!esAdmin && !esPropio) {
      return respuestaError("No autorizado", 403);
    }

    return NextResponse.json(serializarDocumento(usuario));
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await requerirRol([RolUsuario.ADMINISTRADOR]);
    await conectarDB();

    const body = await request.json();
    const datos = actualizarUsuarioSchema.parse(body);

    const usuario = await UsuarioModel.findByIdAndUpdate(
      params.id,
      { $set: datos },
      { new: true, runValidators: true }
    )
      .select("-contraseña")
      .lean();

    if (!usuario) {
      return respuestaError("Usuario no encontrado", 404);
    }

    return NextResponse.json(serializarDocumento(usuario));
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requerirRol([RolUsuario.ADMINISTRADOR]);
    await conectarDB();

    const usuario = await UsuarioModel.findByIdAndDelete(params.id).lean();

    if (!usuario) {
      return respuestaError("Usuario no encontrado", 404);
    }

    return NextResponse.json({ ok: true, id: params.id });
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}
