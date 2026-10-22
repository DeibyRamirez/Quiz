/**
 * Comprueba, sin base de datos, que la clave no viaja en el JSON público
 * y que un timeLeft forjado no cambia el puntaje.
 *
 *   npx tsx scripts/verificar-seguridad-logica.ts
 */
import { TipoPregunta, type Pregunta } from "../src/app/types/pregunta";
import { preguntaApiToUi } from "../src/lib/client/mappers/pregunta-ui";
import { ocultarRespuestasPregunta } from "../src/lib/server/services/visibilidad-pregunta";
import {
  evaluarRelojPregunta,
  puntosPorTiempo,
} from "../src/lib/server/services/tiempo-sesion";

function assert(cond: unknown, mensaje: string) {
  if (!cond) {
    console.error("FALLO:", mensaje);
    process.exitCode = 1;
  } else {
    console.log("ok:", mensaje);
  }
}

const publica = ocultarRespuestasPregunta({
  id: "p1",
  texto: "¿Ley de Coulomb?",
  tipo: "multiple_opcion",
  opciones: ["Al cuadrado", "Lineal"],
  respuestaCorrecta: 0,
  permiteMultiples: true,
  explicacion: "La fuerza cae con el cuadrado de la distancia",
  criteriosEvaluacion: "Al cuadrado",
  puntos: 1000,
  tiempoLimite: 30,
});

const json = JSON.stringify(publica);
assert(!("respuestaCorrecta" in publica), "el JSON público no tiene respuestaCorrecta");
assert(!("explicacion" in publica), "el JSON público no tiene explicacion");
assert(!("criteriosEvaluacion" in publica), "el JSON público no tiene criteriosEvaluacion");
assert(publica.permiteMultiples === true, "se conserva permiteMultiples (única vs múltiple)");
assert(!json.includes("respuestaCorrecta"), "la clave no aparece serializada");
assert(!json.includes("cuadrado de la distancia"), "la explicación no aparece serializada");

const sinClave = preguntaApiToUi({
  id: "p1",
  quizId: "q1",
  texto: "¿Ley de Coulomb?",
  tipo: TipoPregunta.MULTIPLE_OPCION,
  opciones: ["Al cuadrado", "Lineal"],
  permiteMultiples: true,
  puntos: 1000,
  tiempoLimite: 30,
  activa: true,
} as Pregunta);

const marcadas = (sinClave.options ?? []).filter((o) => o.isCorrect).length;
assert(marcadas === 0, "sin clave, el cliente no marca ninguna opción como correcta");
assert(sinClave.correctOption === undefined, "sin clave, no se inventa correctOption");
assert(sinClave.permiteMultiples === true, "el cliente sigue sabiendo que es múltiple");

const vf = preguntaApiToUi({
  id: "p2",
  quizId: "q1",
  texto: "¿Verdadero?",
  tipo: TipoPregunta.VERDADERO_FALSO,
  opciones: ["Verdadero", "Falso"],
  puntos: 1000,
  tiempoLimite: 20,
  activa: true,
} as Pregunta);
assert(vf.correctOption === undefined, "verdadero/falso sin clave no elige Falso por defecto");

const ahora = 1_700_000_000_000;
const inicio = new Date(ahora - 29_000);
const reloj = evaluarRelojPregunta(inicio, 30, ahora);
assert(reloj.estado === "abierta", "a 29 s la pregunta sigue abierta");
assert(reloj.timeLeft === 1, "el servidor calcula 1 s, no el timeLeft del cliente");

const forjado = puntosPorTiempo(true, 30, 30, 1000);
const real = puntosPorTiempo(true, reloj.timeLeft, reloj.timeLimit, 1000);
assert(forjado === 1000, "un timeLeft forjado de 30 valdría 1000 pts");
assert(real === 33, "con el reloj del servidor la misma respuesta vale 33 pts");
assert(forjado !== real, "el timeLeft forjado ya no determina el puntaje");

const tarde = evaluarRelojPregunta(new Date(ahora - 30_000), 30, ahora);
assert(tarde.estado === "tarde", "a los 30 s la respuesta se rechaza por tarde");

if (process.exitCode) {
  console.error("\nHay comprobaciones fallidas.");
} else {
  console.log("\nSeguridad y lógica: comprobaciones en verde.");
}
