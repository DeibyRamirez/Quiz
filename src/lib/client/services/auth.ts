import type { RolUsuario, UsuarioPublico } from "@/app/types";
import { apiRequest } from "@/lib/client/api";

export async function obtenerSesion(): Promise<UsuarioPublico | null> {
  try {
    return await apiRequest<UsuarioPublico>("/auth/me");
  } catch {
    return null;
  }
}

export async function iniciarSesion(
  correo: string,
  contraseña: string
): Promise<UsuarioPublico> {
  const data = await apiRequest<{ usuario: UsuarioPublico }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ correo, contraseña }),
  });
  return data.usuario;
}

export async function registrarUsuario(datos: {
  nombre: string;
  correo: string;
  contraseña: string;
  rol?: RolUsuario;
}): Promise<UsuarioPublico> {
  const data = await apiRequest<{ usuario: UsuarioPublico }>("/auth/registro", {
    method: "POST",
    body: JSON.stringify(datos),
  });
  return data.usuario;
}

export async function cerrarSesion(): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST" });
}

export function redirigirPorRol(rol: RolUsuario, router: { push: (path: string) => void }) {
  if (rol === "estudiante") router.push("/student");
  else if (rol === "admin") router.push("/administrador");
  else if (rol === "docente") router.push("/teacher");
  else router.push("/student");
}
