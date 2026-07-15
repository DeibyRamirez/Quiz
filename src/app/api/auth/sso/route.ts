/**
 * GET /api/auth/sso?token=<sso_token>&redirect=<path>
 *
 * Endpoint de Single Sign-On (SSO) para recibir usuarios autenticados desde NOVA.
 * El token SSO es emitido por Django (/api/users/quiz-sso/) firmado con
 * QUIZ_SSO_SECRET (HMAC-SHA256). Este endpoint:
 *
 *  1. Verifica la firma y que el token no ha expirado (60 segundos).
 *  2. Upsert del usuario en MongoDB con el rol correcto.
 *  3. Emite la cookie eq_token igual que el login normal.
 *  4. Redirige al path indicado (default: /quiz-app/teacher/ o /quiz-app/student/).
 */

import { NextRequest, NextResponse } from "next/server";
import { conectarDB } from "@/lib/server/database";
import { UsuarioModel } from "@/lib/server/models/Usuario";
import { COOKIE_NAME, signToken } from "@/lib/server/auth/jwt";
import { serializarDocumento } from "@/lib/server/utils/serializar";
import { RolUsuario } from "@/app/types/usuario";

const SSO_TTL_SECONDS = 120; // 2 minutos

function getSecret(): string {
  const secret = process.env.QUIZ_SSO_SECRET?.trim();
  if (!secret) throw new Error("QUIZ_SSO_SECRET no configurado");
  return secret;
}

async function verifyHmac(data: string, sig: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sigBytes = hexToBytes(sig);
  return crypto.subtle.verify("HMAC", key, sigBytes, enc.encode(data));
}

function hexToBytes(hex: string): Uint8Array {
  const pairs = hex.match(/.{2}/g) ?? [];
  return new Uint8Array(pairs.map((b) => parseInt(b, 16)));
}

function base64urlDecode(s: string): string {
  // Convert base64url to standard base64 padding
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(b64, "base64").toString("utf-8");
}

export async function GET(request: NextRequest) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");

  try {
    const { searchParams } = new URL(request.url);
    const rawToken = searchParams.get("token");
    const redirectTo = searchParams.get("redirect");

    if (!rawToken) {
      return NextResponse.redirect(new URL(`${basePath}/login`, request.url));
    }

    const parts = rawToken.split(".");
    if (parts.length !== 2) {
      return NextResponse.redirect(new URL(`${basePath}/login`, request.url));
    }

    const [payloadB64, sig] = parts;
    const secret = getSecret();
    const valid = await verifyHmac(payloadB64, sig, secret);
    if (!valid) {
      console.warn("[SSO] Firma inválida");
      return NextResponse.redirect(new URL(`${basePath}/login`, request.url));
    }

    let payload: { email: string; nombre: string; rol: string; iat: number };
    try {
      payload = JSON.parse(base64urlDecode(payloadB64));
    } catch {
      return NextResponse.redirect(new URL(`${basePath}/login`, request.url));
    }

    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (!payload.iat || now - payload.iat > SSO_TTL_SECONDS) {
      console.warn("[SSO] Token expirado");
      return NextResponse.redirect(new URL(`${basePath}/login`, request.url));
    }

    const quizRol: RolUsuario =
      payload.rol === "docente" ? RolUsuario.DOCENTE : RolUsuario.ESTUDIANTE;

    await conectarDB();

    // Upsert: crea si no existe, actualiza nombre y rol siempre
    const usuario = await UsuarioModel.findOneAndUpdate(
      { correo: payload.email.toLowerCase() },
      {
        $set: {
          nombre: payload.nombre,
          correo: payload.email.toLowerCase(),
          rol: quizRol,
        },
        $setOnInsert: { creadoEn: new Date() },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    if (!usuario) {
      return NextResponse.redirect(new URL(`${basePath}/login`, request.url));
    }

    const doc = serializarDocumento(usuario);
    const token = await signToken({
      sub: doc.id,
      correo: doc.correo,
      nombre: doc.nombre,
      rol: quizRol,
    });

    // Determinar redirección final
    const defaultRedirect =
      quizRol === RolUsuario.DOCENTE
        ? `${basePath}/teacher/`
        : `${basePath}/student/`;
    const destination = redirectTo ?? defaultRedirect;
    const absoluteDestination = destination.startsWith("http")
      ? destination
      : new URL(destination, request.url).href;

    const response = NextResponse.redirect(absoluteDestination);
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (err) {
    console.error("[SSO] Error interno:", err);
    const basePath2 = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/+$/, "");
    return NextResponse.redirect(new URL(`${basePath2}/login`, request.url));
  }
}
