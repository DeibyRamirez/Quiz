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
 * - HOSTNAME=0.0.0.0 para escuchar fuera del contenedor.
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
// En Docker/producción usar HOSTNAME=0.0.0.0; en dev local basta "localhost"
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      // Dev: cualquier origin. Prod: solo NEXT_PUBLIC_APP_URL (mismo dominio que la UI)
      origin: dev ? true : process.env.NEXT_PUBLIC_APP_URL || false,
      credentials: true, // cookie JWT (eq_token) en handshake WebSocket
    },
  });

  configurarSocketIO(io);
  setSocketIO(io);

  // Escuchar en 0.0.0.0 dentro del contenedor permite tráfico desde el puerto publicado
  const listenHost = hostname === "0.0.0.0" ? "0.0.0.0" : hostname;
  httpServer.listen(port, listenHost, () => {
    console.log(`> Electro Quiz listo en http://${hostname}:${port}`);
    console.log(`> WebSocket Socket.io en path /api/socket`);
  });
});
