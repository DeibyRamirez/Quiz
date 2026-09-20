# Módulo de generación de quizzes con IA (docente)

Permite al docente cargar una guía de estudio (PDF/DOCX), extraer y cachear su contenido, y generar o refinar un quiz estructurado mediante un LLM (Gemini vía proxy corporativo).

## Flujo general

1. **Subir guía** — `POST /api/v1/guides/upload/` (multipart)
2. **Configurar** — N preguntas + distribución por tipo
3. **Generar** — `POST /api/v1/quizzes/generate/`
4. **Preview y refinar** — `PATCH /api/v1/quizzes/[quizId]/refine/`
5. **Editar manual / publicar** — flujo existente en `/teacher/quiz/[id]/edit/`

## Arquitectura

```
UI (/teacher/create/ia)
  → lib/client/services/guias.ts | quiz-ia.ts
  → API v1 (auth docente)
  → GuiaService | QuizIaService
  → Parsers (PDF/DOCX) | Cliente Gemini
  → MongoDB (guias, quizzes, preguntas)
```

## Idempotencia por hash

Antes de parsear un archivo se calcula `SHA-256` del buffer. Si `hashArchivo` ya existe en la colección `guias`, se reutiliza `contenidoMarkdown` sin reprocesar.

## Optimización de tokens (sin context caching)

- El markdown se guarda **una vez** en MongoDB.
- Cada llamada al LLM envía un payload JSON compacto: excerpt de guía + config + (en refine) estado actual del quiz.
- Si la guía supera el umbral, se trunca por secciones (`##`) con `truncarMarkdownPorSecciones`.
- No se reenvía historial de chat; cada refine es stateless.

## Tipos IA → Mongo

| Tipo IA | Mongo `tipo` | Notas |
|---------|--------------|-------|
| `true_false` | `verdadero_falso` | `respuestaCorrecta: boolean` |
| `single_choice` | `multiple_opcion` | 4 opciones, `permiteMultiples: false` |
| `multi_choice` | `multiple_opcion` | 4–5 opciones, `permiteMultiples: true` |
| `open_text` | `respuesta_corta` | `criteriosEvaluacion`, `requiereCorreccionManual: true` |

Mapper servidor: `src/lib/server/mappers/pregunta-ia.ts`.

## Limitaciones de `open_text`

Las preguntas de desarrollo **no se califican automáticamente** en sesiones live (`requiereCorreccionManual: true`). El docente puede convertirlas a otro tipo desde el editor manual.

## Variables de entorno

```env
# Preferido: Vertex AI (misma facturación GCP que el chat)
VERTEX_PROJECT_ID=
VERTEX_LOCATION=us-central1
GOOGLE_SERVICE_ACCOUNT_JSON=

# Respaldo: AI Studio (créditos prepagados)
GEMINI_API_KEY=
GEMINI_BASE_URL=
GEMINI_MODEL_FLASH=gemini-3.5-flash-lite
GEMINI_MODEL_PRO=gemini-2.5-pro
GEMINI_TOKEN_UMBRAL_PRO=12000
GEMINI_MAX_UPLOAD_MB=10
```

Si `VERTEX_PROJECT_ID` está definido, el cliente usa Vertex (`aiplatform.googleapis.com`) con cuenta de servicio. Si no, usa la API de AI Studio (`generativelanguage.googleapis.com`) y sus créditos.

## Selección de modelo

- `gemini-3.5-flash-lite` — guías con `estimacionTokens ≤ umbral`
- `gemini-2.5-pro` — guías más extensas o complejas

## Validación de distribución

- `totalPreguntas`: 1–50
- La suma de `distribucion` debe igualar `totalPreguntas`
- Salida del LLM validada con Zod (`quizGeneradoIaSchema`); reintento automático si falla

## Mejoras futuras

- Ponderación de dificultad por puntaje
- Entidad `Curso` vinculada a `cursoId`
- Auth en endpoints CRUD legacy `/api/quizzes`
