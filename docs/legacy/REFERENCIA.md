# Referencia Completa del Proyecto

## 1. Inventario de Archivos (Completo)

### 1.1 Raíz del Proyecto (15 archivos)

| Archivo | Propósito | Estado |
|---------|-----------|--------|
| `next.config.mjs` | Configuración Next.js (standalone, imágenes, TypeScript) | Activo |
| `tsconfig.json` | TypeScript config (paths `@/*`, JSX preserve) | Activo |
| `tailwind.config.ts` | Apunta content a `./src/**/*.{js,ts,jsx,tsx,mdx}` | Activo |
| `postcss.config.mjs` | Plugin `@tailwindcss/postcss` | Activo |
| `package.json` | Dependencias y scripts | Activo |
| `components.json` | Configuración shadcn/ui (aliases @/components, @/lib) | Activo |
| `firebase.json` | Hosting + Functions configuración | Activo |
| `.firebaserc` | Proyecto Firebase: `calculo-de-fuerzas-electricas` | Activo |
| `.env.example` | Variables de entorno requeridas | Activo |
| `.env.local` | Variables locales (no commiteado) | Activo |
| `.gitignore` | Ignora node_modules, .next, out, .env.local | Activo |
| `next-env.d.ts` | Declaraciones TypeScript de Next.js | Generado |
| `README.md` | README generado por v0.app (no actualizado) | Stale |
| `package-lock.json` | Lock file npm | Generado |
| `pnpm-lock.yaml` | Lock file pnpm | Generado |

### 1.2 Archivos Legacy / Stale (no eliminados)

| Archivo | Problema | Acción Recomendada |
|---------|----------|--------------------|
| `lib/firebase.js` | Versión antigua (solo app + analytics, sin auth/db/rtdb). La versión real está en `src/lib/firebase.js` | Eliminar |
| `styles/globals.css` | Duplicado de tema con colores **OKLCH** (Tailwind v4 default). La versión real usada está en `src/app/globals.css` con colores personalizados en HEX | Eliminar |
| `README.md` | Generado por v0.app, no refleja el proyecto actual | Actualizar o eliminar |
| `out/` | Build antiguo con `output: 'export'`. Ahora se usa `output: 'standalone'` con directorio `.next/` | Eliminar |

### 1.3 Assets Públicos (`public/`)

| Archivo | Uso | Referenciado en |
|---------|-----|-----------------|
| `logo_google.png` | Logo de Google para botón de login | `src/app/login/page.tsx` |
| `logo_universidad.png` | Logo de la universidad | `src/app/login/page.tsx` |
| `Logo_U.png` | Logo alternativo universidad | No referenciado actualmente |
| `placeholder-logo.png` | Placeholder logo | No referenciado |
| `placeholder-logo.svg` | Placeholder logo vector | No referenciado |
| `placeholder-user.jpg` | Avatar placeholder | No referenciado (se usa `default-avatar.png` en código) |
| `placeholder.jpg` | Placeholder genérico | No referenciado |
| `placeholder.svg` | Placeholder vector | No referenciado |

⚠️ **Nota**: El componente `Navigation` referencia `/default-avatar.png` pero ese archivo **no existe** en `public/`.

---

## 2. Sistema de Puntuación (Scoring)

### 2.1 Fórmula de Cálculo

```
puntosObtenidos = correct ? round((timeLeft / timeLimit) * basePoints) : 0

Donde:
  timeLeft    = segundos restantes cuando el estudiante respondió
  timeLimit   = tiempo límite de la pregunta (15, 30, 45 o 60 seg)
  basePoints  = puntos base definidos por el creador (100, 200, 300 o 500)
  correct     = boolean: ¿la respuesta es correcta?
```

### 2.2 Ejemplos

| timeLeft | timeLimit | basePoints | correct | Puntos |
|----------|-----------|------------|---------|--------|
| 25       | 30        | 100        | true    | 83     |
| 5        | 30        | 100        | true    | 17     |
| 30       | 30        | 500        | true    | 500    |
| cualquier| cualquier | cualquier  | false   | 0      |

### 2.3 Validación de Respuestas

**Opción múltiple / Verdadero-Falso**:
```
correct = respuesta.id === pregunta.correctOption
```

**Numérica**:
```
studentValue = parseFloat(respuesta.replace(",", "."))
correctValue = parseFloat(pregunta.correctValue)
correct = studentValue === correctValue  // comparación exacta (sin tolerancia)
```

⚠️ **Nota**: El campo `tolerance` existe en la interfaz pero **no se aplica** en la validación real.

---

## 3. Sistema de Tiempo Real (Timer Sincronizado)

### 3.1 Mecanismo

En lugar de usar `setTimeout`/`setInterval` locales (que se desincronizan), el timer se basa en **reloj del servidor**:

```
1. Docente inicia pregunta:
   updateDoc(sessions/{pin}, {
     qScheduledAt: Timestamp.fromMillis(now + serverOffset + 2000ms),
     qTimeLimitSec: 30
   })

2. Todos los clientes (docente y estudiantes) calculan:
   elapsedMs = (Date.now() + serverOffset) - qScheduledAt.toMillis()
   remaining = max(0, ceil(qTimeLimitSec - elapsedMs / 1000))

3. Tick cada 250ms para precisión

4. Cuando remaining <= 0 → auto-avanza (con guard isTransitioningRef)
```

### 3.2 Cálculo de Server Offset

```typescript
async function computeServerOffsetMs() {
  const ref = doc(db, "_meta", "servertime")
  await setDoc(ref, { now: serverTimestamp() }, { merge: true })
  const snap = await getDoc(ref)
  const serverNow = snap.data()?.now?.toMillis?.() ?? Date.now()
  return serverNow - Date.now()
}
```

---

## 4. Utilidades (`src/lib/`)

### 4.1 `firebase.js`
- Inicializa Firebase con todas las dependencias
- **Exports**: `app`, `db` (Firestore), `auth` (Auth), `rtdb` (Realtime Database), `provider` (GoogleAuthProvider), `signInWithPopup`, `signOut`, `doc`, `getDoc`, `setDoc`

### 4.2 `salirQuiz.ts`
```typescript
export async function salirQuiz(pin: string)
```
- Elimina al jugador actual del array `players` en Firestore
- Elimina el nodo del jugador en RTDB
- Se ejecuta en: `beforeunload`, `popstate`, cambio de ruta, clic en "Salir del Quiz"

### 4.3 `utils.ts`
- Función `cn()`: Combina `clsx` + `tailwind-merge` para clases condicionales

### 4.4 `actions.ts`
- **Archivo vacío** — preparado para futuras Server Actions de Next.js

---

## 5. Archivos de Configuración Detallados

### 5.1 `tailwind.config.ts`
```typescript
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {} },
  plugins: [],
}
```
Apunta a `src/` — crucial para que Tailwind escanee los archivos correctos.

### 5.2 `components.json` (shadcn/ui)
```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "css": "app/globals.css",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 5.3 `.firebaserc`
```json
{
  "projects": {
    "Electro_Quiz": "calculo-de-fuerzas-electricas",
    "default": "calculo-de-fuerzas-electricas"
  }
}
```
Proyecto Firebase: `calculo-de-fuerzas-electricas`

### 5.4 `firebase.json`
- **Hosting**: Sirve desde `.next/` (standalone), rewrites a `index.html`, cleanUrls
- **Functions**: Source en `functions/`

---

## 6. Diferencia entre los dos `globals.css`

| Aspecto | `src/app/globals.css` (EN USO) | `styles/globals.css` (STALE) |
|---------|-------------------------------|------------------------------|
| Colores | HEX personalizados (cyan/indigo) | OKLCH (default Tailwind v4) |
| Primary | `#0891b2` (cyan) | `oklch(0.205 0 0)` (negro) |
| Secondary | `#6366f1` (indigo) | `oklch(0.97 0 0)` (gris claro) |
| @theme | Sí | Sí |
| Estilos extra | overflow-x, text-size-adjust, truncate-1 | No |
| Usado por | `layout.tsx` (`import "./globals.css"`) | No importado por ningún layout |

El archivo en uso es `src/app/globals.css`. El de `styles/` es un remanente.

---

## 7. Loading States

### `src/app/student/quiz/[code]/loading.tsx`
```tsx
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Uniendo al quiz...</p>
      </div>
    </div>
  )
}
```
- Ruta: `/student/quiz/[code]` → muestra spinner mientras carga el lobby

⚠️ **Nota**: Existen referencias a `loading.tsx` en `src/app/student/quiz/[code]/waiting/` y `leaderboard/` en documentación previa, pero esos archivos **ya no existen** en el código actual.

---

## 8. Convenciones de Estilo y Diseño

### Layout Móvil
```
<div className="mx-auto w-full sm:max-w-full max-w-[420px] px-4 sm:px-0">
```
- En móvil: ancho máximo de 420px con padding lateral
- En desktop (sm+): ancho completo sin límite

### Formato de Preguntas
```css
whitespace-pre-wrap wrap-break-word
```
- Preserva espacios y saltos de línea del texto ingresado por el docente
- Rompe palabras largas para evitar desbordes

### Notificaciones (sonner)
```tsx
<Toaster richColors position="top-right" closeButton />
```
- Configurado en `layout.tsx`
- Uso: `toast.success()`, `toast.error()`, `toast.warning()`

### AdSense
- Script de AdSense cargado en `<head>` del layout
- El componente `AdsenseLoader` solo carga `adsbygoogle.js` si el usuario aceptó cookies (`eq_cookie_consent_v1 === "accepted"`)

---

## 9. Comandos de Despliegue Firebase

```bash
# Primer despliegue (o después de cambiar config)
firebase deploy --only hosting

# Desplegar Cloud Functions
firebase deploy --only functions

# Desplegar todo
firebase deploy

# Emuladores locales
firebase emulators:start
```

### Variables de Entorno para Producción
```bash
# En Firebase Console > Functions > Config (si usas entorno)
# O configurar en .env.local para build
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
# ... todas las vars de Firebase
```
