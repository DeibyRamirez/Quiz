import { EstadoQuiz } from "@/app/types/quiz";
import { OrigenGeneracion } from "@/app/types/quiz-ia";
import type {
  ConfigGeneracion,
  ResultadoGeneracionQuiz,
  ResultadoRefinamientoQuiz,
} from "@/app/types/quiz-ia";
import {
  preguntasIaToCrearPreguntas,
  preguntasToEstadoCompacto,
} from "@/lib/server/mappers/pregunta-ia";
import { GuiaModel } from "@/lib/server/models/Guia";
import { PreguntaModel } from "@/lib/server/models/Pregunta";
import { QuizModel } from "@/lib/server/models/Quiz";
import { truncarMarkdownPorSecciones } from "@/lib/server/parsers/sanitizador-markdown";
import { generarQuizConIa } from "@/lib/server/services/ia/cliente-gemini";
import { seleccionarModelo } from "@/lib/server/services/ia/seleccion-modelo";
import { GuiaService } from "@/lib/server/services/guia.service";
import { serializarDocumentos } from "@/lib/server/utils/serializar";
import type { Pregunta } from "@/app/types/pregunta";

export class ErrorQuizIa extends Error {
  constructor(
    message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = "ErrorQuizIa";
  }
}

const MAX_TOKENS_GUIA_PAYLOAD = Number(
  process.env.GEMINI_TOKEN_UMBRAL_PRO ?? 12000
);
const CARACTERES_LOG_EXCERPT = 1000;

function recortarParaLog(texto: string): string {
  if (texto.length <= CARACTERES_LOG_EXCERPT) {
    return texto;
  }
  return `${texto.slice(0, CARACTERES_LOG_EXCERPT)}\n… [recorte: ${texto.length} caracteres en total]`;
}

export class QuizIaService {
  static async generar(params: {
    guiaId: string;
    titulo: string;
    config: ConfigGeneracion;
    docenteId: string;
  }): Promise<ResultadoGeneracionQuiz> {
    const { guiaId, titulo, config, docenteId } = params;

    const guia = await GuiaService.obtenerPorId(guiaId, docenteId);

    const markdownTruncado = truncarMarkdownPorSecciones(
      guia.contenidoMarkdown,
      MAX_TOKENS_GUIA_PAYLOAD
    );

    const modelo = seleccionarModelo(guia.estimacionTokens);

    console.log("[QuizIaService] Excerpt enviado a Gemini (crear)", {
      guiaId,
      tituloGuia: guia.titulo,
      modelo,
      estimacionTokensGuia: guia.estimacionTokens,
      caracteresExcerpt: markdownTruncado.length,
      recorte: recortarParaLog(markdownTruncado),
    });

    const distribucionApi: Record<string, number> = {};
    for (const [tipo, cantidad] of Object.entries(config.distribucion)) {
      if (cantidad && cantidad > 0) {
        distribucionApi[tipo] = cantidad;
      }
    }

    const quizGenerado = await generarQuizConIa(
      {
        mode: "create",
        guide_excerpt: markdownTruncado,
        config: {
          totalQuestions: config.totalPreguntas,
          distribution: distribucionApi,
        },
      },
      modelo
    );

    const quiz = await QuizModel.create({
      autorId: docenteId,
      titulo: titulo.trim() || quizGenerado.title,
      descripcion: `Generado con IA desde guía: ${guia.titulo}`,
      estado: EstadoQuiz.BORRADOR,
      guiaId: guia._id,
      version: 1,
      configGeneracion: config,
      origenGeneracion: OrigenGeneracion.IA,
    });

    const quizId = String(quiz._id);
    const crearPreguntas = preguntasIaToCrearPreguntas(
      quizGenerado.questions,
      quizId
    );

    const preguntasInsertadas = await PreguntaModel.insertMany(crearPreguntas);

    return {
      quizId,
      titulo: quiz.titulo,
      version: quiz.version ?? 1,
      preguntas: serializarDocumentos(
        preguntasInsertadas.map((p) => p.toObject())
      ) as Pregunta[],
    };
  }

  static async refinar(params: {
    quizId: string;
    teacherInstruction: string;
    docenteId: string;
  }): Promise<ResultadoRefinamientoQuiz> {
    const { quizId, teacherInstruction, docenteId } = params;

    const quiz = await QuizModel.findById(quizId).lean();
    if (!quiz) {
      throw new ErrorQuizIa("Quiz no encontrado", 404);
    }
    if (quiz.autorId !== docenteId) {
      throw new ErrorQuizIa("No autorizado para refinar este quiz", 403);
    }
    if (!quiz.guiaId) {
      throw new ErrorQuizIa(
        "Este quiz no fue generado con IA y no puede refinarse automáticamente.",
        400
      );
    }

    const guia = await GuiaModel.findById(quiz.guiaId).lean();
    if (!guia) {
      throw new ErrorQuizIa("Guía asociada no encontrada", 404);
    }

    const preguntasActivas = await PreguntaModel.find({
      quizId,
      activa: true,
    })
      .sort({ creadoEn: 1 })
      .lean();

    const estadoCompacto = preguntasToEstadoCompacto(preguntasActivas);
    const markdownTruncado = truncarMarkdownPorSecciones(
      guia.contenidoMarkdown,
      MAX_TOKENS_GUIA_PAYLOAD
    );

    const modelo = seleccionarModelo(guia.estimacionTokens);

    const config = quiz.configGeneracion ?? {
      totalPreguntas: preguntasActivas.length,
      distribucion: {},
    };

    const distribucionApi: Record<string, number> = {};
    for (const [tipo, cantidad] of Object.entries(config.distribucion ?? {})) {
      if (cantidad && cantidad > 0) {
        distribucionApi[tipo] = cantidad;
      }
    }

    const quizRefinado = await generarQuizConIa(
      {
        mode: "refine",
        guide_excerpt: markdownTruncado,
        config: {
          totalQuestions: config.totalPreguntas,
          distribution: distribucionApi,
        },
        current_state: estadoCompacto,
        teacherInstruction,
      },
      modelo
    );

    await PreguntaModel.updateMany({ quizId, activa: true }, { activa: false });

    const crearPreguntas = preguntasIaToCrearPreguntas(
      quizRefinado.questions,
      quizId
    );
    const nuevasPreguntas = await PreguntaModel.insertMany(crearPreguntas);

    const nuevaVersion = (quiz.version ?? 1) + 1;
    await QuizModel.findByIdAndUpdate(quizId, {
      version: nuevaVersion,
      titulo: quizRefinado.title || quiz.titulo,
    });

    return {
      quizId,
      titulo: quizRefinado.title || quiz.titulo,
      version: nuevaVersion,
      preguntas: serializarDocumentos(
        nuevasPreguntas.map((p) => p.toObject())
      ) as Pregunta[],
    };
  }
}
