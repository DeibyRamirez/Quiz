import path from "node:path";
import { pathToFileURL } from "node:url";
import type { EstrategiaParser } from "./estrategia-parser";

function resolverRutaWorkerPdf(): string {
  const rutaAbsoluta = path.join(
    process.cwd(),
    "node_modules",
    "pdfjs-dist",
    "legacy",
    "build",
    "pdf.worker.mjs"
  );
  return pathToFileURL(rutaAbsoluta).href;
}

/**
 * Extrae texto de PDFs con pdfjs-dist en Node.
 * El worker se apunta a node_modules: Next no debe empaquetar esta librería.
 */
export class PdfStrategy implements EstrategiaParser {
  async extraer(buffer: Buffer): Promise<string> {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

    pdfjs.GlobalWorkerOptions.workerSrc = resolverRutaWorkerPdf();

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      useSystemFonts: true,
      disableFontFace: true,
    });

    const documento = await loadingTask.promise;
    const paginas: string[] = [];

    for (let i = 1; i <= documento.numPages; i++) {
      const pagina = await documento.getPage(i);
      const contenido = await pagina.getTextContent();
      const textoPagina = contenido.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      paginas.push(textoPagina);
    }

    return paginas.join("\n\n");
  }
}
