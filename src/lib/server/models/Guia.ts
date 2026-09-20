import { Schema, model, models } from "mongoose";

const GuiaSchema = new Schema(
  {
    docenteId: { type: String, required: true, index: true },
    cursoId: { type: String, index: true },
    titulo: { type: String, required: true, trim: true },
    hashArchivo: { type: String, required: true, unique: true, index: true },
    contenidoMarkdown: { type: String, required: true },
    estimacionTokens: { type: Number, required: true },
    creadoEn: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

GuiaSchema.index({ docenteId: 1, creadoEn: -1 });

export const GuiaModel = models.Guia || model("Guia", GuiaSchema);
