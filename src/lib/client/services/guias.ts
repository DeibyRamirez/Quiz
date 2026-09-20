import { contruirUrlApi, ApiError } from "@/lib/client/api";
import type { ResultadoSubidaGuia } from "@/app/types/guia";

export interface RespuestaSubidaGuiaApi {
  guideId: string;
  titulo: string;
  tokenEstimate: number;
  cached: boolean;
}

export async function subirGuia(formData: FormData): Promise<ResultadoSubidaGuia> {
  const url = contruirUrlApi("/v1/guides/upload");
  const response = await fetch(url, {
    method: "POST",
    body: formData,
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    let mensaje = response.statusText;
    try {
      const body = await response.json();
      mensaje = body?.error ?? mensaje;
    } catch {
      /* ignore */
    }
    throw new ApiError(mensaje, response.status);
  }

  const data = (await response.json()) as RespuestaSubidaGuiaApi;

  return {
    guiaId: data.guideId,
    titulo: data.titulo,
    estimacionTokens: data.tokenEstimate,
    enCache: data.cached,
  };
}
