# Rutas del frontend

App Router (`src/app`). URLs con trailing slash en producción (config Next).

## Públicas

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/` | `app/page.tsx` | Landing marketing |
| `/login` | `app/login/page.tsx` | Inicio de sesión |
| `/registro` | `app/registro/page.tsx` | Registro |
| `/politica-privacidad` | `app/politica-privacidad/page.tsx` | Legal |

## Docente (`ProtectedRoute`: docente)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/teacher` | `teacher/page.tsx` | Lista de quizzes del autor |
| `/teacher/create` | `teacher/create/page.tsx` | Crear quiz + preguntas |
| `/teacher/quiz/[id]/edit` | `teacher/quiz/[id]/edit/page.tsx` | Editar quiz |
| `/teacher/quiz/[id]/live` | `teacher/quiz/[id]/live/page.tsx` | Sesión en vivo |
| `/teacher/quiz/[id]/resultados` | `teacher/quiz/[id]/resultados/page.tsx` | Resultados agregados |

Componentes compartidos:

- `teacher/_components/quiz-form-shared.tsx`

## Estudiante (`ProtectedRoute`: estudiante)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/student` | `student/page.tsx` | Unirse con PIN |
| `/student/quiz/[code]` | `student/quiz/[code]/page.tsx` | Lobby |
| `/student/quiz/[code]/play` | `student/quiz/[code]/play/page.tsx` | Jugar |
| `/student/quiz/[code]/podio` | `student/quiz/[code]/podio/page.tsx` | Resultados / podio |
| `/student/quiz/[code]/loading` | `student/quiz/[code]/loading.tsx` | Loading UI |

## Administrador (`ProtectedRoute`: admin)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/administrador` | `administrador/page.tsx` | CRUD usuarios, cambio de rol |

## Layout global

| Archivo | Contenido |
|---------|-----------|
| `app/layout.tsx` | Fuente, metadata, providers |
| `app/globals.css` | Tema institucional, utilidades |

## Componentes globales

| Componente | Uso |
|------------|-----|
| `components/navigation.tsx` | Nav por rol |
| `components/ProtectedRoute.tsx` | Guard de rutas |
| `components/footer.tsx` | Pie |
| `components/ui/*` | shadcn/Radix |

## Hooks

| Hook | Archivo | Uso |
|------|---------|-----|
| `useSesionLive` | `hooks/useSesionLive.ts` | Poll sesión + heartbeat |

## Lib cliente clave

| Módulo | Uso |
|--------|-----|
| `lib/client/api.ts` | HTTP base |
| `lib/client/auth.ts` | Sesión usuario |
| `lib/client/services/*` | Llamadas API |
| `lib/client/mappers/pregunta-ui.ts` | Preguntas UI |
| `lib/salirQuiz.ts` | Salir de lobby |

## Estilos

Clases recurrentes en `globals.css`:

- `page-shell`, `page-main` — layout páginas
- `heading-primary`, `heading-secondary` — títulos
- `card-institutional`, `btn-primary`, `input-institutional`
- `quiz-layout`, `quiz-content` — pantalla play
