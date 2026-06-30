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

const DEFAULT_API_URL = `http://localhost:${process.env.PORT ?? "3000"}/api`;

function obtenerBaseUrlApi() {
  return (process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, "");
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
