# Flujo de Navegación y Lógica de Negocio

## 1. Autenticación y Control de Acceso

### Login con Google OAuth
```
Usuario → /login → Click "Iniciar sesión con Google"
                        ↓
              Firebase Auth (popup)
                        ↓
              ¿Usuario existe en Firestore "usuarios"?
                     ↙          ↘
                   No            Sí
                    ↓             ↓
           Crear doc con      Leer rol del doc
           rol="estudiante"        ↓
                    ↓        ¿Qué rol tiene?
              Redirigir a    ↙    ↓     ↘
              /student    estudiante docente administrador
                            ↓       ↓          ↓
                         /student  /teacher  /administrador
```

### ProtectedRoute (Guard por roles)
```
Componente ProtectedRoute
  ↓
  auth.currentUser ¿existe?
  ↙          ↘
  No          Sí
  ↓           ↓
  /login     Leer rol de Firestore "usuarios/{uid}"
              ↓
             ¿allowedRoles.includes(rol)?
              ↙          ↘
             Sí          No
              ↓           ↓
         Renderiza     /acceso-denegado
          children
```

### Roles del Sistema

| Rol            | Rutas Accesibles                     | Permisos                                |
|----------------|--------------------------------------|-----------------------------------------|
| `estudiante`   | `/student/*`                         | Unirse a quiz, responder, ver podio     |
| `docente`      | `/teacher/*`                         | CRUD quizzes, live session, resultados  |
| `administrador`| `/administrador`, `/teacher/*`       | Gestión de usuarios (CRUD + roles)      |

---

## 2. Flujo del Docente

### 2.1 Dashboard (`/teacher`)
- **Autenticación requerida**: Sí (rol: docente/administrador)
- **Carga de datos**: Consulta `quizzes` donde `authorId == userId`
- **Estados**: loading → empty → lista de quizzes
- **Acciones**:
  - Crear quiz → `/teacher/create`
  - Editar quiz → `/teacher/quiz/[id]/edit`
  - Ver resultados → `/teacher/quiz/[id]/resultados`
  - Iniciar sesión en vivo → `/teacher/quiz/[id]/live`
  - Eliminar quiz (confirm + deleteDoc)

### 2.2 Crear/Editar Quiz (`/teacher/create`, `/teacher/quiz/[id]/edit`)
- **Flujo de creación**:
  1. Guardar quiz (título + descripción) → obtiene `quizId`
  2. Agregar preguntas asociadas a `quizId`
  3. Cada pregunta se guarda individualmente en `questions/`
- **Tipos de preguntas**: `multiple-choice`, `true-false`, `numerical`
- **Validaciones**:
  - Título obligatorio
  - Opción múltiple: todas las opciones con texto + 1 correcta
  - Numérica: valor numérico + unidad obligatoria
- **Persistencia**: `onSnapshot` para tiempo real en preguntas
- **Reset de formulario**: Botón "Cancelar" para edición

### 2.3 Sesión en Vivo (`/teacher/quiz/[id]/live`)

```
Docente abre /teacher/quiz/[id]/live
  ↓
Genera PIN único de 6 dígitos (evita duplicados)
  ↓
Crea documento en Firestore "sessions/{pin}"
  ↓
┌─────────────────────────────────────────────┐
│               LOBBY                          │
│  - Docente ingresa nombre de sesión          │
│  - Muestra PIN (copiable)                    │
│  - Lista de jugadores conectados (RTDB)      │
│  - Botón "Empezar Quiz" (deshabilitado       │
│    si no hay jugadores o falta nombre)       │
└─────────────────┬───────────────────────────┘
                  │ Click "Empezar Quiz"
                  ↓
┌─────────────────────────────────────────────┐
│               ACTIVO                         │
│  updateDoc(sessions/{pin}, {                 │
│    status: "active",                         │
│    currentQuestion: 0,                       │
│    qTimeLimitSec: 30,                        │
│    qScheduledAt: Timestamp (now + 2s)        │
│  })                                          │
│                                              │
│  Temporizador sincronizado por reloj real:   │
│  remaining = limitSec - (now - scheduledAt)  │
│  tick cada 250ms                             │
│                                              │
│  Al llegar a 0 → auto-avanza                 │
│  Botón "Siguiente" → avance manual           │
└─────────────────┬───────────────────────────┘
                  │ Última pregunta
                  ↓
┌─────────────────────────────────────────────┐
│               ENDED                          │
│  updateDoc({ status: "ended" })              │
│  Redirige a /teacher/quiz/[id]/resultados    │
└─────────────────────────────────────────────┘
```

**Sincronización de jugadores**:
- Cuando un estudiante se une: se agrega a `sessions/{pin}/players[]` y a `realtime-sessions/{pin}/players/{uid}`
- `onDisconnect` en RTDB elimina el nodo al cerrar pestaña
- El docente escucha RTDB y filtra jugadores desconectados de Firestore

**Mecanismo de tiempo real**:
- `serverTimestamp()` + `Timestamp.fromMillis()` para sincronización
- Offset calculado: `serverTime - clientTime`
- Sin WebSocket propio — todo vía Firestore `onSnapshot` + RTDB `onValue`

### 2.4 Resultados (`/teacher/quiz/[id]/resultados`)
- **Carga**: Busca todas las sesiones del quiz + `userAnswers` de cada sesión
- **Filtro**: Selector por nombre de sesión (grupo)
- **Estadísticas**:
  - Total participantes, promedio, mejor puntaje, cantidad de grupos
  - Podio animado (top 3)
  - Análisis por pregunta (aciertos/respondieron)
  - Ranking completo por estudiante
- **ResultCard**: Muestra TODAS las preguntas del quiz (incluso no respondidas) con estado correcta/incorrecta/no respondida

---

## 3. Flujo del Estudiante

### 3.1 Unirse a Quiz (`/student`)
```
Estudiante autenticado (rol: estudiante)
  ↓
Ingresa PIN de 6 dígitos
  ↓
Validaciones:
  - PIN debe tener 6 dígitos
  - Usuario debe estar logueado
  - Rol debe ser "estudiante"
  - Documento "sessions/{pin}" debe existir
  - Estado debe ser "lobby"
  ↓
Acciones:
  1. Agregar jugador a sessions/{pin}/players[] (arrayUnion)
  2. Crear nodo en RTDB: realtime-sessions/{pin}/players/{uid}
  3. Configurar onDisconnect remove()
  ↓
Redirigir a /student/quiz/{pin}
```

### 3.2 Lobby (`/student/quiz/[code]`)
- **Listener**: `onSnapshot` a `sessions/{pin}`
- **Estados**:
  - `loading` → "Cargando..."
  - `session.status === "lobby"` → Muestra info, PIN, jugadores, advertencia
  - `session.status === "active"` → Redirige a `/student/quiz/{pin}/play`
  - `session.status === "ended"` → Redirige a `/student/quiz/{pin}/podio`
- **Protección**: Escucha `beforeunload` y `popstate` para salir del quiz
- **Botón "Salir del Quiz"**: Ejecuta `salirQuiz(pin)` y redirige a `/student`

### 3.3 Responder Quiz (`/student/quiz/[code]/play`)
```
session.status === "active"
  ↓
Escucha currentQuestionIndex de la sesión
  ↓
Carga preguntas del quiz (questions/{quizId})
  ↓
Muestra pregunta actual según índice
  ↓
Estudiante selecciona respuesta:
  - Opción múltiple: click en botón de opción
  - Numérica: input + botón "Enviar respuesta"
  ↓
sendAnswer():
  1. Valida respuesta vs correctOption o correctValue
  2. Calcula puntos: (timeLeft / timeLimit) * basePoints
  3. Guarda en sessions/{pin}/userAnswers/{uid}
     { playerId, playerName, answers[], totalScore }
  ↓
Muestra retroalimentación: correcta/incorrecta + puntaje total
```

### 3.4 Podio y Resultados (`/student/quiz/[code]/podio`)
- **Carga**: Sesión → Quiz → Preguntas → userAnswers de todos los estudiantes
- **Identificación**: Por `auth.currentUser.uid` o `localStorage.eq_playerId`
- **Muestra**:
  - Podio animado (top 3)
  - Estadísticas personales (posición, puntos, aciertos)
  - Análisis por pregunta (estado + puntos obtenidos)

---

## 4. Flujo de Datos

```
┌──────────┐    ┌──────────────┐    ┌─────────────┐
│ Páginas   │───►│ Firebase     │───►│ UI (shadcn) │
│ (src/app) │    │ (Firestore)  │    │             │
└──────────┘    └──────────────┘    └─────────────┘
                      │
               ┌──────┴──────┐
               │              │
        ┌──────▼─────┐  ┌───▼────────┐
        │ Auth       │  │ Realtime   │
        │ (login)    │  │ Database   │
        └────────────┘  │ (presencia)│
                        └────────────┘
```

### Colecciones Firestore

| Colección       | Document ID      | Uso Principal                            |
|-----------------|------------------|------------------------------------------|
| `usuarios`      | `{uid}`          | Perfiles de usuario con rol              |
| `quizzes`       | auto-ID          | Quizzes creados por docentes             |
| `questions`     | auto-ID          | Preguntas asociadas a un quiz            |
| `sessions`      | `{pin}`           | Sesiones en vivo (lobby/active/ended)    |
| `sessions/{pin}/userAnswers` | `{uid}` | Respuestas de cada estudiante            |
| `_meta`         | `servertime`     | Sincronización de tiempo servidor        |

### Flujo de Sincronización Tiempo Real

```
Docente: updateDoc(sessions/{pin}, { currentQuestion, qScheduledAt })
     │
     ▼ (onSnapshot)
Estudiante: recibe nuevo índice → carga pregunta → timer countdown
     │
     ▼ (sendAnswer)
Estudiante: setDoc(sessions/{pin}/userAnswers/{uid}, { answers, totalScore })
     │
     ▼ (onSnapshot - opcional)
Docente: podría ver respuestas en vivo (no implementado aún)
```

### Sistema de PIN

```
Generación: Math.floor(100000 + Math.random() * 900000)
Validación: verificar que no exista en Firestore sessions/{pin}
Intentos máximos: 10 (evita bucle infinito)
```

### Cloud Function: cleanupLobbySessions

```
Schedule: every 1 hours
Propósito: Eliminar sesiones en estado "lobby" con más de 24h
Proceso:
  1. Query sessions where status=="lobby" && createdAt <= 24h ago
  2. Batch delete todos los documentos encontrados
  3. Log del resultado
```
