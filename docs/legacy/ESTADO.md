# Estado del Proyecto y Referencia

## Estado Actual

El proyecto está en fase de **funcionamiento completo con Firebase integrado**. La interfaz está completa y la lógica de negocio opera con datos reales.

### ✅ Completado (Integrado con Firebase)
- Autenticación con Google OAuth (Firebase Auth)
- Sistema de roles (estudiante, docente, administrador)
- Protección de rutas por rol (`ProtectedRoute`)
- CRUD completo de quizzes (Firestore)
- CRUD completo de preguntas (3 tipos: multiple-choice, true-false, numerical)
- Sesiones en vivo con PIN de 6 dígitos
- Sala de espera (lobby) con detección de jugadores
- Temporizador sincronizado por reloj servidor
- Respuestas de estudiantes con cálculo de puntaje
- Resultados docentes con análisis por pregunta y ranking
- Podio de resultados para estudiantes
- Limpieza automática de sesiones (Cloud Functions)
- Detección de desconexión de jugadores (RTDB onDisconnect)
- Landing page con CTA flotante responsive
- Footer global con política de privacidad
- Banner de consentimiento de cookies
- Google AdSense (carga condicional)
- Vercel Analytics + Speed Insights
- Notificaciones toast (sonner)
- Navegación responsive con avatar de Google

### 🔄 Parcial / Legacy
- `LiveLeaderboard`: Simulación, no conectado a datos reales
- `QuestionTemplates`: No integrado en el flujo actual
- `ThemeProvider`: Declarado pero no usado en layout
- `firebase-config.tsx`: Service worker de Firebase Hosting

### ❌ Pendiente / Mejora Continua
- Server Actions (`src/lib/actions.ts` está vacío)
- Página `/acceso-denegado` (referenciada pero no creada)
- Exportación de resultados a CSV/PDF
- Edición de sesión en vivo (cambiar pregunta manualmente desde vista docente)
- Vista de respuestas en vivo durante el quiz (docente ve progreso)
- Modo oscuro (next-themes preparado)
- Validación con zod en formularios
- Tests unitarios y de integración
- Imagen default-avatar.png en `/public`

---

## Colecciones Firestore - Estructura Detallada

### `usuarios/{uid}`
```typescript
{
  nombre: string,
  correo: string,
  rol: "estudiante" | "docente" | "administrador",
  creadoEn: Timestamp
}
```

### `quizzes/{quizId}`
```typescript
{
  title: string,
  description: string,
  authorId: string,        // uid del docente
  status: "draft",         // (campo legacy)
  createdAt: Timestamp,
  updatedAt?: Timestamp
}
```

### `questions/{questionId}`
```typescript
{
  quizId: string,
  question: string,                       // se guarda con formato (espacios, saltos)
  questionType: "multiple-choice" | "true-false" | "numerical",
  points: number,                         // 100 | 200 | 300 | 500
  timeLimit: number,                      // segundos (15 | 30 | 45 | 60)
  explanation?: string,
  options?: { id, text, isCorrect }[],   // para multiple-choice / true-false
  correctOption?: string,                 // id de la opción correcta
  correctValue?: number,                  // para numérica
  unit?: string,                          // N | C | m | Otro
  tolerance?: number,                     // % tolerancia (legacy)
  createdAt: Timestamp,
  updatedAt?: Timestamp
}
```

### `sessions/{pin}`
```typescript
{
  quizId: string,
  pin: string,               // 6 dígitos
  sessionName: string,       // nombre dado por el docente
  status: "lobby" | "active" | "ended",
  players: { uid, name, score }[],
  currentQuestion: number,   // índice 0-based
  qTimeLimitSec?: number,    // tiempo de la pregunta actual
  qScheduledAt?: Timestamp,  // cuándo inició la pregunta actual
  startedAt?: Timestamp,
  createdAt: Timestamp
}
```

### `sessions/{pin}/userAnswers/{uid}`
```typescript
{
  playerId: string,
  playerName: string,
  answers: {
    questionId: string,
    question: string,
    answerId: string,
    answerText: string,
    correctOptionId: string | null,
    correct: boolean,
    answeredAt: Timestamp,
    timeLeft: number,
    pointsEarned: number
  }[],
  totalScore: number,
  lastUpdated: Timestamp
}
```

---

## Variables de Entorno

```bash
# .env.local
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
```

---

## Comandos del Proyecto

```bash
npm run dev       # Servidor de desarrollo (localhost:3000)
npm run build     # Build producción (standalone en .next/)
npm run start     # Servir build localmente
npm run lint      # Linter (Next.js ESLint)
```

### Firebase

```bash
# Requiere Firebase CLI: npm install -g firebase-tools
firebase deploy --only hosting        # Desplegar hosting
firebase deploy --only functions      # Desplegar cloud functions
firebase deploy                       # Desplegar todo
firebase emulators:start              # Emuladores locales
```

---

## Convenciones del Código

- **Rutas en `src/app/`**: Siguen Next.js App Router con parámetros `[id]` y `[code]`
- **Componentes cliente**: Uso de `"use client"` en todas las páginas interactivas
- **Firebase**: Importaciones desde `@/lib/firebase` (árbol de exports)
- **Estilos**: Tailwind CSS v4 con sintaxis `@apply`, colores CSS variables, `bg-linear-to-r` (nueva sintaxis)
- **Notificaciones**: `toast.success()`, `toast.error()`, `toast.warning()` de sonner
- **Protección de rutas**: Envolver default export con `<ProtectedRoute allowedRoles={[...]}>`
- **Formato de preguntas**: Se preservan espacios y saltos de línea con `whitespace-pre-wrap wrap-break-word`

---

## Mapa de Rutas

| Ruta                                      | Rol         | Componente/Página            |
|-------------------------------------------|-------------|------------------------------|
| `/`                                       | público     | Landing page                 |
| `/login`                                  | público     | Login Google OAuth           |
| `/politica-privacidad`                    | público     | Política de privacidad       |
| `/student`                                | estudiante  | Portal unirse por PIN        |
| `/student/quiz/[code]`                    | estudiante  | Lobby de espera              |
| `/student/quiz/[code]/play`               | estudiante  | Responder preguntas          |
| `/student/quiz/[code]/podio`              | estudiante  | Resultados y podio           |
| `/teacher`                                | docente     | Dashboard (lista quizzes)    |
| `/teacher/create`                        | docente     | Crear quiz + preguntas       |
| `/teacher/quiz/[id]/edit`                | docente     | Editar quiz + preguntas      |
| `/teacher/quiz/[id]/live`                | docente     | Sesión en vivo               |
| `/teacher/quiz/[id]/resultados`           | docente     | Resultados y análisis        |
| `/administrador`                          | admin       | Gestión de usuarios          |

---

## Dependencias Clave (package.json)

```json
{
  "dependencies": {
    "firebase": "^12.3.0",
    "next": "14.2.16",
    "react": "^18",
    "react-dom": "^18",
    "next-themes": "^0.4.6",
    "sonner": "^1.7.4",
    "lucide-react": "^0.454.0",
    "@vercel/analytics": "latest",
    "@vercel/speed-insights": "^1.2.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.5",
    "zod": "3.25.67",
    "react-hook-form": "^7.60.0",
    "@hookform/resolvers": "^3.10.0",
    "recharts": "2.15.4",
    "date-fns": "4.1.0"
  },
  "devDependencies": {
    "tailwindcss": "^4.1.9",
    "typescript": "^5",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/node": "^22",
    "@tailwindcss/postcss": "^4.1.9",
    "tw-animate-css": "1.3.3"
  }
}
```

---

## Configuración Firebase (firebase.json)

```json
{
  "hosting": {
    "public": ".next",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "cleanUrls": true,
    "trailingSlash": false
  },
  "functions": {
    "source": "functions"
  }
}
```
