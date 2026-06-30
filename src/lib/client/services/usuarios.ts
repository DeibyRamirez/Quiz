import type {
  ActualizarUsuario,
  CrearUsuario,
  RolUsuario,
  UsuarioPublico,
} from "@/app/types";
import { apiRequest } from "@/lib/client/api";

export async function listarUsuarios(): Promise<UsuarioPublico[]> {
  return apiRequest<UsuarioPublico[]>("/usuarios");
}

export async function buscarUsuario(
  params: { firebaseUid?: string; correo?: string }
): Promise<UsuarioPublico | null> {
  const query = new URLSearchParams();
  if (params.firebaseUid) query.set("firebaseUid", params.firebaseUid);
  if (params.correo) query.set("correo", params.correo);
  const qs = query.toString();
  if (!qs) return null;
  return apiRequest<UsuarioPublico | null>(`/usuarios?${qs}`);
}

export async function obtenerUsuario(id: string): Promise<UsuarioPublico> {
  return apiRequest<UsuarioPublico>(`/usuarios/${id}`);
}

export async function crearUsuario(datos: CrearUsuario): Promise<UsuarioPublico> {
  return apiRequest<UsuarioPublico>("/usuarios", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}

export async function actualizarUsuario(
  id: string,
  datos: ActualizarUsuario
): Promise<UsuarioPublico> {
  return apiRequest<UsuarioPublico>(`/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(datos),
  });
}

export async function eliminarUsuario(id: string): Promise<void> {
  await apiRequest(`/usuarios/${id}`, { method: "DELETE" });
}

export async function obtenerPerfilActual(
  firebaseUid: string,
  correo?: string | null
): Promise<UsuarioPublico | null> {
  const porUid = await buscarUsuario({ firebaseUid });
  if (porUid) return porUid;
  if (correo) return buscarUsuario({ correo });
  return null;
}

export function usuarioTieneRol(
  usuario: UsuarioPublico,
  roles: RolUsuario[]
): boolean {
  return roles.includes(usuario.rol);
}
