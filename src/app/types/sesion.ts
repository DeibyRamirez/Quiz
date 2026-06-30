export type EstadoSesion = "lobby" | "active" | "ended";

export interface JugadorSesion {
  userId: string;
  nombre: string;
  joinedAt: string;
  lastSeenAt: string;
}

export interface SesionLive {
  id: string;
  pin: string;
  quizId: string;
  docenteId: string;
  sessionName: string;
  status: EstadoSesion;
  currentQuestion: number;
  qScheduledAt: string | null;
  qTimeLimitSec: number;
  players: JugadorSesion[];
  startedAt: string | null;
  endedAt: string | null;
  creadoEn: string;
  /** Timestamp del servidor (ms) para sincronizar timers */
  serverTime?: number;
}

export interface RespuestaParticipante {
  questionId: string;
  question: string;
  answerId: string;
  answerText: string;
  correctOptionId: string | null;
  correct: boolean;
  answeredAt: string;
  timeLeft: number;
  pointsEarned: number;
  questionIndex: number;
}

export interface ParticipanteSesion {
  id: string;
  sesionPin: string;
  userId: string;
  playerName: string;
  sessionName: string;
  quizId: string;
  totalScore: number;
  answers: RespuestaParticipante[];
  lastUpdated: string;
}

export interface ResultadoQuizParticipante {
  userId: string;
  sessionId: string;
  sessionName: string;
  playerName: string;
  totalScore: number;
  answers: RespuestaParticipante[];
}

export interface ResultadosQuiz {
  quizId: string;
  sessionGroups: Array<{
    name: string;
    sessionIds: string[];
    playerCount: number;
  }>;
  participantes: ResultadoQuizParticipante[];
}

export interface ProgresoEstudiante {
  totalScore: number;
  answers: RespuestaParticipante[];
  answeredQuestionIds: string[];
  answeredCurrentQuestion: boolean;
  currentQuestionAnswer: RespuestaParticipante | null;
}
