# Stack y herramientas

## Runtime y framework

| Herramienta | Versión | Uso |
|-------------|---------|-----|
| Node.js | 18+ recomendado | Runtime |
| Next.js | 14.2.x | App Router, API routes, build |
| React | 18 | UI |
| TypeScript | 5.x | Tipado |

## Base de datos y auth

| Herramienta | Uso |
|-------------|-----|
| MongoDB | Persistencia principal |
| Mongoose | ODM, esquemas, índices |
| jose | Firmar/verificar JWT |
| bcryptjs | Hash de contraseñas |

## UI y estilos

| Herramienta | Uso |
|-------------|-----|
| Tailwind CSS 4 | Utilidades |
| Radix UI | Primitivos accesibles |
| shadcn-style components | `src/components/ui/*` |
| lucide-react | Iconos |
| geist | Fuente |
| sonner | Toasts (admin) |
| next-themes | Tema (si se usa) |

## Validación y forms

| Herramienta | Uso |
|-------------|-----|
| Zod | Validación API (`lib/server/validators`) |
| react-hook-form | Formularios (donde aplique) |

## Legacy / parcial

| Herramienta | Estado |
|-------------|--------|
| Firebase (client SDK) | Instalado; sesiones ya no dependen de Firestore/RTDB |
| firebase-admin | En dependencias; uso principal migrado a Mongo |

## Scripts npm

```bash
npm run dev          # Next.js + Socket.io (server.ts) — usar siempre para live
npm run dev:mobile   # Dev en 0.0.0.0 (probar desde móvil)
npm run build        # Build producción
npm run start        # Next + Socket.io en producción
npm run lint         # ESLint
npm run test:mongo   # Prueba conexión Mongo
```

**No uses** `next dev` / `next start` aislados: WebSocket no arranca sin `server.ts`.

## Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `MONGODB_URI` | Sí | URI completa, ej. `mongodb://.../Electroquiz` (respetar nombre de BD) |
| `JWT_SECRET` | Sí | Secreto para firmar tokens |
| `NEXT_PUBLIC_API_URL` | No | Base API; default `http://localhost:3000/api` |
| `PORT` | No | Puerto para URL API por defecto |
| `NEXT_PUBLIC_FIREBASE_*` | Solo si usas Firebase en home/OAuth | Config Firebase web |

Ejemplo conceptual:

```env
MONGODB_URI=mongodb://localhost:27017/Electroquiz
JWT_SECRET=tu-secreto-largo-y-aleatorio
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

## Configuración Next.js relevante

Archivo: `next.config.mjs`

- `trailingSlash: true` — rutas y API con barra final.
- `output: 'standalone'` — despliegue optimizado.
- `typescript.ignoreBuildErrors: true` — el build no falla por TS (revisar con `tsc` en CI si se desea).

## Herramientas de desarrollo

| Herramienta | Uso |
|-------------|-----|
| Cursor / VS Code | IDE |
| MongoDB Compass / mongosh | Inspeccionar colecciones |
| DevTools Network | Depurar polling y API |

## Analytics (opcional en producción)

- `@vercel/analytics`
- `@vercel/speed-insights`
