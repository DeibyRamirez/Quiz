import { Schema, model, models } from "mongoose";
import { EstadoQuiz } from "@/app/types/quiz";

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
    creadoEn: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

QuizSchema.index({ autorId: 1, creadoEn: -1 });

export const QuizModel = models.Quiz || model("Quiz", QuizSchema);
