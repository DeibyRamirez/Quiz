# Desarrollo local

## Requisitos

- Node.js 18+
- MongoDB accesible (local o Atlas)
- npm

## Setup

```bash
git clone <repo>
cd Electro_Quiz
npm install
```

Crear `.env.local`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/Electroquiz
JWT_SECRET=desarrollo-cambiar-en-produccion
# Opcional
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

Verificar Mongo:

```bash
npm run test:mongo
```

Arrancar dev (Next + Socket.io):

```bash
npm run dev
```

App: http://localhost:3000 — WebSocket en path `/api/socket`.

Probar desde móvil en la misma red:

```bash
npm run dev:mobile
```

**Importante:** no uses `next dev` solo; el WebSocket requiere `server.ts`.

## Build producción

```bash
npm run build
npm run start
```

Output `standalone` en `.next/standalone` para Docker.

## Docker (stack local o producción)

Guía completa: **[docker.md](./docker.md)**

```bash
cp .env.docker.example .env.docker
docker compose up --build
```

- **Un contenedor `app`:** Next.js + API + Socket.io (`server.ts`).
- **MongoDB aparte:** servicio `mongo` en compose (local) o Atlas (producción).

## Estructura mental para cambios

| Si cambias… | Revisa también… |
|-------------|-----------------|
| Modelo Mongoose | `types/*`, validator Zod, serializar |
| API route | `lib/client/services/*` |
| Tipo pregunta UI | `pregunta-ui.ts`, `Pregunta.ts`, calificar-respuesta |
| Sesión live | `useSesionLive`, `sesion-helpers`, páginas live/play |
| Auth | `jwt.ts`, cookies en login/logout |

## Typecheck

El build ignora errores TS (`ignoreBuildErrors: true`). Para revisar:

```bash
npx tsc --noEmit
```

Algunos errores en `out/types` o tipos legacy pueden aparecer; enfocarse en `src/`.

## Trailing slash

`next.config.mjs` → `trailingSlash: true`.

El cliente **debe** usar `contruirUrlApi()`:

- Correcto: `/quizzes/?autorId=xxx`
- Incorrecto: `/quizzes?autorId=xxx/` (bug histórico)

## Depurar sesiones live

1. Abrir Network: polling `GET /api/sesiones/[pin]/`
2. Verificar `serverTime`, `qScheduledAt`, `currentQuestion`
3. Compass: colecciones `sesionlives`, `participantesesions`
4. Heartbeat cada 15 s en lobby/play

## Depurar auth

1. Cookie `eq_token` en Application → Cookies
2. `GET /api/auth/me/`
3. Si 401: login de nuevo

## Logs útiles

- API: errores en `manejarErrorApi` → consola servidor
- Cliente: `ApiError` con `status` y `detalles`

## Migración Firebase

Sesiones ya no usan Firestore/RTDB en teacher/student. Firebase SDK:

- `lib/client/firebase.js` — legacy
- `app/page.tsx` — log de conexión en home

Eliminar Firebase del proyecto cuando se retire OAuth Google legacy.

## Próximos pasos técnicos (referencia)

1. Socket.io + Redis para tiempo real escalable
2. JWT corto de sesión de quiz
3. Tests E2E (Playwright) para flujo PIN → play → podio
4. Habilitar `typescript` strict en build CI
5. Índice duplicado warning en `ParticipanteSesion.quizId` — limpiar schema

## Documentación

- [Índice general](../README.md)
- [Guías](./README.md) · [Arquitectura](../arquitectura/README.md) · [Tiempo real](../tiempo-real/README.md)
