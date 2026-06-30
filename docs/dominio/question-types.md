# Tipos de pregunta

Dos capas de representación: **Mongo/API** (dominio) y **UI** (formularios y play).

## Mongo / API (`TipoPregunta`)

| Enum Mongo | Descripción |
|------------|-------------|
| `multiple_opcion` | Opciones con índice(s) correctos |
| `verdadero_falso` | `respuestaCorrecta: boolean` |
| `respuesta_corta` | Texto o número; unidad en `tema` |

Legacy: documentos antiguos pueden tener `tipo: "numerical"` — tratado como `respuesta_corta`.

## UI docente / play (`QuestionTypeUi`)

| UI | Uso |
|----|-----|
| `multiple-choice` | Opción múltiple (una o varias correctas) |
| `true-false` | Verdadero / Falso |
| `numerical` | Número con unidad física (`unit` en `tema`) |
| `exact-text` | Palabra/número exacto sin unidad |

## Mapeo UI → Mongo

| UI | Mongo `tipo` | `respuestaCorrecta` | `tema` |
|----|--------------|---------------------|--------|
| multiple-choice | `multiple_opcion` | índice o array | `topic:...` opcional |
| true-false | `verdadero_falso` | boolean | opcional |
| numerical | `respuesta_corta` | string del número | `unit:metros` etc. |
| exact-text | `respuesta_corta` | string exacto | opcional |

Funciones en `lib/client/mappers/pregunta-ui.ts`:

- `preguntaUiToCrear`, `preguntaUiToActualizar`
- `encodeTema` / `decodeTema` — formato `topic:X|unit:Y`

## Mapeo Mongo → UI

`preguntaApiToUi(pregunta)`:

- MC → `options` con `id: "0", "1", ...` y `correctOption`
- V/F → options `true`/`false`
- `respuesta_corta` + `unit` en tema → `numerical` + `correctValue`
- `respuesta_corta` sin unit → `exact-text` + `exactAnswerText`

## Calificación

### Cliente (preview en play)

`verificarRespuestaUi(questionUi, answerId)`:

| Tipo | Lógica |
|------|--------|
| numerical | `parseFloat` estudiante === `correctValue` |
| exact-text | trim, case-insensitive |
| true-false | `answerId` true/false vs `correctOption` |
| multiple-choice | `answerId === correctOption` |

### Servidor (oficial)

`lib/server/services/calificar-respuesta.ts` usa la misma `verificarRespuestaUi` tras cargar pregunta de Mongo.

### Dominio puro (`types/pregunta.ts`)

`verificarRespuesta(pregunta, respuesta)` — para tipos API nativos (índices numéricos, boolean). El play y la API de sesiones usan el mapper UI.

## Puntos y tiempo

| Campo | Default | Uso |
|-------|---------|-----|
| `puntos` | 10 (formulario suele usar 1000) | Base para puntaje |
| `tiempoLimite` | 30 s | Timer de pregunta |

Puntaje en vivo:

```
pointsEarned = correct ? round((timeLeft / timeLimit) * puntos) : 0
```

## Campos del formulario docente

Compartidos en `quiz-form-shared.tsx`:

- Título quiz, descripción, estado (`borrador` / `publicado`)
- Por pregunta: tipo, tema, activa, puntos, tiempo, explicación
- MC: opciones, permite múltiples
- Numérica: valor + unidad
- Exact-text: texto exacto

## Preguntas activas

Solo `activa: true` se incluyen en:

- `GET /quizzes/[id]` (play)
- Avance de sesión live (orden `creadoEn`)

Al eliminar quiz: `updateMany` desactiva preguntas (`activa: false`).

## Diagrama mapper

```
┌─────────────┐   preguntaApiToUi    ┌─────────────┐
│  Mongo/API  │ ──────────────────► │  QuestionUi │
│  Pregunta   │ ◄────────────────── │  (forms/play)│
└─────────────┘   preguntaUiToCrear └─────────────┘
                        │
                        ▼
              verificarRespuestaUi (cliente)
              calificar-respuesta (servidor)
```
