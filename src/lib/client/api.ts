export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public detalles?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function normalizarBasePath(input?: string | null): string {
  const value = (input ?? "").trim();
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function obtenerApiPorDefecto(): string {
  const basePath = normalizarBasePath(process.env.NEXT_PUBLIC_BASE_PATH);
  return basePath ? `${basePath}/api` : "/api";
}

function obtenerBaseUrlApi() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()?.replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    // Acepta rutas relativas para montar Quiz detrás de un prefijo interno (ej. /quiz-app/api).
    if (configured?.startsWith("/")) {
      return configured;
    }

    // Monolito: si la API configurada no coincide con el host actual, usar misma origin.
    if (configured) {
      try {
        if (new URL(configured).origin === window.location.origin) {
          return configured;
        }
      } catch {
        /* URL inválida; caer al default relativo */
      }
    }
    return obtenerApiPorDefecto();
  }

  if (configured) return configured;
  return `http://127.0.0.1:${process.env.PORT ?? "3000"}${obtenerApiPorDefecto()}`;
}

export function contruirUrlApi(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const [pathname, query = ""] = normalizedPath.split("?", 2);
  const pathWithSlash = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const withSlash = query ? `${pathWithSlash}?${query}` : pathWithSlash;
  return `${obtenerBaseUrlApi()}${withSlash}`;
}

async function parseError(response: Response) {
  try {
    const body = await response.json();
    return body?.error ?? response.statusText;
  } catch {
    return response.statusText;
  }
}

export async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = contruirUrlApi(path);
  const response = await fetch(url, {
    ...options,
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let mensaje = await parseError(response);
    let detalles: unknown;
    try {
      const clone = response.clone();
      const body = await clone.json();
      mensaje = body?.error ?? mensaje;
      detalles = body?.detalles;
    } catch {
      /* ignore */
    }
    throw new ApiError(mensaje, response.status, detalles);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function obtenerJsonSeguro<T>(path: string): Promise<T | null> {
  try {
    return await apiRequest<T>(path);
  } catch (error) {
    console.error(`Error al consultar ${contruirUrlApi(path)}:`, error);
    return null;
  }
}
