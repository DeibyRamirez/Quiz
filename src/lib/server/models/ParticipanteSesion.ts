import { Schema, model, models } from "mongoose";

const RespuestaSchema = new Schema(
  {
    questionId: { type: String, required: true },
    question: { type: String, default: "" },
    answerId: { type: String, required: true },
    answerText: { type: String, default: "" },
    correctOptionId: { type: String, default: null },
    correct: { type: Boolean, default: false },
    answeredAt: { type: Date, default: Date.now },
    timeLeft: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },
    questionIndex: { type: Number, default: 0 },
  },
  { _id: false }
);

const ParticipanteSesionSchema = new Schema(
  {
    sesionPin: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    playerName: { type: String, required: true },
    sessionName: { type: String, default: "" },
    quizId: { type: String, required: true, index: true },
    totalScore: { type: Number, default: 0 },
    answers: { type: [RespuestaSchema], default: [] },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

ParticipanteSesionSchema.index({ sesionPin: 1, userId: 1 }, { unique: true });
ParticipanteSesionSchema.index({ quizId: 1 });

export const ParticipanteSesionModel =
  models.ParticipanteSesion ||
  model("ParticipanteSesion", ParticipanteSesionSchema);
