/**
 * Servidor HTTP custom: Next.js + Socket.io en el mismo puerto.
 *
 * Por qué existe este archivo:
 * - Next.js App Router no expone WebSockets en route handlers.
 * - Socket.io necesita adjuntarse al servidor HTTP subyacente.
 * - MongoDB sigue siendo la fuente de verdad; Socket.io solo NOTIFICA cambios.
 *
 * Despliegue (Docker / Render / Fly):
 * - Un solo contenedor/proceso ejecuta ESTE archivo (`npm run start`).
 * - HOST o BIND_HOST=0.0.0.0 para escuchar fuera del contenedor (Render/Fly/Docker).
 * - No uses process.env.HOSTNAME: en Render/Linux es el nombre del contenedor, no 0.0.0.0.
 * - NEXT_PUBLIC_APP_URL debe coincidir con el dominio del navegador (CORS socket).
 * - No usar `next start`: el WebSocket no se montaría.
 *
 * Ejecutar: npm run dev | npm run start
 */
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { setSocketIO } from "./src/lib/server/socket/io";
import { configurarSocketIO } from "./src/lib/server/socket/setup";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT || "3000", 10);
const socketPath = (() => {
  const raw = (process.env.SOCKET_PATH ?? "/api/socket").trim();
  return raw.startsWith("/") ? raw : `/${raw}`;
})();

/** Dirección de escucha HTTP. Render inyecta HOSTNAME con el id del contenedor → 502 si se usa para bind. */
function resolveListenHost(): string {
  const explicit =
    process.env.HOST?.trim() || process.env.BIND_HOST?.trim();
  if (explicit) return explicit;
  // Compat Docker compose legacy (HOSTNAME=0.0.0.0)
  if (process.env.HOSTNAME?.trim() === "0.0.0.0") return "0.0.0.0";
  return dev ? "localhost" : "0.0.0.0";
}

const listenHost = resolveListenHost();

const app = next({
  dev,
  ...(dev ? { hostname: listenHost, port } : { port }),
});
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: socketPath,
    addTrailingSlash: false,
    cors: {
      // Dev: cualquier origin. Prod: solo NEXT_PUBLIC_APP_URL (mismo dominio que la UI)
      origin: dev ? true : process.env.NEXT_PUBLIC_APP_URL || false,
      credentials: true, // cookie JWT (eq_token) en handshake WebSocket
    },
  });

  configurarSocketIO(io);
  setSocketIO(io);

  httpServer.listen(port, listenHost, () => {
    console.log(`> Electro Quiz listo en http://${listenHost}:${port}`);
    console.log(`> WebSocket Socket.io en path ${socketPath}`);
  });
}).catch((err) => {
  console.error("Error al iniciar el servidor:", err);
  process.exit(1);
});