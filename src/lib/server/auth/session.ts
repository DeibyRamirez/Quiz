import { cookies } from "next/headers";
import { COOKIE_NAME, verifyToken } from "./jwt";

export async function obtenerTokenDeCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}

export async function obtenerPayloadSesion() {
  const token = await obtenerTokenDeCookie();
  if (!token) return null;
  return verifyToken(token);
}
