import type { RolUsuario, UsuarioPublico } from "@/app/types";
import { correoEsInstitucional } from "@/lib/correo-institucional";
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

export async function iniciarSesionConGoogle(): Promise<UsuarioPublico> {
  const { auth, provider, signInWithPopup, signOut } = await import(
    "@/lib/client/firebase"
  );

  let resultado;
  try {
    resultado = await signInWithPopup(auth, provider);
  } catch (e) {
    const codigo =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code?: string }).code)
        : "";

    if (
      codigo === "auth/popup-closed-by-user" ||
      codigo === "auth/cancelled-popup-request"
    ) {
      throw new Error("Inicio de sesión con Google cancelado.");
    }

    throw e instanceof Error
      ? e
      : new Error("No se pudo iniciar sesión con Google.");
  }

  const correo = resultado.user.email;

  if (!correo || !correoEsInstitucional(correo)) {
    await signOut(auth);
    throw new Error("Solo se permiten cuentas @uniautonoma.edu.co");
  }

  const idToken = await resultado.user.getIdToken();
  const data = await apiRequest<{ usuario: UsuarioPublico }>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });

  return data.usuario;
}

export async function cerrarSesion(): Promise<void> {
  await apiRequest("/auth/logout", { method: "POST" });

  try {
    const { auth, signOut } = await import("@/lib/client/firebase");
    await signOut(auth);
  } catch {
    /* Firebase puede no estar inicializado */
  }
}

export function redirigirPorRol(rol: RolUsuario, router: { push: (path: string) => void }) {
  if (rol === "estudiante") router.push("/student");
  else if (rol === "admin") router.push("/administrador");
  else if (rol === "docente") router.push("/teacher");
  else router.push("/student");
}
