# API REST

Base URL: `{ORIGIN}/api/` (con **trailing slash** en paths).

Autenticación: cookie `eq_token` (JWT). El cliente usa `credentials: "include"`.

## Auth

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/auth/login/` | No | Login, set cookie |
| POST | `/auth/registro/` | No | Registro estudiante/docente |
| POST | `/auth/logout/` | — | Limpia cookie |
| GET | `/auth/me/` | Cookie | Usuario actual |

### Login body

```json
{ "correo": "...", "contraseña": "..." }
```

## Usuarios

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/usuarios/` | Admin | Listar usuarios |
| GET | `/usuarios/[id]/` | — | Obtener uno |
| PUT | `/usuarios/[id]/` | — | Actualizar (rol, etc.) |
| DELETE | `/usuarios/[id]/` | — | Eliminar |

## Quizzes

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/quizzes/` | No | Lista; query `autorId` |
| POST | `/quizzes/` | — | Crear |
| GET | `/quizzes/[id]/` | No | Quiz + preguntas activas |
| PUT | `/quizzes/[id]/` | — | Actualizar metadatos |
| DELETE | `/quizzes/[id]/` | — | Borrar quiz; desactiva preguntas |
| GET | `/quizzes/[id]/resultados/` | No | Agregado de participantes |

## Preguntas

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/preguntas/` | Query `quizId` |
| POST | `/preguntas/` | Crear |
| GET | `/preguntas/[id]/` | Una pregunta |
| PUT | `/preguntas/[id]/` | Actualizar |
| DELETE | `/preguntas/[id]/` | Eliminar / desactivar |

## Sesiones en vivo

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/sesiones/` | Docente/Admin | Crear sesión `{ quizId }` → PIN |
| GET | `/sesiones/[pin]/` | No | Estado + `serverTime` |
| PATCH | `/sesiones/[pin]/` | Docente | Ver acciones abajo |
| POST | `/sesiones/[pin]/unirse/` | Estudiante | Entrar al lobby |
| POST | `/sesiones/[pin]/salir/` | Auth | Salir (solo lobby remueve player) |
| POST | `/sesiones/[pin]/heartbeat/` | Auth | Actualiza `lastSeenAt` |
| POST | `/sesiones/[pin]/respuestas/` | Auth | Enviar respuesta |
| GET | `/sesiones/[pin]/progreso/` | Auth | Reconexión estudiante |

### PATCH `/sesiones/[pin]/` — acciones

Body discriminado por `action`:

```json
{ "action": "updateName", "sessionName": "Clase 1A" }
{ "action": "start" }
{ "action": "next" }
{ "action": "end" }
```

- **start:** requiere `sessionName`, jugadores, status `lobby`. Set `active`, `qScheduledAt` (+2s), timer pregunta 0.
- **next:** avanza `currentQuestion` o `ended` si no hay más preguntas.
- **end:** termina sesión.

### POST `/sesiones/[pin]/respuestas/`

```json
{
  "questionId": "...",
  "answerId": "0",
  "answerText": "Opción A",
  "timeLeft": 12,
  "questionIndex": 0
}
```

Respuesta:

```json
{
  "correct": true,
  "pointsEarned": 400,
  "totalScore": 400,
  "alreadyAnswered": false
}
```

Validación en servidor; rechaza si `questionIndex` ≠ `currentQuestion` de la sesión.

### GET `/sesiones/[pin]/progreso/`

```json
{
  "totalScore": 400,
  "answers": [...],
  "answeredQuestionIds": ["..."],
  "answeredCurrentQuestion": true,
  "currentQuestionAnswer": { ... }
}
```

## Health

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health/db/` | Estado conexión Mongo |

## Errores

Formato típico:

```json
{ "error": "Mensaje", "detalles": { ... } }
```

Status: 400 validación, 401 no auth, 403 prohibido, 404 no encontrado, 409 duplicado, 500 interno.

## Cliente TypeScript

Servicios en `src/lib/client/services/`:

- `auth.ts`, `usuarios.ts`, `quizzes.ts`, `preguntas.ts`, `sesiones.ts`
