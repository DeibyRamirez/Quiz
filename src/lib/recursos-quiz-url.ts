function prefijoBasePath(): string {
  const value = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim();
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

/** URL pública para servir imágenes guardadas en `recursos-quiz/` (sin dependencias de Node). */
export function urlPublicaImagenReferencia(
  imagenReferencia?: string | null,
  version?: string | number
): string | undefined {
  if (!imagenReferencia?.trim()) return undefined;
  const path = imagenReferencia.replace(/^recursos-quiz\//, "");
  const base = `${prefijoBasePath()}/api/recursos-quiz/${path}`;
  if (version === undefined || version === null || version === "") return base;
  return `${base}?v=${encodeURIComponent(String(version))}`;
}
