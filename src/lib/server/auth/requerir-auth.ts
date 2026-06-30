import { RolUsuario } from "@/app/types/usuario";
import { obtenerPayloadSesion } from "./session";
import type { JwtPayload } from "./jwt";

export async function requerirAuth(): Promise<JwtPayload> {
  const payload = await obtenerPayloadSesion();
  if (!payload) {
    throw new AuthError("No autenticado", 401);
  }
  return payload;
}

export async function requerirRol(roles: RolUsuario[]): Promise<JwtPayload> {
  const payload = await requerirAuth();
  if (!roles.includes(payload.rol)) {
    throw new AuthError("No autorizado", 403);
  }
  return payload;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AuthError";
  }
}
