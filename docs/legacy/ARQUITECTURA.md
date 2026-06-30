# Arquitectura del Proyecto - ElectroQuiz

## Visión General

ElectroQuiz es una plataforma educativa universitaria interactiva para el aprendizaje de **Fuerzas Eléctricas** (Ley de Coulomb, Campo Eléctrico, Potencial Eléctrico). Utiliza **Next.js 14 App Router** con renderizado del lado del cliente (CSR) y se despliega como **standalone** en Firebase Hosting.

La aplicación tiene **3 roles de usuario**: `estudiante`, `docente`, `administrador`. Usa **Firebase** como backend completo: autenticación, base de datos (Firestore), tiempo real (Realtime Database), y funciones serverless (Cloud Functions).

---

## Stack Tecnológico

| Capa            | Tecnología                              | Versión   |
|-----------------|-----------------------------------------|-----------|
| Framework       | Next.js (App Router)                    | 14.2.16   |
| UI              | React                                   | 18        |
| Estilos         | Tailwind CSS                            | 4.1.9     |
| Componentes     | shadcn/ui (Radix Primitives)            | -         |
| Íconos          | Lucide React                            | ^0.454.0  |
| Fuentes         | Geist (Sans + Mono)                     | latest    |
| Backend/Database| Firebase Firestore                      | ^12.3.0   |
| Tiempo Real     | Firebase Realtime Database              | ^12.3.0   |
| Autenticación   | Firebase Auth (Google Provider)         | ^12.3.0   |
| Cloud Functions | Firebase Cloud Functions (Node 22)      | -         |
| Formularios     | react-hook-form + zod                   | ^7.60.0   |
| Gráficas        | Recharts                                | ^2.15.4   |
| Notificaciones  | sonner                                  | ^1.7.4    |
| Analytics       | @vercel/analytics                       | latest    |
| Speed Insights  | @vercel/speed-insights                  | ^1.2.0    |
| Anuncios        | Google AdSense                          | -         |
| Despliegue      | Next.js Standalone + Firebase Hosting   | -         |

---

## Árbol de Directorios Completo

```
D:\Proyectos\Electro_Quiz
├── src/                               # Código fuente principal
│   ├── app/                           # Next.js App Router
│   │   ├── globals.css                # Estilos globales Tailwind v4
│   │   ├── layout.tsx                 # Layout raíz (fuentes, analytics, ads, cookies, footer)
│   │   ├── page.tsx                   # Landing page (hero, features, CTA)
│   │   ├── login/
│   │   │   └── page.tsx               # Login con Google OAuth
│   │   ├── politica-privacidad/
│   │   │   └── page.tsx               # Política de privacidad
│   │   ├── administrador/
│   │   │   └── page.tsx               # Panel admin (CRUD usuarios)
│   │   ├── teacher/
│   │   │   ├── page.tsx               # Dashboard docente (CRUD quizzes)
│   │   │   ├── create/
│   │   │   │   └── page.tsx           # Crear quiz + preguntas
│   │   │   └── quiz/
│   │   │       └── [id]/
│   │   │           ├── edit/
│   │   │           │   └── page.tsx   # Editar quiz y preguntas
│   │   │           ├── live/
│   │   │           │   └── page.tsx   # Sesión en vivo (PIN, lobby, preguntas)
│   │   │           └── resultados/
│   │   │               └── page.tsx   # Resultados con análisis y ranking
│   │   └── student/
│   │       ├── page.tsx               # Portal estudiante (unirse por PIN)
│   │       └── quiz/
│   │           └── [code]/
│   │               ├── page.tsx       # Lobby del quiz (espera)
│   │               ├── loading.tsx
│   │               ├── play/
│   │               │   └── page.tsx   # Responder preguntas en vivo
│   │               └── podio/
│   │                   └── page.tsx   # Resultados personales y podio
│   │
│   ├── components/                    # Componentes React
│   │   ├── ui/                        # Primitivas shadcn/ui
│   │   │   ├── badge.tsx, button.tsx, card.tsx
│   │   │   ├── input.tsx, label.tsx, progress.tsx
│   │   │   ├── radio-group.tsx, select.tsx, textarea.tsx
│   │   │   ├── back-button.tsx        # Botón volver con history.back()
│   │   │   └── table.tsx              # Tabla simple
│   │   ├── navigation.tsx             # Barra sticky con avatar, rol, logout
│   │   ├── footer.tsx                 # Footer global con política de privacidad
│   │   ├── ProtectedRoute.tsx         # Guard de rutas por rol
│   │   ├── cookie-banner.tsx          # Banner de consentimiento cookies
│   │   ├── adsense-loader.tsx         # Carga condicional de AdSense
│   │   ├── firebase-config.tsx        # Config service worker Firebase Hosting
│   │   ├── theme-provider.tsx         # Provider de temas (next-themes)
│   │   ├── question-templates.tsx     # Plantillas de preguntas de física
│   │   └── live-leaderboard.tsx       # Leaderboard en vivo (simulado)
│   │
│   └── lib/                           # Utilidades y servicios
│       ├── firebase.js                # Inicialización Firebase (app, auth, db, rtdb)
│       ├── actions.ts                 # (vacío - preparado para Server Actions)
│       ├── salirQuiz.ts               # Utilidad para salir de un quiz
│       └── utils.ts                   # Función cn() para clases condicionales
│
├── functions/                         # Firebase Cloud Functions
│   ├── index.js                       # cleanupLobbySessions (cada 1h)
│   └── package.json                   # Dependencias (firebase-admin, firebase-functions)
│
├── public/                            # Archivos estáticos
├── styles/
│   └── globals.css
├── docs/                              # Documentación (ver docs/README.md)
│   ├── guias/                         # Setup, Docker
│   ├── arquitectura/                  # Diseño técnico
│   ├── dominio/                       # Negocio y flujos
│   ├── backend/                       # API, auth, MongoDB
│   ├── frontend/                      # Rutas y componentes
│   ├── tiempo-real/                   # Socket.io, sesiones live
│   └── legacy/                        # Era Firebase (histórico)
├── out/                               # Build output (legacy export)
├── .next/                             # Build output (standalone)
│
├── next.config.mjs                    # Config Next.js (standalone)
├── tailwind.config.ts                 # Config Tailwind (src/ content)
├── tsconfig.json                      # Config TypeScript
├── postcss.config.mjs                 # Config PostCSS
├── components.json                    # Config shadcn/ui
├── firebase.json                      # Config Firebase Hosting + Functions
├── .firebaserc                        # Proyecto Firebase asociado
├── .env.example                       # Variables de entorno requeridas
└── package.json                       # Dependencias y scripts
```

---

## Configuración Clave

### next.config.mjs
```js
output: 'standalone'       // Servidor Node.js optimizado (no estático)
trailingSlash: true
eslint.ignoreDuringBuilds: true
typescript.ignoreBuildErrors: true
images.unoptimized: true
images.domains: ['lh3.googleusercontent.com']  // Avatares Google
```

### Estructura de Firebase
```
Firebase Project
├── Authentication
│   └── Google Provider (dominio @uniautonoma.edu.co)
├── Firestore Database
│   ├── usuarios/          { nombre, correo, rol, creadoEn }
│   ├── quizzes/           { title, description, authorId, status, createdAt }
│   ├── questions/         { quizId, question, questionType, options, correctOption, ... }
│   ├── sessions/          { quizId, pin, sessionName, status, players[], currentQuestion, ... }
│   │   └── userAnswers/   { playerId, playerName, answers[], totalScore, lastUpdated }
│   └── _meta/servertime   (sincronización de tiempo)
├── Realtime Database
│   └── realtime-sessions/
│       └── [pin]/
│           └── players/   { uid: true } (conexiones activas)
└── Cloud Functions
    └── cleanupLobbySessions (cron: cada 1 hora)
```
