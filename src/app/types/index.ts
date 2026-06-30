export type { EntidadBase, Timestamps } from "./base";

export {
  RolUsuario,
  ROLES_USUARIO,
  isEstudiante,
  isDocente,
  isAdministrador,
  puedeAccederRutas,
  validarUsuario,
} from "./usuario";
export type {
  Usuario,
  UsuarioPublico,
  CrearUsuario,
  ActualizarUsuario,
} from "./usuario";

export {
  EstadoQuiz,
  ESTADOS_QUIZ,
  isQuizPublicado,
  validarQuiz,
  puedeIniciarSesion,
} from "./quiz";
export type {
  Quiz,
  QuizBase,
  QuizConPreguntas,
  CrearQuiz,
  ActualizarQuiz,
} from "./quiz";

export {
  TipoPregunta,
  TIPOS_PREGUNTA,
  isMultipleOpcion,
  isVerdaderoFalso,
  isRespuestaCorta,
  validarPregunta,
  verificarRespuesta,
} from "./pregunta";
export type {
  Pregunta,
  PreguntaMultipleOpcion,
  PreguntaVerdaderoFalso,
  PreguntaRespuestaCorta,
  CrearPregunta,
  ActualizarPregunta,
  PreguntaResumen,
} from "./pregunta";
