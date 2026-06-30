import type { UsuarioPublico } from "@/app/types";
import { obtenerSesion, cerrarSesion } from "@/lib/client/services/auth";

let sesionCache: UsuarioPublico | null | undefined = undefined;

export async function obtenerUsuarioActual(): Promise<UsuarioPublico | null> {
  if (sesionCache !== undefined) return sesionCache;
  sesionCache = await obtenerSesion();
  return sesionCache;
}

export function limpiarSesionCache() {
  sesionCache = undefined;
}

export async function cerrarSesionApp() {
  await cerrarSesion();
  limpiarSesionCache();
}

export function establecerSesionCache(usuario: UsuarioPublico | null) {
  sesionCache = usuario;
}
