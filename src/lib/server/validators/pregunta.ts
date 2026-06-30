import { z } from "zod";
import { TipoPregunta } from "@/app/types/pregunta";

const preguntaBaseSchema = z.object({
  texto: z.string().trim().min(1, "El texto es obligatorio"),
  puntos: z.number().int().positive().default(10),
  tiempoLimite: z.number().int().positive().default(30),
  explicacion: z.string().trim().optional(),
  tema: z.string().trim().optional(),
  quizId: z.string().trim().min(1, "quizId es obligatorio"),
  activa: z.boolean().default(true),
});

const multipleOpcionSchema = preguntaBaseSchema.extend({
  tipo: z.literal(TipoPregunta.MULTIPLE_OPCION),
  opciones: z.array(z.string().trim().min(1)).min(2, "Mínimo 2 opciones"),
  respuestaCorrecta: z.union([
    z.number().int().nonnegative(),
    z.array(z.number().int().nonnegative()),
  ]),
  permiteMultiples: z.boolean().default(false),
});

const verdaderoFalsoSchema = preguntaBaseSchema.extend({
  tipo: z.literal(TipoPregunta.VERDADERO_FALSO),
  opciones: z.tuple([z.literal("Verdadero"), z.literal("Falso")]).default([
    "Verdadero",
    "Falso",
  ]),
  respuestaCorrecta: z.boolean(),
});

const respuestaCortaSchema = preguntaBaseSchema.extend({
  tipo: z.literal(TipoPregunta.RESPUESTA_CORTA),
  respuestaCorrecta: z.union([
    z.string().trim().min(1),
    z.array(z.string().trim().min(1)).min(1),
  ]),
  caseSensitive: z.boolean().optional().default(false),
  maxLength: z.number().int().positive().optional(),
});

export const crearPreguntaSchema = z.discriminatedUnion("tipo", [
  multipleOpcionSchema,
  verdaderoFalsoSchema,
  respuestaCortaSchema,
]);

export const actualizarPreguntaSchema = z.union([
  multipleOpcionSchema.partial(),
  verdaderoFalsoSchema.partial(),
  respuestaCortaSchema.partial(),
]);

function validarRespuestaCorrecta(
  data: z.infer<typeof crearPreguntaSchema>
): string | null {
  switch (data.tipo) {
    case TipoPregunta.MULTIPLE_OPCION:
      const indices = Array.isArray(data.respuestaCorrecta)
        ? data.respuestaCorrecta
        : [data.respuestaCorrecta];
      const invalido = indices.some(
        (idx) => idx < 0 || idx >= data.opciones.length
      );
      return invalido
        ? "respuestaCorrecta fuera del rango de opciones"
        : null;

    case TipoPregunta.VERDADERO_FALSO:
      return typeof data.respuestaCorrecta === "boolean" ? null : "respuestaCorrecta inválida";

    case TipoPregunta.RESPUESTA_CORTA:
      const respuestas = Array.isArray(data.respuestaCorrecta)
        ? data.respuestaCorrecta
        : [data.respuestaCorrecta];
      return respuestas.length > 0 ? null : "respuestaCorrecta es obligatoria";

    default:
      return "Tipo de pregunta no soportado";
  }
}

export function parsearCrearPregunta(body: unknown) {
  const data = crearPreguntaSchema.parse(body);
  const errorLogico = validarRespuestaCorrecta(data);

  if (errorLogico) {
    throw new z.ZodError([
      {
        code: "custom",
        message: errorLogico,
        path: ["respuestaCorrecta"],
      },
    ]);
  }

  return data;
}
