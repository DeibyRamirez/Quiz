import { NextResponse } from "next/server";
import { conectarDB } from "@/lib/server/database";
import { UsuarioModel } from "@/lib/server/models/Usuario";
import { loginSchema } from "@/lib/server/validators/auth";
import { verifyPassword } from "@/lib/server/auth/password";
import { COOKIE_NAME, signToken } from "@/lib/server/auth/jwt";
import { manejarErrorApi } from "@/lib/server/utils/api-response";
import { serializarDocumento } from "@/lib/server/utils/serializar";

export async function POST(request: Request) {
  try {
    await conectarDB();

    const body = await request.json();
    const { correo, contraseña } = loginSchema.parse(body);

    const usuario = await UsuarioModel.findOne({
      correo: correo.toLowerCase(),
    }).select("+contraseña");

    if (!usuario?.contraseña) {
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const valido = await verifyPassword(contraseña, usuario.contraseña);
    if (!valido) {
      return NextResponse.json(
        { error: "Correo o contraseña incorrectos" },
        { status: 401 }
      );
    }

    const usuarioPublico = serializarDocumento(usuario.toObject());
    const token = await signToken({
      sub: usuarioPublico.id,
      correo: usuarioPublico.correo,
      nombre: usuarioPublico.nombre,
      rol: usuarioPublico.rol,
    });

    const response = NextResponse.json({ usuario: usuarioPublico });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return manejarErrorApi(error);
  }
}
