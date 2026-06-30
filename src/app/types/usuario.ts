import type { EntidadBase, OmitEntidadPersistida, Timestamps } from "./base";

// Alineado con Firebase Auth + ProtectedRoute del frontend actual
export enum RolUsuario {
  ESTUDIANTE = "estudiante",
  DOCENTE = "docente",
  ADMINISTRADOR = "admin",
}

export const ROLES_USUARIO = Object.values(RolUsuario) as RolUsuario[];

export interface Usuario extends EntidadBase, Timestamps {
  nombre: string;
  correo: string;
  rol: RolUsuario;
  /** UID de Firebase cuando el perfil viene de Google OAuth */
  firebaseUid?: string;
  contraseña?: string;
}

/** Respuesta de API / UI: nunca incluye contraseña */
export type UsuarioPublico = Omit<Usuario, "contraseña">;

export type CrearUsuario = OmitEntidadPersistida<Usuario> & {
  nombre: string;
  correo: string;
  rol?: RolUsuario;
  contraseña?: string;
  firebaseUid?: string;
};

export type ActualizarUsuario = Partial<CrearUsuario>;

export function isEstudiante(usuario: Pick<Usuario, "rol">): boolean {
  return usuario.rol === RolUsuario.ESTUDIANTE;
}

export function isDocente(usuario: Pick<Usuario, "rol">): boolean {
  return usuario.rol === RolUsuario.DOCENTE;
}

export function isAdministrador(usuario: Pick<Usuario, "rol">): boolean {
  return usuario.rol === RolUsuario.ADMINISTRADOR;
}

export function puedeAccederRutas(
  usuario: Pick<Usuario, "rol">,
  rolesPermitidos: RolUsuario[]
): boolean {
  return rolesPermitidos.includes(usuario.rol);
}

export function validarUsuario(usuario: CrearUsuario | Usuario): boolean {
  if (!usuario.nombre?.trim()) return false;
  if (!usuario.correo?.trim()) return false;
  if (usuario.rol && !ROLES_USUARIO.includes(usuario.rol)) return false;
  if (
    "contraseña" in usuario &&
    usuario.contraseña !== undefined &&
    usuario.contraseña.length < 6
  ) {
    return false;
  }
  return true;
}
