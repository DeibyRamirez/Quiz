# Modelos y colecciones MongoDB

Base de datos configurada en `MONGODB_URI` (nombre típico: **Electroquiz**).

Mongoose pluraliza nombres de modelo → colecciones en minúsculas.

## Mapa de colecciones

| Modelo Mongoose | Colección Mongo | Descripción |
|-----------------|-----------------|-------------|
| `Usuario` | `usuarios` | Cuentas y roles |
| `Quiz` | `quizzes` | Metadatos del quiz |
| `Pregunta` | `preguntas` | Preguntas vinculadas por `quizId` |
| `SesionLive` | `sesionlives` | Sesión en vivo (PIN, estado, timer) |
| `ParticipanteSesion` | `participantesesions` | Progreso y respuestas por estudiante |

---

## Usuario

**Archivo:** `src/lib/server/models/Usuario.ts`  
**Tipo:** `src/app/types/usuario.ts`

| Campo | Tipo | Notas |
|-------|------|-------|
| `nombre` | string | Requerido |
| `correo` | string | Único, lowercase |
| `contraseña` | string | `select: false`, bcrypt |
| `rol` | enum | `estudiante`, `docente`, `admin` |
| `firebaseUid` | string? | Legacy OAuth Google |
| `creadoEn` | Date | |
| `createdAt`, `updatedAt` | Date | timestamps |

**Índices:** `correo` único, `firebaseUid` sparse.

---

## Quiz

**Archivo:** `src/lib/server/models/Quiz.ts`  
**Tipo:** `src/app/types/quiz.ts`

| Campo | Tipo | Notas |
|-------|------|-------|
| `autorId` | string | ID del docente (Usuario) |
| `titulo` | string | |
| `descripcion` | string | Default `""` |
| `estado` | enum | `borrador`, `publicado` |
| `creadoEn` | Date | |

**Índices:** `{ autorId: 1, creadoEn: -1 }`

Las preguntas **no** se embeben; viven en colección `preguntas` con `quizId`.

---

## Pregunta

**Archivo:** `src/lib/server/models/Pregunta.ts`  
**Tipo:** `src/app/types/pregunta.ts`

| Campo | Tipo | Notas |
|-------|------|-------|
| `texto` | string | Enunciado |
| `tipo` | enum | `multiple_opcion`, `verdadero_falso`, `respuesta_corta` (+ legacy `numerical`) |
| `opciones` | string[] | MC y V/F |
| `respuestaCorrecta` | Mixed | índice(s), boolean, o string |
| `permiteMultiples` | boolean | MC múltiple |
| `caseSensitive` | boolean | respuesta corta |
| `maxLength` | number? | |
| `puntos` | number | Default 10 |
| `tiempoLimite` | number | Segundos, default 30 |
| `explicacion` | string? | |
| `tema` | string? | Metadatos codificados (`topic:`, `unit:`) |
| `quizId` | string | FK lógica a Quiz |
| `activa` | boolean | Soft-disable al borrar quiz |

**Índices:** `{ quizId, activa }`, `{ tema }`

---

## SesionLive

**Archivo:** `src/lib/server/models/SesionLive.ts`  
**Tipo:** `src/app/types/sesion.ts` → `SesionLive`

| Campo | Tipo | Notas |
|-------|------|-------|
| `pin` | string | 6 dígitos, **único** |
| `quizId` | string | |
| `docenteId` | string | Usuario que creó la sesión |
| `sessionName` | string | Nombre para resultados (obligatorio al iniciar) |
| `status` | enum | `lobby`, `active`, `ended` |
| `currentQuestion` | number | Índice 0-based |
| `qScheduledAt` | Date? | Inicio del timer de la pregunta actual |
| `qTimeLimitSec` | number | Límite en segundos |
| `players` | subdoc[] | Ver JugadorSesion |
| `startedAt` | Date? | |
| `endedAt` | Date? | |
| `creadoEn` | Date | |

### Subdocumento `players`

| Campo | Tipo |
|-------|------|
| `userId` | string |
| `nombre` | string |
| `joinedAt` | Date |
| `lastSeenAt` | Date |

**Índices:** `pin` único, `{ quizId, creadoEn: -1 }`

---

## ParticipanteSesion

**Archivo:** `src/lib/server/models/ParticipanteSesion.ts`  
**Tipo:** `ParticipanteSesion`, `RespuestaParticipante`

| Campo | Tipo | Notas |
|-------|------|-------|
| `sesionPin` | string | PIN de la sesión |
| `userId` | string | Estudiante |
| `playerName` | string | Snapshot del nombre |
| `sessionName` | string | Denormalizado para filtros |
| `quizId` | string | |
| `totalScore` | number | Acumulado |
| `answers` | array | Ver abajo |
| `lastUpdated` | Date | Checkpoint de progreso |

**Índices:** `{ sesionPin, userId }` único, `{ quizId }`

### Subdocumento `answers` (RespuestaParticipante)

| Campo | Tipo |
|-------|------|
| `questionId` | string |
| `question` | string (texto enunciado) |
| `answerId` | string |
| `answerText` | string |
| `correctOptionId` | string \| null |
| `correct` | boolean |
| `answeredAt` | Date |
| `timeLeft` | number |
| `pointsEarned` | number |
| `questionIndex` | number |

Un documento por **(sesionPin, userId)**; las respuestas se agregan al array (no subcolección).

---

## Relaciones (lógicas)

```
Usuario (docente)
    └── Quiz (autorId)
            └── Pregunta (quizId)
            └── SesionLive (quizId, docenteId)
                    └── ParticipanteSesion (sesionPin, userId)
```

No hay `ref` Mongoose populate en uso; las APIs hacen queries explícitas por ID.

---

## Equivalencia Firebase (legacy)

| Firebase | Mongo actual |
|----------|----------------|
| `sessions/{pin}` | `SesionLive` |
| `sessions/{pin}/userAnswers/{uid}` | `ParticipanteSesion` |
| `realtime-sessions/{pin}/players` | `players[]` + `lastSeenAt` + heartbeat |
