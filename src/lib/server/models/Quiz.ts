import { Schema, model, models } from "mongoose";
import { EstadoQuiz } from "@/app/types/quiz";
import { OrigenGeneracion } from "@/app/types/quiz-ia";

const QuizSchema = new Schema(
  {
    autorId: { type: String, required: true, index: true },
    titulo: { type: String, required: true, trim: true },
    descripcion: { type: String, default: "", trim: true },
    estado: {
      type: String,
      enum: Object.values(EstadoQuiz),
      default: EstadoQuiz.BORRADOR,
    },
    guiaId: { type: Schema.Types.ObjectId, ref: "Guia", index: true },
    version: { type: Number, default: 1 },
    configGeneracion: {
      type: {
        totalPreguntas: Number,
        distribucion: Schema.Types.Mixed,
      },
      required: false,
    },
    origenGeneracion: {
      type: String,
      enum: Object.values(OrigenGeneracion),
      default: OrigenGeneracion.MANUAL,
    },
    creadoEn: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

QuizSchema.index({ autorId: 1, creadoEn: -1 });

export const QuizModel = models.Quiz || model("Quiz", QuizSchema);
