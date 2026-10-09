import { NextResponse } from "next/server";
import type { UsuarioPublico } from "@/app/types/usuario";
import { conectarDB } from "@/lib/server/database";
import { UsuarioModel } from "@/lib/server/models/Usuario";
import { COOKIE_NAME, signToken } from "@/lib/server/auth/jwt";
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

    const usuarioPublico = serializarDocumento<UsuarioPublico>(usuario);
    const response = NextResponse.json(usuarioPublico);

    if (usuarioPublico.rol !== payload.rol) {
      const token = await signToken({
        sub: usuarioPublico.id,
        correo: usuarioPublico.correo,
        nombre: usuarioPublico.nombre,
        rol: usuarioPublico.rol,
      });
      response.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (error) {
    const mensaje =
      error instanceof Error ? error.message : "Error al obtener sesión";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}
