import { Schema, model, models } from "mongoose";

const JugadorSchema = new Schema(
  {
    userId: { type: String, required: true },
    nombre: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SesionLiveSchema = new Schema(
  {
    pin: { type: String, required: true, unique: true, index: true },
    quizId: { type: String, required: true, index: true },
    docenteId: { type: String, required: true, index: true },
    sessionName: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: ["lobby", "active", "ended"],
      default: "lobby",
    },
    currentQuestion: { type: Number, default: 0 },
    qScheduledAt: { type: Date, default: null },
    qTimeLimitSec: { type: Number, default: 30 },
    players: { type: [JugadorSchema], default: [] },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    creadoEn: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

SesionLiveSchema.index({ quizId: 1, creadoEn: -1 });

export const SesionLiveModel =
  models.SesionLive || model("SesionLive", SesionLiveSchema);
