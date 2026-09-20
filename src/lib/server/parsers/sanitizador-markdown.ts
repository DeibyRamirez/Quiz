/**
 * Limpia ruido tabular y whitespace repetitivo del markdown extraído.
 */
export function sanitizarMarkdown(texto: string): string {
  let resultado = texto;

  // Normalizar saltos de línea
  resultado = resultado.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Colapsar espacios múltiples en la misma línea
  resultado = resultado.replace(/[^\S\n]+/g, " ");

  // Eliminar líneas vacías consecutivas (máx. 2 saltos)
  resultado = resultado.replace(/\n{3,}/g, "\n\n");

  // Eliminar headers/pies repetitivos comunes en PDFs académicos
  resultado = resultado.replace(/^(Página|Página|Page)\s+\d+\s*(de|of)\s+\d+\s*$/gim, "");
  resultado = resultado.replace(/^\d+\s*$/gm, "");

  // Reducir tablas ruidosas: líneas con muchos separadores tabulares
  resultado = resultado
    .split("\n")
    .filter((linea) => {
      const tabs = (linea.match(/\t/g) ?? []).length;
      return tabs < 8;
    })
    .join("\n");

  // Trim final
  return resultado.trim();
}

/** Estima tokens a partir de longitud de caracteres. */
export function estimarTokens(texto: string): number {
  return Math.ceil(texto.length / 3.8);
}

/**
 * Trunca markdown por secciones semánticas (headers ##) para optimizar payload IA.
 */
export function truncarMarkdownPorSecciones(
  markdown: string,
  maxTokens: number
): string {
  if (estimarTokens(markdown) <= maxTokens) {
    return markdown;
  }

  const secciones = markdown.split(/(?=^#{1,3}\s)/m);
  let acumulado = "";
  const limiteCaracteres = maxTokens * 3.8;

  for (const seccion of secciones) {
    if ((acumulado + seccion).length > limiteCaracteres) {
      break;
    }
    acumulado += seccion;
  }

  return acumulado.trim() || markdown.slice(0, Math.floor(limiteCaracteres));
}
