import type { EntidadBase, OmitEntidadPersistida, Timestamps } from "./base";

export enum TipoPregunta {
  MULTIPLE_OPCION = "multiple_opcion",
  VERDADERO_FALSO = "verdadero_falso",
  RESPUESTA_CORTA = "respuesta_corta",
}

export const TIPOS_PREGUNTA = Object.values(TipoPregunta) as TipoPregunta[];

interface PreguntaBase extends EntidadBase, Timestamps {
  texto: string;
  quizId: string;
  puntos: number;
  tiempoLimite: number;
  activa: boolean;
  explicacion?: string;
  tema?: string;
}

export interface PreguntaMultipleOpcion extends PreguntaBase {
  tipo: TipoPregunta.MULTIPLE_OPCION;
  opciones: string[];
  respuestaCorrecta: number | number[];
  permiteMultiples: boolean;
}

export interface PreguntaVerdaderoFalso extends PreguntaBase {
  tipo: TipoPregunta.VERDADERO_FALSO;
  opciones: ["Verdadero", "Falso"];
  respuestaCorrecta: boolean;
}

export interface PreguntaRespuestaCorta extends PreguntaBase {
  tipo: TipoPregunta.RESPUESTA_CORTA;
  respuestaCorrecta: string;
  caseSensitive?: boolean;
  maxLength?: number;
}

export type Pregunta =
  | PreguntaMultipleOpcion
  | PreguntaVerdaderoFalso
  | PreguntaRespuestaCorta;

export type CrearPregunta = OmitEntidadPersistida<Pregunta>;

export type ActualizarPregunta = Partial<CrearPregunta>;

export type PreguntaResumen = Pick<
  Pregunta,
  "id" | "texto" | "tipo" | "puntos" | "tiempoLimite" | "quizId" | "activa"
>;

export function isMultipleOpcion(p: Pregunta): p is PreguntaMultipleOpcion {
  return p.tipo === TipoPregunta.MULTIPLE_OPCION;
}

export function isVerdaderoFalso(p: Pregunta): p is PreguntaVerdaderoFalso {
  return p.tipo === TipoPregunta.VERDADERO_FALSO;
}

export function isRespuestaCorta(p: Pregunta): p is PreguntaRespuestaCorta {
  return (
    p.tipo === TipoPregunta.RESPUESTA_CORTA ||
    (p.tipo as string) === "numerical"
  );
}

export function validarPregunta(pregunta: CrearPregunta | Pregunta): boolean {
  if (!pregunta.texto?.trim()) return false;
  if (!pregunta.quizId?.trim()) return false;
  if (!TIPOS_PREGUNTA.includes(pregunta.tipo)) return false;
  if (pregunta.puntos <= 0 || pregunta.tiempoLimite <= 0) return false;

  switch (pregunta.tipo) {
    case TipoPregunta.MULTIPLE_OPCION:
      if (!pregunta.opciones.length) return false;
      const correctas = Array.isArray(pregunta.respuestaCorrecta)
        ? pregunta.respuestaCorrecta
        : [pregunta.respuestaCorrecta];
      return correctas.every(
        (idx) => idx >= 0 && idx < pregunta.opciones.length
      );

    case TipoPregunta.VERDADERO_FALSO:
      return typeof pregunta.respuestaCorrecta === "boolean";

    case TipoPregunta.RESPUESTA_CORTA:
      const respuestasValidas = Array.isArray(pregunta.respuestaCorrecta)
        ? pregunta.respuestaCorrecta
        : [pregunta.respuestaCorrecta];
      return respuestasValidas.length > 0 && respuestasValidas.every((r) => r.trim());

    default:
      return false;
  }
}

export function verificarRespuesta(
  pregunta: Pregunta,
  respuesta: string | number | boolean
): boolean {
  switch (pregunta.tipo) {
    case TipoPregunta.MULTIPLE_OPCION:
      const correcta = pregunta.respuestaCorrecta;
      if (pregunta.permiteMultiples && Array.isArray(correcta)) {
        const respuestasUser = respuesta as unknown as number[];
        return (
          correcta.length === respuestasUser.length &&
          correcta.every((idx) => respuestasUser.includes(idx))
        );
      }
      return correcta === respuesta;

    case TipoPregunta.VERDADERO_FALSO:
      const esTrue =
        respuesta === true || respuesta === "true" || respuesta === "Verdadero";
      return pregunta.respuestaCorrecta === esTrue;

    case TipoPregunta.RESPUESTA_CORTA:
      const respuestaStr = (respuesta as string).trim();
      const correctas = Array.isArray(pregunta.respuestaCorrecta)
        ? pregunta.respuestaCorrecta
        : [pregunta.respuestaCorrecta];

      if (pregunta.caseSensitive) {
        return correctas.includes(respuestaStr);
      }
      return correctas.some(
        (c) => c.toLowerCase() === respuestaStr.toLowerCase()
      );

    default:
      return false;
  }
}
