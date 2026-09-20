import {
  EXTENSIONES_GUIA_PERMITIDAS,
  MIME_GUIA_PERMITIDOS,
} from "@/lib/server/validators/guia";
import { DocxStrategy } from "./docx.strategy";
import type { EstrategiaParser } from "./estrategia-parser";
import { PdfStrategy } from "./pdf.strategy";

export class ErrorParserNoSoportado extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "ErrorParserNoSoportado";
  }
}

export function obtenerExtension(nombreArchivo: string): string {
  const punto = nombreArchivo.lastIndexOf(".");
  return punto >= 0 ? nombreArchivo.slice(punto).toLowerCase() : "";
}

export function esMimeGuiaPermitido(mime: string): boolean {
  return (MIME_GUIA_PERMITIDOS as readonly string[]).includes(mime);
}

export function esExtensionGuiaPermitida(extension: string): boolean {
  return (EXTENSIONES_GUIA_PERMITIDAS as readonly string[]).includes(
    extension as (typeof EXTENSIONES_GUIA_PERMITIDAS)[number]
  );
}

export function crearEstrategiaParser(
  extension: string,
  mime?: string
): EstrategiaParser {
  const ext = extension.toLowerCase();

  if (ext === ".pdf" || mime === "application/pdf") {
    return new PdfStrategy();
  }

  if (
    ext === ".docx" ||
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return new DocxStrategy();
  }

  throw new ErrorParserNoSoportado(
    `Formato no soportado. Use: ${EXTENSIONES_GUIA_PERMITIDAS.join(", ")}`
  );
}
