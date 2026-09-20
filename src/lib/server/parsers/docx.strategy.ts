import mammoth from "mammoth";
import type { EstrategiaParser } from "./estrategia-parser";

/** Convierte DOCX a markdown limpio mediante mammoth. */
export class DocxStrategy implements EstrategiaParser {
  async extraer(buffer: Buffer): Promise<string> {
    const resultado = await mammoth.convertToMarkdown({ buffer });
    return resultado.value;
  }
}
