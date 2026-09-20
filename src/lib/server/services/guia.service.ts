import crypto from "crypto";
import { GuiaModel } from "@/lib/server/models/Guia";
import {
  crearEstrategiaParser,
  esExtensionGuiaPermitida,
  esMimeGuiaPermitido,
  obtenerExtension,
} from "@/lib/server/parsers/fabrica-parser";
import {
  estimarTokens,
  sanitizarMarkdown,
} from "@/lib/server/parsers/sanitizador-markdown";
import type { ResultadoSubidaGuia } from "@/app/types/guia";

const MAX_UPLOAD_MB = Number(process.env.GEMINI_MAX_UPLOAD_MB ?? 10);
const CARACTERES_LOG_EXTRACCION = 1000;

function recortarParaLog(texto: string): string {
  if (texto.length <= CARACTERES_LOG_EXTRACCION) {
    return texto;
  }
  return `${texto.slice(0, CARACTERES_LOG_EXTRACCION)}\n… [recorte: ${texto.length} caracteres en total]`;
}

export class ErrorGuia extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "ErrorGuia";
  }
}

export class GuiaService {
  static calcularHash(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  static async subirYProcesar(params: {
    buffer: Buffer;
    nombreArchivo: string;
    mimeType: string;
    docenteId: string;
    cursoId?: string;
    titulo?: string;
  }): Promise<ResultadoSubidaGuia> {
    const { buffer, nombreArchivo, mimeType, docenteId, cursoId, titulo } =
      params;

    const maxBytes = MAX_UPLOAD_MB * 1024 * 1024;
    if (buffer.length > maxBytes) {
      throw new ErrorGuia(
        `El archivo supera el límite de ${MAX_UPLOAD_MB} MB`,
        413
      );
    }

    const extension = obtenerExtension(nombreArchivo);
    if (!esExtensionGuiaPermitida(extension) && !esMimeGuiaPermitido(mimeType)) {
      throw new ErrorGuia(
        "Formato no soportado. Solo se permiten archivos PDF y DOCX.",
        415
      );
    }

    const hashArchivo = this.calcularHash(buffer);

    const existente = await GuiaModel.findOne({ hashArchivo }).lean();
    if (existente) {
      return {
        guiaId: String(existente._id),
        titulo: existente.titulo,
        estimacionTokens: existente.estimacionTokens,
        enCache: true,
      };
    }

    const estrategia = crearEstrategiaParser(extension, mimeType);
    let textoCrudo: string;
    try {
      textoCrudo = await estrategia.extraer(buffer);
    } catch (error) {
      if (error instanceof ErrorGuia) throw error;
      throw new ErrorGuia(
        "No se pudo extraer el contenido del archivo. Prueba con otro PDF o un DOCX.",
        422
      );
    }
    const contenidoMarkdown = sanitizarMarkdown(textoCrudo);

    if (!contenidoMarkdown.trim()) {
      throw new ErrorGuia(
        "No se pudo extraer contenido legible del archivo.",
        422
      );
    }

    const estimacionTokens = estimarTokens(contenidoMarkdown);
    const tituloFinal =
      titulo?.trim() ||
      nombreArchivo.replace(/\.(pdf|docx)$/i, "") ||
      "Guía sin título";

    console.log("[GuiaService] Extracción sanitizada", {
      titulo: tituloFinal,
      nombreArchivo,
      estimacionTokens,
      caracteres: contenidoMarkdown.length,
      recorte: recortarParaLog(contenidoMarkdown),
    });

    const guia = await GuiaModel.create({
      docenteId,
      cursoId: cursoId?.trim() || undefined,
      titulo: tituloFinal,
      hashArchivo,
      contenidoMarkdown,
      estimacionTokens,
    });

    return {
      guiaId: String(guia._id),
      titulo: guia.titulo,
      estimacionTokens: guia.estimacionTokens,
      enCache: false,
    };
  }

  static async obtenerPorId(guiaId: string, docenteId: string) {
    const guia = await GuiaModel.findById(guiaId).lean();
    if (!guia) {
      throw new ErrorGuia("Guía no encontrada", 404);
    }
    if (guia.docenteId !== docenteId) {
      throw new ErrorGuia("No autorizado para acceder a esta guía", 403);
    }
    return guia;
  }
}
