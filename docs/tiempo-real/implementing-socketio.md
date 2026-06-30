# Cómo implementar Socket.io en otro proyecto

Guía portable para integrar **Socket.io** en aplicaciones web con Node.js — basada en la arquitectura probada en **Electro Quiz**, pero aplicable a chats, dashboards en vivo, juegos multijugador, notificaciones, colaboración en tiempo real, etc.

> Implementación concreta en este repo: [websockets.md](./websockets.md) · [reconexion-y-sincronizacion.md](./reconexion-y-sincronizacion.md)

---

## ¿Para qué se usa Socket.io en la mayoría de casos?

Socket.io resuelve el problema de **empujar datos del servidor al cliente** sin que el navegador pregunte cada X segundos.

| Caso de uso | Ejemplo | Alternativa sin WS |
|-------------|---------|-------------------|
| Notificaciones en vivo | "Tienes un mensaje nuevo" | Polling cada N segundos |
| Salas / canales | Quiz Kahoot, chat por grupo | Refresh manual |
| Estado compartido | "Usuario X está escribiendo…" | Polling |
| Sincronización de eventos | Inicio de ronda, cambio de turno | Long polling |
| Presencia | Quién está conectado | Heartbeat REST |

**Cuándo SÍ usar WebSockets (Socket.io):**

- Varios clientes deben ver cambios **casi al instante** (< 1 s).
- El servidor necesita **iniciar** la comunicación (push).
- Hay **salas** o **grupos** donde no todos deben recibir todo.

**Cuándo NO hace falta:**

- CRUD clásico sin tiempo real.
- Actualizaciones que toleran 10–30 s de retraso (polling REST basta).
- Archivos estáticos, formularios simples.

---

## Patrón recomendado: Mongo/DB + REST + Socket

El error más común es tratar el socket como base de datos. **No lo hagas.**

```
┌─────────────────────────────────────────────────────────┐
│  Base de datos = fuente de verdad (SSOT)                │
│  PostgreSQL, MongoDB, Redis con persistencia…           │
└───────────────────────────┬─────────────────────────────┘
                            │ escribe en eventos de negocio
┌───────────────────────────▼─────────────────────────────┐
│  API REST / Server Actions                                │
│  Valida, persiste, aplica reglas de negocio               │
└───────────────────────────┬─────────────────────────────┘
                            │ después de guardar → emit
┌───────────────────────────▼─────────────────────────────┐
│  Socket.io                                                │
│  Notifica a las salas afectadas                           │
└───────────────────────────┬─────────────────────────────┘
                            │
                     Clientes React/Vue/etc.
```

### Reglas de oro

1. **Escribe en DB primero, emite después.** Si el emit falla, el estado sigue consistente.
2. **El payload del socket debe poder reconstruirse desde DB** (reconexión = leer DB + emit snapshot).
3. **No emitas cada segundo** si puedes calcular en cliente (timers, animaciones).
4. **Autentica el handshake** (JWT, sesión, cookie).
5. **Usa salas (rooms)** para no broadcastear a todo el mundo.

---

## Estructura de carpetas (plantilla)

Adaptada de Electro Quiz; ajusta nombres a tu stack:

```
proyecto/
├── server.ts                    # HTTP + Next/Express + Socket.io
├── src/
│   ├── app/types/
│   │   └── socket.ts            # Nombres de eventos + tipos compartidos
│   ├── lib/
│   │   ├── client/
│   │   │   └── socket.ts        # Cliente singleton (socket.io-client)
│   │   └── server/
│   │       └── socket/
│   │           ├── io.ts        # getSocketIO() / setSocketIO()
│   │           ├── setup.ts     # Auth + handlers join/leave/custom
│   │           └── broadcast.ts # emitirActualizacion(entidad)
│   └── hooks/
│       └── useRecursoLive.ts    # REST inicial + socket + fallback poll
```

### Responsabilidad de cada archivo

| Archivo | Responsabilidad |
|---------|-----------------|
| `server.ts` | Crear `http.Server`, montar tu framework, adjuntar `SocketIOServer` |
| `io.ts` | Guardar referencia global al `io` para usarla desde API routes |
| `setup.ts` | Middleware de auth, eventos entrantes del cliente |
| `broadcast.ts` | Funciones `emitirX()` llamadas desde route handlers |
| `socket.ts` (cliente) | Una sola instancia, `withCredentials`, reconexión |
| `socket.ts` (types) | Contrato de eventos — **única fuente de nombres** |
| Hook React | Une REST + socket + reconexión + fallback |

---

## Paso 1: Servidor HTTP custom

Next.js App Router **no soporta WebSocket en `route.ts`**. Necesitas el servidor HTTP de Node.

```ts
// server.ts (mínimo)
import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

const app = next({ dev: true });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new Server(httpServer, {
    path: "/api/socket",
    cors: { origin: true, credentials: true },
  });

  // configurarSocketIO(io);
  // setSocketIO(io);

  httpServer.listen(3000);
});
```

**Express** (equivalente):

```ts
const server = createServer(app);
const io = new Server(server, { path: "/api/socket" });
server.listen(3000);
```

Scripts `package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch server.ts",
    "start": "tsx server.ts"
  }
}
```

---

## Paso 2: Tipos de eventos compartidos

Define nombres en un solo archivo importado por cliente y servidor:

```ts
// src/app/types/socket.ts
export const SOCKET_EVENTS = {
  ROOM_JOIN: "room:join",
  ROOM_LEAVE: "room:leave",
  ENTITY_UPDATE: "entity:update",
  ERROR: "room:error",
} as const;

export function roomId(id: string) {
  return `room:${id}`;
}
```

Convención: `dominio:accion` (`sesion:join`, `chat:message`, `game:move`).

---

## Paso 3: Autenticación en el handshake

```ts
// setup.ts
io.use(async (socket, next) => {
  const token = extraerToken(socket.handshake.headers.cookie);
  const user = await verificarToken(token);
  if (!user) return next(new Error("No autenticado"));
  socket.data.user = user;
  next();
});
```

Opciones de token:

| Método | Pros | Contras |
|--------|------|---------|
| Cookie httpOnly | Seguro, automático con `withCredentials` | Mismo dominio o CORS cuidadoso |
| Bearer en `auth` del handshake | Funciona cross-origin | Expone token en JS si no es httpOnly |
| Sesión Express | Clásico en SSR | Acopla a Express |

En Electro Quiz: cookie `eq_token` + `withCredentials: true`.

---

## Paso 4: Salas (rooms)

```ts
socket.on(SOCKET_EVENTS.ROOM_JOIN, async ({ id }) => {
  const puede = await usuarioPuedeEntrar(id, socket.data.user);
  if (!puede) {
    socket.emit(SOCKET_EVENTS.ERROR, { message: "Sin acceso" });
    return;
  }
  await socket.join(roomId(id));
  const snapshot = await leerDesdeDB(id);
  socket.emit(SOCKET_EVENTS.ENTITY_UPDATE, snapshot);
});
```

- **`socket.join(room)`** — suscripción a broadcasts.
- **`io.to(room).emit(...)`** — mensaje a todos en la sala.
- **`socket.leave(room)`** — al desmontar componente o cambiar de vista.

---

## Paso 5: Emitir desde API REST

```ts
// broadcast.ts
export function emitirActualizacion(id: string, doc?: Record<string, unknown>) {
  const io = getSocketIO();
  if (!io) return;
  const payload = doc ? serializar(doc) : await leerDeDB(id);
  io.to(roomId(id)).emit(SOCKET_EVENTS.ENTITY_UPDATE, payload);
}

// route.ts — PATCH handler
await Modelo.findOneAndUpdate(...);
await emitirActualizacion(id, doc.toObject());
return NextResponse.json(serializar(doc));
```

**Siempre después de persistir.** Nunca emitas estado que no esté en DB.

---

## Paso 6: Cliente singleton

```ts
// lib/client/socket.ts
import { io } from "socket.io-client";

let socket: ReturnType<typeof io> | null = null;

export function obtenerSocket() {
  if (!socket) {
    socket = io(undefined, {
      path: "/api/socket",
      autoConnect: false,
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}
```

- **`autoConnect: false`** — conectas cuando montas el hook (evita sockets huérfanos).
- **`transports: ["websocket", "polling"]`** — fallback si WS está bloqueado.

---

## Paso 7: Hook React (plantilla)

```ts
export function useRecursoLive(id: string | null) {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);

  // 1. Carga inicial REST
  useEffect(() => {
    if (!id) return;
    fetch(`/api/recurso/${id}`).then(r => r.json()).then(setData);
  }, [id]);

  // 2. Socket
  useEffect(() => {
    if (!id) return;
    const socket = obtenerSocket();

    const join = () => socket.emit(SOCKET_EVENTS.ROOM_JOIN, { id });
    const onUpdate = (payload) => setData(payload);

    socket.on("connect", join);
    socket.io.on("reconnect", join);
    socket.on(SOCKET_EVENTS.ENTITY_UPDATE, onUpdate);

    socket.connected ? join() : socket.connect();

    return () => {
      socket.emit(SOCKET_EVENTS.ROOM_LEAVE, { id });
      socket.off("connect", join);
      socket.off(SOCKET_EVENTS.ENTITY_UPDATE, onUpdate);
    };
  }, [id]);

  // 3. Fallback poll si no hay socket
  useEffect(() => {
    if (!id || connected) return;
    const t = setInterval(() => fetch(...).then(setData), 10000);
    return () => clearInterval(t);
  }, [id, connected]);

  return { data, connected };
}
```

---

## Reconexión: qué implementar siempre

| Capa | Qué hacer |
|------|-----------|
| Transporte | `reconnection: true` en cliente |
| App | Tras `connect` / `reconnect`, emitir `join` de nuevo |
| Servidor | En `join`, enviar **snapshot completo** desde DB |
| Estado local extra | REST dedicado (`/progreso`, `/mensajes?since=`) para datos que el snapshot no incluye |
| UX | Banner "Reconectado", botón "Volver a la sesión", PIN en localStorage |

En Electro Quiz:

- Docente: `POST /sesiones` idempotente (devuelve sesión activa).
- Estudiante: `POST /unirse` permite reconexión si ya participó.
- Play: `GET /progreso` restaura respuestas.

---

## Sincronización de timers sin spam

**Mal:** emitir `{ timeLeft: 29 }`, `{ timeLeft: 28 }`… cada segundo.

**Bien:** guardar en DB:

- `scheduledAt` — cuándo empieza
- `durationSec` — cuánto dura

Cliente calcula:

```ts
const elapsed = (Date.now() + serverOffset) - new Date(scheduledAt).getTime();
const timeLeft = Math.max(0, durationSec - elapsed / 1000);
```

Incluye `serverTime` en cada update para corregir drift del reloj del cliente.

---

## Despliegue en producción

| Tema | Recomendación |
|------|---------------|
| Sticky sessions | Si usas múltiples instancias, necesitas **Redis adapter** de Socket.io |
| Proxy (Nginx) | `Upgrade` y `Connection` headers para WebSocket |
| Path | Mismo path en cliente y servidor (`/api/socket`) |
| CORS | `credentials: true` + origin explícito |
| HTTPS | WSS automático si la página es HTTPS |
| Variables | `NEXT_PUBLIC_SOCKET_URL` si el socket vive en otro dominio |

```nginx
location /api/socket {
  proxy_pass http://localhost:3000;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
}
```

---

## Comparativa rápida de alternativas

| Tecnología | Cuándo elegirla |
|------------|-----------------|
| **Socket.io** | Salas, reconexión automática, fallback polling, ecosistema maduro |
| **ws** (raw) | Control total, protocolo mínimo, sin salas built-in |
| **SSE** | Solo servidor → cliente, unidireccional, más simple |
| **Supabase Realtime** | Ya usas Supabase, poco código |
| **Pusher / Ably** | Managed, pagas por mensaje, cero infra WS |
| **Polling REST** | Prototipo, pocos usuarios, tolerancia a latencia |

Socket.io encaja bien cuando ya tienes **Node + REST + DB** y quieres salas + reconexión sin operar un servicio externo.

---

## Checklist de implementación

```
[ ] Servidor HTTP custom (no solo next dev)
[ ] socket.io en servidor + socket.io-client en cliente
[ ] Tipos de eventos compartidos (un solo archivo)
[ ] Auth en middleware io.use()
[ ] Patrón: DB write → emit
[ ] Salas por entidad (room:id)
[ ] join envía snapshot desde DB
[ ] Cliente singleton + withCredentials
[ ] Hook: REST + socket + reconnect join
[ ] Fallback poll si WS falla
[ ] Endpoint/idempotencia para reconexión de usuarios
[ ] Probar: cerrar pestaña, recargar, modo avión 10 s
```

---

## Resumen en una frase

**Persiste en la base de datos, notifica por Socket.io, reconecta leyendo la base de datos de nuevo** — el socket es el megáfono, no el cuaderno oficial.

Para ver todo esto aplicado al quiz en vivo de este proyecto, lee [websockets.md](./websockets.md) y [reconexion-y-sincronizacion.md](./reconexion-y-sincronizacion.md).
