/** Umbral para dar por válida una respuesta de desarrollo (0–1). */
export const UMBRAL_SIMILITUD_DESARROLLO = 0.7;

/** Minúsculas, sin tildes ni puntuación, espacios colapsados. */
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bigramas(texto: string): string[] {
  const n = texto.replace(/\s/g, "");
  if (n.length < 2) return n ? [n] : [];
  const pares: string[] = [];
  for (let i = 0; i < n.length - 1; i++) {
    pares.push(n.slice(i, i + 2));
  }
  return pares;
}

/** Coeficiente de Dice sobre bigramas de caracteres. */
export function coeficienteDice(a: string, b: string): number {
  const izq = bigramas(a);
  const der = bigramas(b);
  if (izq.length === 0 && der.length === 0) return 1;
  if (izq.length === 0 || der.length === 0) return 0;

  const conteo = new Map<string, number>();
  for (const g of izq) {
    conteo.set(g, (conteo.get(g) ?? 0) + 1);
  }

  let interseccion = 0;
  for (const g of der) {
    const n = conteo.get(g) ?? 0;
    if (n > 0) {
      interseccion += 1;
      conteo.set(g, n - 1);
    }
  }

  return (2 * interseccion) / (izq.length + der.length);
}

export function similitudTexto(estudiante: string, criterio: string): number {
  const a = normalizarTexto(estudiante);
  const b = normalizarTexto(criterio);
  if (!a || !b) return 0;
  if (a === b) return 1;
  return coeficienteDice(a, b);
}

export function evaluarDesarrollo(
  respuestaEstudiante: string,
  criterioDocente: string,
  umbral: number = UMBRAL_SIMILITUD_DESARROLLO
): { similitud: number; valida: boolean } {
  const similitud = similitudTexto(respuestaEstudiante, criterioDocente);
  return {
    similitud,
    valida: similitud >= umbral,
  };
}
