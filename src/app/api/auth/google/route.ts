import { NextResponse } from "next/server";
import { RolUsuario, type UsuarioPublico } from "@/app/types/usuario";
import { correoEsInstitucional } from "@/lib/correo-institucional";
import { COOKIE_NAME, signToken } from "@/lib/server/auth/jwt";
import { conectarDB } from "@/lib/server/database";
import { obtenerFirebaseAuthAdmin } from "@/lib/server/firebase-admin";
import { UsuarioModel } from "@/lib/server/models/Usuario";
import { manejarErrorApi } from "@/lib/server/utils/api-response";
import { serializarDocumento } from "@/lib/server/utils/serializar";
import { googleAuthSchema } from "@/lib/server/validators/auth";

export async function POST(request: Request) {
  try {
    await conectarDB();

    const body = await request.json();
    const { idToken } = googleAuthSchema.parse(body);

    const decoded = await obtenerFirebaseAuthAdmin().verifyIdToken(idToken);
    const correo = decoded.email?.trim().toLowerCase();
    const firebaseUid = decoded.uid;
    const nombre =
      decoded.name?.trim() || correo?.split("@")[0] || "Usuario";

    // Valicacion de Dominio
    if (
      decoded.firebase?.sign_in_provider !== "google.com" ||
      !correo ||
      !correoEsInstitucional(correo)
    ) {
      return NextResponse.json(
        { error: "Solo se permiten cuentas @uniautonoma.edu.co" },
        { status: 403 }
      );
    }

    let usuario = await UsuarioModel.findOne({
      $or: [{ firebaseUid }, { correo }],
    });

    // Busca o crear el documento 
    if (usuario) {
      if (!usuario.firebaseUid) {
        usuario.firebaseUid = firebaseUid;
        await usuario.save();
      }
    } else {
      usuario = await UsuarioModel.create({
        nombre,
        correo,
        firebaseUid,
        rol: RolUsuario.ESTUDIANTE,
      });
    }
    // Asignacion de TOken JWT
    const usuarioPublico = serializarDocumento<UsuarioPublico>(usuario.toObject());
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
