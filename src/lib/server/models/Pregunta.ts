import { Schema, model, models } from "mongoose";
import { TipoPregunta } from "@/app/types/pregunta";

const PreguntaSchema = new Schema(
  {
    texto: { type: String, required: true, trim: true },
    tipo: {
      type: String,
      enum: [...Object.values(TipoPregunta), "numerical"],
      required: true,
    },
    opciones: { type: [String], default: [] },
    respuestaCorrecta: { type: Schema.Types.Mixed, required: true },
    permiteMultiples: { type: Boolean, default: false },
    caseSensitive: { type: Boolean, default: false },
    maxLength: { type: Number },
    puntos: { type: Number, default: 10 },
    tiempoLimite: { type: Number, default: 30 },
    explicacion: { type: String },
    tema: { type: String },
    quizId: { type: String, required: true, index: true },
    activa: { type: Boolean, default: true },
    creadoEn: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

PreguntaSchema.index({ quizId: 1, activa: 1 });
PreguntaSchema.index({ tema: 1 });

export const PreguntaModel =
  models.Pregunta || model("Pregunta", PreguntaSchema);
