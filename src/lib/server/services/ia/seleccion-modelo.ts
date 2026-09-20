const MODELO_FLASH = process.env.GEMINI_MODEL_FLASH ?? "gemini-3.5-flash-lite";
const MODELO_PRO = process.env.GEMINI_MODEL_PRO ?? "gemini-2.5-pro";
const UMBRAL_PRO = Number(process.env.GEMINI_TOKEN_UMBRAL_PRO ?? 12000);

/** Selecciona el modelo según complejidad estimada del documento. */
export function seleccionarModelo(estimacionTokens: number): string {
  return estimacionTokens > UMBRAL_PRO ? MODELO_PRO : MODELO_FLASH;
}

export function obtenerConfigModelos() {
  return {
    flash: MODELO_FLASH,
    pro: MODELO_PRO,
    umbralPro: UMBRAL_PRO,
  };
}
