# Sistema de Componentes

## Árbol de Componentes Global

```
<RootLayout>                              // src/app/layout.tsx
├── <head>
│   ├── Google AdSense Script             // Carga inicial (placeholder)
│   └── viewport meta (mobile)

├── <body>
│   ├── <AdsenseLoader />                 // Carga condicional si aceptó cookies
│   │
│   ├── <div> wrapper (max-w móvil)
│   │   ├── <Suspense>
│   │   │   └── [Page Content]
│   │   │       ├── <Navigation pin? />   // Sticky header con avatar + rol
│   │   │       ├── [Route-specific pages]
│   │   │       └── <Footer />            // Footer con política de privacidad
│   │   └── <CookieBanner />              // Banner consentimiento cookies
│   │
│   ├── <Analytics />                     // @vercel/analytics
│   ├── <SpeedInsights />                 // @vercel/speed-insights
│   └── <Toaster />                       // sonner notificaciones
```

---

## Componentes Personalizados

### 1. `Navigation`
- **Archivo**: `src/components/navigation.tsx`
- **Props**: `{ pin?: string }` (PIN opcional para limpieza al salir)
- **Función**: Barra de navegación superior sticky con:
  - Logo ElectroQuiz (Zap icon + texto truncable)
  - Enlaces según rol (Docente/Estudiante/Administrador)
  - Avatar de Google + nombre (click → panel flotante con cerrar sesión)
- **Seguridad**: Escucha `onAuthStateChanged`, detecta `beforeunload` y cambios de ruta para ejecutar `salirQuiz(pin)`
- **Panel de usuario**: Modal flotante con foto, nombre, email, botón "Cerrar sesión"

### 2. `ProtectedRoute`
- **Archivo**: `src/components/ProtectedRoute.tsx`
- **Props**: `{ children, allowedRoles: string[] }`
- **Función**: HOC que protege rutas por rol
- **Flujo**:
  1. Verifica `auth.currentUser` — si no existe, redirige a `/login`
  2. Lee `usuarios/{uid}` de Firestore
  3. Si el rol no está en `allowedRoles`, redirige a `/acceso-denegado`

### 3. `Footer`
- **Archivo**: `src/components/footer.tsx`
- **Props**: Ninguna
- **Función**: Footer global con enlace a política de privacidad

### 4. `CookieBanner`
- **Archivo**: `src/components/cookie-banner.tsx`
- **Función**: Banner de consentimiento de cookies
- **Almacenamiento**: `localStorage` key `eq_cookie_consent_v1`
- **Estados**: `accepted` | `rejected` | `null` (no decidido)
- **Evento**: Dispara `eq-consent-changed` para que `AdsenseLoader` reaccione

### 5. `AdsenseLoader`
- **Archivo**: `src/components/adsense-loader.tsx`
- **Función**: Carga `adsbygoogle.js` solo si el consentimiento es `accepted`
- **Dependencia**: Escucha el evento `eq-consent-changed` del CookieBanner

### 6. `ThemeProvider`
- **Archivo**: `src/components/theme-provider.tsx`
- **Props**: `ThemeProviderProps` de next-themes
- **Estado**: Declarado pero no utilizado en layout actual

### 7. `QuestionTemplates`
- **Archivo**: `src/components/question-templates.tsx`
- **Props**: `{ onSelectTemplate: (template) => void }`
- **Función**: Galería de plantillas de preguntas de física (Ley de Coulomb, Campo Eléctrico, etc.)
- **Nota**: Componente legacy, no usado en el flujo actual

### 8. `LiveLeaderboard`
- **Archivo**: `src/components/live-leaderboard.tsx`
- **Props**: `{ students: Student[], isLive?: boolean }`
- **Función**: Tabla de clasificación con animaciones (simuladas)
- **Nota**: Componente legacy (simulación), el leaderboard real se maneja en páginas de resultados

### 9. `FirebaseConfig`
- **Archivo**: `src/components/firebase-config.tsx`
- **Función**: Registra service worker y meta tags para Firebase Hosting
- **Retorna**: `null` (invisible)

---

## Primitivas UI (shadcn/ui)

Todas en `src/components/ui/`. Son componentes puramente visuales.

| Componente   | Archivo            | Dependencia        | Variantes                       |
|-------------|--------------------|--------------------|--------------------------------|
| Badge       | badge.tsx          | class-variance-authority | default, secondary, destructive, outline |
| Button      | button.tsx         | @radix-ui/react-slot, cva | default, destructive, outline, secondary, ghost, link |
| Card        | card.tsx           | -                  | Header, Title, Description, Content, Footer |
| Input       | input.tsx          | -                  | Default con focus ring          |
| Label       | label.tsx          | @radix-ui/react-label | Default                       |
| Progress    | progress.tsx       | @radix-ui/react-progress | Default con indicador        |
| RadioGroup  | radio-group.tsx    | @radix-ui/react-radio-group | Item + Indicator           |
| Select      | select.tsx         | @radix-ui/react-select | Trigger, Content, Item, Value  |
| Textarea    | textarea.tsx       | -                  | Default con focus ring          |
| BackButton  | back-button.tsx    | -                  | Botón con history.back()        |
| Table       | table.tsx          | -                  | Header, Body, Row, Head, Cell   |
