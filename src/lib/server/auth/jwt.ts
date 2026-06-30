import { SignJWT, jwtVerify } from "jose";
import type { RolUsuario } from "@/app/types/usuario";

export const COOKIE_NAME = "eq_token";
export const JWT_EXPIRES = "7d";

export interface JwtPayload {
  sub: string;
  correo: string;
  nombre: string;
  rol: RolUsuario;
}

function getSecret() {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("JWT_SECRET no está definido en las variables de entorno.");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT({
    correo: payload.correo,
    nombre: payload.nombre,
    rol: payload.rol,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const sub = payload.sub;
    if (!sub) return null;

    return {
      sub,
      correo: String(payload.correo ?? ""),
      nombre: String(payload.nombre ?? ""),
      rol: payload.rol as RolUsuario,
    };
  } catch {
    return null;
  }
}
