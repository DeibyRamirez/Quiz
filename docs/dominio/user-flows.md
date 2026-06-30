# Flujos de usuario

## Docente: crear y publicar quiz

```mermaid
flowchart LR
  A[Login docente] --> B[/teacher]
  B --> C[/teacher/create]
  C --> D[Formulario quiz + preguntas]
  D --> E[POST /quizzes + /preguntas]
  E --> F[Lista en /teacher]
  F --> G[Editar /teacher/quiz/id/edit]
  G --> H[Estado publicado]
```

1. Inicia sesión como `docente`.
2. Crea quiz: título, descripción, estado.
3. Agrega preguntas (tipos UI → mapper → Mongo).
4. Publica (`estado: publicado`) para usar en live.

## Docente: sesión en vivo

```mermaid
flowchart TD
  L[/teacher/quiz/id/live] --> C[POST /sesiones]
  C --> E{¿Sesión lobby|active existente?}
  E -->|Sí| R[Reconectar mismo PIN]
  E -->|No| P[Crear PIN nuevo]
  R --> N[Nombre sesión / pregunta actual]
  P --> N
  N --> W[Esperar jugadores]
  W --> S[PATCH start]
  S --> T[Timer + pregunta]
  T --> Q{¿Más preguntas?}
  Q -->|Sí| T
  Q -->|No| EN[ended]
  EN --> RES[/teacher/quiz/id/resultados]
```

1. Entra a **Live** desde lista de quizzes.
2. Se crea sesión con PIN de 6 dígitos — o **reconecta** a una sesión `lobby`/`active` previa del mismo quiz.
3. Define nombre de sesión (obligatorio para iniciar).
4. Comparte PIN; ve jugadores conectados (Socket.io + heartbeat).
5. **Empezar quiz** → estudiantes redirigen a play.
6. Timer sincronizado; puede forzar **Siguiente** o auto-avance al expirar.
7. Al terminar → redirección a resultados.

### Docente: reconexión tras salir

1. Cierra pestaña o pierde conexión durante `lobby` o `active`.
2. Vuelve a `/teacher/quiz/[id]/live`.
3. `POST /sesiones` devuelve la sesión existente (no crea PIN nuevo).
4. Si `status === active`, ve banner de reconexión y continúa desde la pregunta actual.

Ver: [reconexion-y-sincronizacion.md](../tiempo-real/reconexion-y-sincronizacion.md#reconexión-del-docente)

## Estudiante: unirse y jugar

```mermaid
flowchart TD
  S[/student] --> PIN[Ingresar PIN o Reconectar]
  PIN --> U[POST /unirse]
  U --> ST{status}
  ST -->|lobby| LO[/student/quiz/code lobby]
  ST -->|active| P[/student/quiz/code/play]
  ST -->|ended| POD[/student/quiz/code/podio]
  LO -->|status active| P
  P --> A[POST /respuestas]
  A --> P
  P -->|status ended| POD
```

1. Login como `estudiante`.
2. PIN de 6 dígitos en `/student`, o botón **Reconectar al quiz** si hay sesión pendiente.
3. Lobby: heartbeat, opción **Salir del quiz**.
4. Al iniciar docente → **play**:
   - Socket + preguntas del quiz
   - Timer desde `qScheduledAt`
   - Responde MC / V/F / numérica / exact-text
5. Al finalizar → **podio** con ranking y detalle por pregunta.

## Reconexión estudiante

Hay tres vías (complementarias):

| Vía | Cuándo |
|-----|--------|
| Panel `/student` → *Reconectar al quiz* | Cerró pestaña; PIN guardado en localStorage |
| Mismo PIN en formulario → `POST /unirse` | Sesión `active` si ya participó antes |
| URL directa `/student/quiz/[pin]/play` | Re-llama `unirse` + `GET /progreso` |

1. Recarga o caída de red durante `active`.
2. `POST /unirse` acepta reconexión si existe `ParticipanteSesion` o entrada en `players[]`.
3. `GET /progreso` restaura puntaje y respuesta actual si ya envió.
4. Socket reconecta y sincroniza `currentQuestion` y timer.

Ver: [reconexion-y-sincronizacion.md](../tiempo-real/reconexion-y-sincronizacion.md#reconexión-del-estudiante)

## Docente: ver resultados

1. `/teacher/quiz/[id]/resultados` (o tras live ended).
2. `GET /quizzes/[id]/resultados` agrega todos `ParticipanteSesion` del quiz.
3. Filtro por **nombre de sesión** (`sessionName`).
4. Top 3, estadísticas, análisis por pregunta (% aciertos).

## Administrador

```mermaid
flowchart LR
  A[Login admin] --> B[/administrador]
  B --> C[Listar usuarios]
  C --> D[Cambiar rol]
  C --> E[Eliminar usuario]
```

- `GET /usuarios`, `PUT /usuarios/[id]`, `DELETE /usuarios/[id]`
- Roles: estudiante, docente, admin

## Matriz rol → capacidad

| Acción | Estudiante | Docente | Admin |
|--------|------------|---------|-------|
| Crear quiz | ✗ | ✓ | ✓* |
| Live / PIN | ✗ | ✓ | ✓* |
| Unirse PIN | ✓ | ✗ | ✗ |
| Gestionar usuarios | ✗ | ✗ | ✓ |
| Ver resultados quiz | ✗ | ✓ (sus quizzes) | ✓ |

\* Admin puede crear sesión si es autor del quiz o por política de API.

## Errores comunes UX

| Mensaje | Causa |
|---------|-------|
| PIN no válido | No existe `SesionLive` con ese pin |
| Sesión no en espera | Sesión `active` y usuario **nunca** se unió (solo reconexión de participantes previos) |
| No estás registrado en esta sesión | Socket `join` sin estar en `players` ni ser docente |
| Pregunta ya no activa | `questionIndex` desincronizado al enviar respuesta |
| Espera jugador / nombre | Lobby sin players o sin `sessionName` |
