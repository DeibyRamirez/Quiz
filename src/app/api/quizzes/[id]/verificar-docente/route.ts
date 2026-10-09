import { NextResponse } from "next/server";
import { EstadoQuiz } from "@/app/types/quiz";
import { RolUsuario } from "@/app/types/usuario";
import { AuthError, requerirAccesoDocente } from "@/lib/server/auth/requerir-auth";
import { conectarDB } from "@/lib/server/database";
import { PreguntaModel } from "@/lib/server/models/Pregunta";
import { QuizModel } from "@/lib/server/models/Quiz";
import { validarPreguntaPersistida } from "@/lib/server/validators/pregunta";
import { manejarErrorApi, respuestaError } from "@/lib/server/utils/api-response";
import { serializarDocumento } from "@/lib/server/utils/serializar";
import { esQuizGeneradoConIa } from "@/lib/server/utils/quiz-ia";

type Params = { params: { id: string } };

export async function POST(_request: Request, { params }: Params) {
  try {
    const payload = await requerirAccesoDocente();
    await conectarDB();

    const quiz = await QuizModel.findById(params.id).lean();
    if (!quiz) {
      return respuestaError("Quiz no encontrado", 404);
    }

    const esAdmin = payload.rol === RolUsuario.ADMINISTRADOR;
    if (!esAdmin && quiz.autorId !== payload.sub) {
      return respuestaError("No autorizado para este quiz", 403);
    }

    const preguntas = await PreguntaModel.find({
      quizId: params.id,
      activa: true,
    })
      .sort({ creadoEn: 1 })
      .lean();

    if (preguntas.length === 0) {
      return respuestaError("El quiz no tiene preguntas activas", 400);
    }

    const errores: {
      preguntaId: string;
      indice: number;
      textoCorto: string;
      mensaje: string;
    }[] = [];

    const quizEsIa = esQuizGeneradoConIa(quiz);

    preguntas.forEach((p, index) => {
      const id = String(p._id);
      const texto = String(p.texto ?? "").trim();
      const textoCorto = texto.length > 80 ? `${texto.slice(0, 80)}…` : texto;

      if (quizEsIa && !p.revisadaPorDocente) {
        errores.push({
          preguntaId: id,
          indice: index + 1,
          textoCorto,
          mensaje: "Aún no revisada por el docente (usa Actualizar pregunta)",
        });
        return;
      }

      const resultado = validarPreguntaPersistida(p as Record<string, unknown>);
      if (!resultado.valida) {
        errores.push({
          preguntaId: id,
          indice: index + 1,
          textoCorto,
          mensaje: resultado.mensaje ?? "Pregunta inválida",
        });
      }
    });

    if (errores.length > 0) {
      return respuestaError(
        "Hay preguntas con respuestas inválidas o incompletas",
        422,
        { errores }
      );
    }

    const actualizado = await QuizModel.findByIdAndUpdate(
      params.id,
      { $set: { estado: EstadoQuiz.PUBLICADO } },
      { new: true }
    ).lean();

    if (!actualizado) {
      return respuestaError("Quiz no encontrado", 404);
    }

    return NextResponse.json({
      ...serializarDocumento(actualizado),
      preguntasValidadas: preguntas.length,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return respuestaError(error.message, error.status);
    }
    return manejarErrorApi(error);
  }
}
