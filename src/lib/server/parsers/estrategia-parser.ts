/** Contrato para estrategias de extracción de texto desde archivos binarios. */
export interface EstrategiaParser {
  extraer(buffer: Buffer): Promise<string>;
}
