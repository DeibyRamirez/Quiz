# Lógica de negocio y funcionalidad

Reglas de dominio implementadas en código (no solo UI).

## Quizzes

| Regla | Implementación |
|-------|----------------|
| Un quiz pertenece a un autor (`autorId`) | `QuizModel` |
| Estados: borrador / publicado | `EstadoQuiz` |
| Borrar quiz desactiva preguntas | `DELETE /quizzes/[id]` → `activa: false` |
| Listar por docente | `GET /quizzes?autorId=` |
| Detalle incluye solo preguntas activas | `GET /quizzes/[id]` |

`puedeIniciarSesion(quiz, n)` — helper en `types/quiz.ts`: publicado + al menos una pregunta activa (validación recomendada antes de live).

## Preguntas

| Regla | Implementación |
|-------|----------------|
| Orden en live/play | `sort({ creadoEn: 1 })` |
| Tipos validados en API | Zod + `validarPregunta` |
| MC múltiple | `permiteMultiples` + array en `respuestaCorrecta` |
| Numérica vs exact-text | Presencia de `unit:` en `tema` |
| Puntos y tiempo > 0 | Validadores |

## Sesiones live

| Regla | Implementación |
|-------|----------------|
| PIN 6 dígitos único | `generarPinUnico()` + índice único |
| Solo lobby permite unirse | `POST /unirse` |
| Solo lobby permite salir (remover player) | `POST /salir` |
| Nombre sesión obligatorio al start | `PATCH start` |
| Al menos un jugador al start | `PATCH start` |
| Una respuesta por pregunta por usuario | Check `questionId` en `ParticipanteSesion` |
| Respuesta solo en pregunta actual | `questionIndex === session.currentQuestion` |
| Avance automático al expirar timer | Cliente docente → `PATCH next` |
| Sin más preguntas → `ended` | `PATCH next` en servidor |
| Participante upsert al unirse | `findOneAndUpdate` upsert |

## Puntaje

```
si correcta:
  pointsEarned = round((timeLeft / tiempoLimite) * puntos)
si incorrecta:
  pointsEarned = 0
totalScore = suma de pointsEarned
```

Fuente de verdad: **servidor** al procesar `POST /respuestas`.

## Presencia

| Contexto | Regla |
|----------|-------|
| Lobby | Jugadores sin heartbeat 45 s se ocultan en GET sesión |
| Active / ended | No se filtran jugadores por timeout |

## Resultados

| Regla | Implementación |
|-------|----------------|
| Agregar por `quizId` | Todos `ParticipanteSesion` del quiz |
| Agrupar por `sessionName` | Denormalizado + mapa de sesiones |
| Filtro docente | UI `selectedGroupName` |
| Análisis por pregunta | % correctos sobre quienes respondieron esa pregunta |
| Podio estudiante | Top 3 de la misma sesión (mismo PIN) |

## Usuarios y roles

| Regla | Implementación |
|-------|----------------|
| Correo único | Índice Mongo |
| Rol por defecto estudiante | Schema Usuario |
| Solo estudiante une por PIN | `requerirRol([ESTUDIANTE])` en unirse |
| Solo docente crea sesión | `requerirRol` + autor del quiz |
| Admin gestiona usuarios | Panel administrador |

## Autenticación

| Regla | Implementación |
|-------|----------------|
| Sin token → 401 en rutas protegidas | `requerirAuth` |
| Rol incorrecto → 403 | `requerirRol` |
| Contraseña nunca en JSON público | `select: false` |

## Reconexión

| Regla | Implementación |
|-------|----------------|
| Identificar estudiante | JWT `sub` = `ParticipanteSesion.userId` |
| Restaurar progreso | `GET /progreso` |
| Respuesta ya enviada en pregunta actual | `answeredCurrentQuestion` + UI disabled |

## Funcionalidad por módulo (resumen)

### Módulo docente

- Dashboard de quizzes propios
- CRUD quiz (metadatos + estado)
- CRUD preguntas vía formulario unificado
- Live: PIN, lobby, control de flujo, timer
- Resultados: ranking, filtros, estadísticas por pregunta

### Módulo estudiante

- Unirse por PIN (solo lobby)
- Lobby con advertencia de registro
- Play sincronizado con docente
- Podio personal + comparación con top 3 de la sesión

### Módulo administrador

- Listar usuarios
- Cambiar rol
- Eliminar usuarios

### Módulo auth

- Registro, login, logout
- Sesión persistente 7 días
- Protección de rutas por rol

## Validaciones en capas

```
UI (disabled, alerts)
    ↓
Cliente API (tipos TS)
    ↓
Zod validators (API entrada)
    ↓
Reglas de negocio en route handlers
    ↓
Mongoose schema (tipos, enums, required)
```

La calificación de respuestas tiene validación duplicada **intencional** en cliente (UX) y servidor (seguridad).
