import { NextResponse } from "next/server";
import { conectarDB } from "@/lib/server/database";
import { UsuarioModel } from "@/lib/server/models/Usuario";
import { crearUsuarioSchema } from "@/lib/server/validators/usuario";
import { manejarErrorApi } from "@/lib/server/utils/api-response";
import { serializarDocumentos, serializarDocumento } from "@/lib/server/utils/serializar";

export async function GET(request: Request) {
  try {
    await conectarDB();

    const { searchParams } = new URL(request.url);
    const firebaseUid = searchParams.get("firebaseUid");
    const correo = searchParams.get("correo");

    if (firebaseUid || correo) {
      const filtro: Record<string, string> = {};
      if (firebaseUid) filtro.firebaseUid = firebaseUid;
      if (correo) filtro.correo = correo.trim().toLowerCase();

      const usuario = await UsuarioModel.findOne(filtro)
        .select("-contraseña")
        .lean();

      if (!usuario) {
        return NextResponse.json(null);
      }

      return NextResponse.json(serializarDocumento(usuario));
    }

    const usuarios = await UsuarioModel.find().select("-contraseña").lean();
    return NextResponse.json(serializarDocumentos(usuarios));
  } catch (error) {
    return manejarErrorApi(error);
  }
}

export async function POST(request: Request) {
  try {
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
    return manejarErrorApi(error);
  }
}
