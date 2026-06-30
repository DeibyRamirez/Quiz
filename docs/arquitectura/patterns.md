# Patrones de código

Convenciones usadas en Electro Quiz para mantener el código predecible entre frontend, API y Mongo.

## Organización por dominio

| Dominio | Tipos | Modelo | Validator | Service cliente | API |
|---------|-------|--------|-----------|-----------------|-----|
| Usuario | `types/usuario.ts` | `Usuario.ts` | `validators/usuario.ts` | `services/usuarios.ts` | `api/usuarios` |
| Quiz | `types/quiz.ts` | `Quiz.ts` | `validators/quiz.ts` | `services/quizzes.ts` | `api/quizzes` |
| Pregunta | `types/pregunta.ts` | `Pregunta.ts` | `validators/pregunta.ts` | `services/preguntas.ts` | `api/preguntas` |
| Sesión | `types/sesion.ts` | `SesionLive`, `ParticipanteSesion` | `validators/sesion.ts` | `services/sesiones.ts` | `api/sesiones` |

## Patrón API Route Handler

```ts
export async function POST(request: Request) {
  try {
    await conectarDB();
    const body = await request.json();
    const datos = schema.parse(body);
    // lógica + modelo
    return NextResponse.json(serializarDocumento(doc));
  } catch (error) {
    return manejarErrorApi(error);
  }
}
```

- **Zod** para entrada; errores 400 con `detalles` flatten.
- **Auth** vía `requerirAuth()` / `requerirRol()` cuando hace falta.
- **AuthError** → respuesta con status 401/403.

## Patrón cliente API

```ts
// lib/client/services/quizzes.ts
export async function obtenerQuiz(id: string) {
  return apiRequest<QuizConPreguntas>(`/quizzes/${id}`);
}
```

- Siempre rutas con trailing slash implícito en `contruirUrlApi`.
- `credentials: "include"` para enviar cookie JWT.
- `cache: "no-store"` en fetch.

## Mapper UI ↔ API (preguntas)

Las preguntas tienen **dos representaciones**:

1. **Mongo/API** (`TipoPregunta`: `multiple_opcion`, `verdadero_falso`, `respuesta_corta`)
2. **Formulario/Play UI** (`QuestionTypeUi`: `multiple-choice`, `true-false`, `numerical`, `exact-text`)

El mapper `pregunta-ui.ts` centraliza la traducción:

- `preguntaApiToUi` — leer desde API
- `preguntaUiToCrear` / `preguntaUiToActualizar` — escribir a API
- `verificarRespuestaUi` — calificar en cliente (preview)
- Servidor usa `calificar-respuesta.ts` (misma lógica vía `verificarRespuestaUi`)

**No duplicar** lógica de tipos en páginas; usar el mapper.

## Patrón de entidades base

`types/base.ts`:

- `EntidadBase` con `id`
- `Timestamps` opcional (`createdAt`, `updatedAt` de Mongoose)
- `OmitEntidadPersistida` para tipos `Crear*`

## Patrón de serialización

Mongo `_id` → API `id` string. Nunca exponer `__v` ni `contraseña` (excepto select explícito en login).

## Patrón de sesión en vivo (cliente)

Hook `useSesionLive(pin, { heartbeat })`:

- Poll GET sesión cada 1 s
- Opcional heartbeat cada 15 s
- Calcula `serverOffsetMs` desde `serverTime`

Páginas live/play/lobby **no** suscriben Firebase; dependen del hook + servicios.

## Patrón de protección de rutas

`ProtectedRoute` (client):

1. `obtenerUsuarioActual()` → `GET /api/auth/me`
2. Compara `usuario.rol` con `allowedRoles`
3. Redirige a `/login` o `/acceso-denegado`

Cache de sesión en `lib/client/auth.ts` (`sesionCache`) para evitar llamadas repetidas en la misma sesión de navegador.

## Patrón de formularios docente

`teacher/_components/quiz-form-shared.tsx` compartido entre:

- `teacher/create/page.tsx`
- `teacher/quiz/[id]/edit/page.tsx`

Estado local `QuestionUi[]` + envío vía servicios preguntas/quizzes.

## Nombres y idioma

- Código y tipos: español (`titulo`, `preguntas`, `sesionPin`) mezclado con inglés técnico (`status`, `players`) por compatibilidad con flujo Kahoot/Firebase legacy.
- Rutas URL: inglés (`teacher`, `student`, `live`, `resultados`).

## Qué evitar

- Construir URLs API manualmente sin `contruirUrlApi` (bug histórico: query + slash).
- Calificar solo en cliente sin `POST /respuestas` (puntaje no persistiría).
- Asumir `uid` en jugadores; usar `userId` (Mongo user id).
- Escrituras Mongo en cada tick del timer (usar `qScheduledAt` + poll).
