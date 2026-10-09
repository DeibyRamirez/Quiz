import { NextResponse } from "next/server";
import { RolUsuario } from "@/app/types/usuario";
import { AuthError, requerirAuth, requerirRol } from "@/lib/server/auth/requerir-auth";
import { conectarDB } from "@/lib/server/database";
import { UsuarioModel } from "@/lib/server/models/Usuario";
import { crearUsuarioSchema } from "@/lib/server/validators/usuario";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";
import { serializarDocumentos, serializarDocumento } from "@/lib/server/utils/serializar";

export async function GET(request: Request) {
  try {
    await conectarDB();

    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get("firebaseUid");
    const correo = searchParams.get("correo");

    if (firebaseUid || correo) {
      const sesion = await requerirAuth();
      const filtro: Record<string, string> = {};
      if (firebaseUid) filtro.firebaseUid = firebaseUid;
      if (correo) filtro.correo = correo.trim().toLowerCase();

      const usuario = await UsuarioModel.findOne(filtro)
        .select("-contraseña")
        .lean();

      if (!usuario) {
        return NextResponse.json(null);
      }

      const doc = serializarDocumento(usuario);
      const esAdmin = sesion.rol === RolUsuario.ADMINISTRADOR;
      const esPropio = doc.id === sesion.sub;
      if (!esAdmin && !esPropio) {
        return respuestaError("No autorizado", 403);
      }

      return NextResponse.json(doc);
    }

    await requerirRol([RolUsuario.ADMINISTRADOR]);
    const usuarios = await UsuarioModel.find().select("-contraseña").lean();
    return NextResponse.json(serializarDocumentos(usuarios));
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}

export async function POST(request: Request) {
  try {
    await requerirRol([RolUsuario.ADMINISTRADOR]);
    await conectarDB();

    const body = await request.json();
    const datos = crearUsuarioSchema.parse(body);

    const payload = { ...datos };
    if (payload.contraseña) {
      const { hashPassword } = await import("@/lib/server/auth/password");
      payload.contraseña = await hashPassword(payload.contraseña);
    }

    const usuario = await UsuarioModel.create(payload);

    return NextResponse.json(serializarDocumento(usuario.toObject()), {
      status: 201,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}
