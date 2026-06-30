import { NextResponse } from "next/server";
import { conectarDB } from "@/lib/server/database";
import { UsuarioModel } from "@/lib/server/models/Usuario";
import { obtenerPayloadSesion } from "@/lib/server/auth/session";
import { serializarDocumento } from "@/lib/server/utils/serializar";

export async function GET() {
  try {
    const payload = await obtenerPayloadSesion();
    if (!payload) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    await conectarDB();

    const usuario = await UsuarioModel.findById(payload.sub)
      .select("-contraseña")
      .lean();

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 401 });
    }

    return NextResponse.json(serializarDocumento(usuario));
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al obtener sesión";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
