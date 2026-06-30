# Sesiones en vivo

Sistema tipo Kahoot: docente genera PIN, estudiantes entran en lobby, quiz sincronizado con timer compartido.

> **Tiempo real:** ver [websockets.md](./websockets.md) · **Reconexión:** [reconexion-y-sincronizacion.md](./reconexion-y-sincronizacion.md)

## Estados de sesión

| `status` | Descripción |
|----------|-------------|
| `lobby` | Esperando jugadores; se puede unir/salir |
| `active` | Pregunta en curso; timer activo |
| `ended` | Finalizado; resultados disponibles |

## Ciclo de vida

1. **Crear** — `POST /api/sesiones` desde `teacher/quiz/[id]/live`
2. **Lobby** — estudiante `POST /unirse`; docente edita `sessionName`
3. **Start** — `PATCH { action: "start" }` si hay jugadores y nombre
4. **Play** — **Socket.io** empuja `sesion:update` (`currentQuestion`, timer)
5. **Responder** — estudiante `POST /respuestas` (una vez por `questionId`)
6. **Avanzar** — timer del docente llega a 0 → `PATCH next`; o botón "Siguiente"
7. **End** — última pregunta → `status: ended` automático
8. **Resultados** — teacher `/resultados`, student `/podio`

## Sincronización (Socket.io + Mongo)

| Capa | Responsabilidad |
|------|-----------------|
| **MongoDB** | Persistir sesión, jugadores, respuestas |
| **API REST** | Escribir Mongo en eventos (start, next, unirse…) |
| **Socket.io** | Notificar a la sala `sesion:{pin}` con `sesion:update` |
| **Cliente** | `useSesionLive` + `useSesionTimer` |

Ya **no** se usa polling cada 1 s como canal principal. Hay fallback REST cada 10 s solo si el WebSocket no conecta.

## Timer sincronizado

No se guarda `timeLeft` en Mongo en cada segundo.

| Campo | Rol |
|-------|-----|
| `qScheduledAt` | Momento en que **empieza** el countdown de la pregunta actual |
| `qTimeLimitSec` | Duración total de esa pregunta |
| `serverTime` | En cada `sesion:update`; cliente calcula offset |

Fórmula cliente:

```
elapsed = (Date.now() + serverOffsetMs) - qScheduledAt
timeLeft = max(0, ceil(qTimeLimitSec - elapsed/1000))
```

Delays al programar:

- **Start:** +2000 ms (margen de red)
- **Next:** +800 ms

## Presencia de jugadores

| Acción | Efecto |
|--------|--------|
| `POST /unirse` | Agrega jugador en Mongo + emite socket |
| `sesion:heartbeat` o `POST /heartbeat` | Actualiza `lastSeenAt`; en lobby emite socket |
| `POST /salir` | Remueve de `players` en lobby + emite socket |

En **lobby**, jugadores sin heartbeat ~45 s se ocultan al serializar. En **active**, no se filtran por timeout.

## Reconexión

Documentación detallada: **[reconexion-y-sincronizacion.md](./reconexion-y-sincronizacion.md)**

### Docente

1. Al volver a `/teacher/quiz/[id]/live`, `POST /sesiones` **reutiliza** la sesión `lobby` o `active` existente (mismo PIN).
2. Banner *"Sesión en curso — reconectado"* si la sesión ya estaba activa.
3. Socket emite `sesion:join` → snapshot con pregunta y timer actuales.

### Estudiante

1. **Panel `/student`:** detecta `eq_sesion_pin` en localStorage → botón *Reconectar al quiz*.
2. **`POST /unirse`:** permite reingreso en `active`/`ended` si el usuario ya participó.
3. **Play directo:** `unirseSesion` al montar + `GET /progreso` restaura respuestas.
4. Socket reconecta automáticamente tras caída de red.

### Transporte (socket)

1. Socket.io reconecta automáticamente.
2. Hook emite `sesion:join` de nuevo → snapshot desde Mongo.
3. Fallback REST cada 10 s si el WebSocket no conecta.

## Calificación

Servidor (`calificar-respuesta.ts`) valida al guardar en Mongo. El socket no transporta respuestas.

## Páginas relacionadas

| Ruta | Rol |
|------|-----|
| `/teacher/quiz/[id]/live` | Control docente |
| `/teacher/quiz/[id]/resultados` | Análisis agregado |
| `/student` | Input PIN |
| `/student/quiz/[code]` | Lobby |
| `/student/quiz/[code]/play` | Responder |
| `/student/quiz/[code]/podio` | Resultados personales |

## Hook `useSesionLive`

```ts
const { sesion, serverOffsetMs, loading, socketConnected, refresh } =
  useSesionLive(pin, { heartbeat: true });
```

- Carga inicial: REST
- Updates: `sesion:update` vía WebSocket
- `socketConnected`: útil para depuración

## Arranque del servidor

```bash
npm run dev      # Next + Socket.io
npm run start    # Producción
```

No usar `next dev` aislado: WebSocket no estará disponible.
