# Docker — contenedor y despliegue

Guía para empaquetar **Electro Quiz** con Docker: decisiones de arquitectura, uso local, producción y camino de escalabilidad.

## Decisión de arquitectura: ¿un contenedor o varios?

### Respuesta corta

| Componente | Contenedor | Motivo |
|------------|------------|--------|
| **App (Next.js + API + Socket.io)** | **Uno solo** | Comparten el mismo servidor HTTP (`server.ts`) |
| **MongoDB** | **Separado** | Persistencia gestionada; escala independiente |
| **Redis** (futuro) | **Separado** | Adapter Socket.io cuando haya varias réplicas de `app` |

### Por qué NO separar WebSocket en otro contenedor (hoy)

En este proyecto, Socket.io se adjunta al servidor HTTP de Node junto con Next.js:

```
┌─────────────────────────────────────────────┐
│  Contenedor `app` (UN proceso Node)         │
│  ┌─────────────┐  ┌──────────────────────┐  │
│  │  Next.js    │  │  Socket.io           │  │
│  │  /api/*     │  │  path /api/socket    │  │
│  └──────┬──────┘  └──────────┬───────────┘  │
│         └──────────┬─────────┘               │
│              server.ts                       │
└────────────────────┼────────────────────────┘
                     │ TCP
         ┌───────────▼───────────┐
         │  MongoDB (externo)    │
         │  Atlas / compose mongo│
         └───────────────────────┘
```

Separar el socket implicaría refactorizar a un microservicio con su propio despliegue, CORS, auth y sincronización con Mongo. No aporta valor hasta que necesites **varias instancias** de la app.

### Escalabilidad futura (sistema más complejo)

Cuando conectes otros servicios o necesites más carga:

```
                    ┌──────────────┐
                    │ Load Balancer│  (sticky sessions para WebSocket)
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  app :3000 │  │  app :3000 │  │  app :3000 │  ← misma imagen Docker
    └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
              ┌───────────▼───────────┐
              │  MongoDB Atlas        │
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐  (próximo paso técnico)
              │  Redis                │
              │  @socket.io/redis-    │
              │  adapter              │
              └───────────────────────┘
```

- **Horizontal:** N réplicas del contenedor `app` (Kubernetes, Fly, Render con Docker, etc.).
- **Socket.io multi-instancia:** adapter Redis (documentado en [development.md](./development.md) como próximo paso). Ver también [arquitectura/architecture.md](../arquitectura/architecture.md).
- **Integración con otros sistemas:** API REST en `/api/*` ya es consumible; puedes añadir un API Gateway delante sin cambiar el contenedor.

---

## Archivos del proyecto

| Archivo | Rol |
|---------|-----|
| `Dockerfile` | Imagen multi-etapa de la aplicación |
| `docker-compose.yml` | Desarrollo: `app` + `mongo` |
| `docker-compose.prod.yml` | Producción: solo `app` (Mongo externo) |
| `.dockerignore` | Excluye `node_modules`, `.env`, docs, etc. |
| `.env.docker.example` | Plantilla de variables para Compose |

---

## Requisitos

- Docker Engine 24+ y Docker Compose v2
- (Producción) Cluster MongoDB accesible desde el host del contenedor

---

## Desarrollo local con Docker

### 1. Variables de entorno

```bash
cp .env.docker.example .env.docker
```

Edita `.env.docker` si necesitas otro `JWT_SECRET`. Para el stack local, `MONGODB_URI` apunta al servicio `mongo` del compose:

```env
MONGODB_URI=mongodb://mongo:27017/Electroquiz
JWT_SECRET=tu-secreto-largo
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Levantar stack completo

```bash
docker compose up --build
```

- App: http://localhost:3000  
- WebSocket: path `/api/socket` (mismo origen)  
- MongoDB en el host: `localhost:27017` (Compass, mongosh)

### 3. Verificar salud

```bash
curl http://localhost:3000/api/health/db/
```

Respuesta esperada: `{"ok":true,"database":"Electroquiz",...}`

### 4. Detener y conservar datos

```bash
docker compose down          # mantiene volumen mongo_data
docker compose down -v       # borra datos de Mongo local
```

---

## Producción (solo contenedor de app)

Usa **MongoDB Atlas** (u otro cluster) — no el servicio `mongo` del compose.

### 1. Configurar `.env.docker`

```env
MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/Electroquiz
JWT_SECRET=secreto-produccion-largo
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
NEXT_PUBLIC_API_URL=https://tu-dominio.com/api
```

En Atlas → **Network Access** → permite la IP del servidor o `0.0.0.0/0` para pruebas.

### 2. Build y arranque

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

### 3. Build manual (sin Compose)

```bash
docker build \
  --build-arg NEXT_PUBLIC_APP_URL=https://tu-dominio.com \
  --build-arg NEXT_PUBLIC_API_URL=https://tu-dominio.com/api \
  -t electro-quiz:latest .

docker run -d \
  --name electro-quiz \
  -p 3000:3000 \
  -e MONGODB_URI="mongodb+srv://..." \
  -e JWT_SECRET="..." \
  -e NEXT_PUBLIC_APP_URL="https://tu-dominio.com" \
  -e HOSTNAME=0.0.0.0 \
  electro-quiz:latest
```

---

## Despliegue en Render con Docker

1. En Render → **New Web Service** → conectar repo.
2. **Environment:** Docker.
3. Render detecta el `Dockerfile` en la raíz.
4. Variables en el panel (no commitear secretos):

| Variable | Valor |
|----------|--------|
| `MONGODB_URI` | URI Atlas |
| `JWT_SECRET` | Secreto fuerte |
| `NEXT_PUBLIC_APP_URL` | `https://tu-app.onrender.com` |
| `HOSTNAME` | `0.0.0.0` |

5. **Build args** (si la URL pública se define en build):

   - `NEXT_PUBLIC_APP_URL` = misma URL de Render

6. Start command: la imagen ya usa `npm run start` (incluye Socket.io).

> **Nota:** Si cambias `NEXT_PUBLIC_*`, reconstruye la imagen; esas variables se inlined en el bundle de Next.js en build time.

---

## Variables de entorno

| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `MONGODB_URI` | Sí | URI MongoDB (compose: `mongodb://mongo:27017/Electroquiz`) |
| `JWT_SECRET` | Sí | Firma de tokens JWT |
| `NEXT_PUBLIC_APP_URL` | Sí (prod) | Origin permitido en CORS de Socket.io |
| `NEXT_PUBLIC_API_URL` | No | Si vacío, el cliente usa el mismo host |
| `HOSTNAME` | Sí (Docker) | `0.0.0.0` para escuchar fuera del contenedor |
| `PORT` | No | Default `3000` |

Build args (solo en `docker build` / compose `build.args`):

| Build arg | Uso |
|-----------|-----|
| `NEXT_PUBLIC_APP_URL` | Inlined en cliente Next.js |
| `NEXT_PUBLIC_API_URL` | Inlined en cliente Next.js |

---

## Cómo funciona el Dockerfile

1. **deps** — `npm ci` (incluye `tsx`, necesario para `server.ts`).
2. **builder** — `npm run build` (output `standalone` en `.next`).
3. **runner** — copia `.next`, `server.ts`, `src/`, `node_modules` mínimos de runtime.
4. **HEALTHCHECK** — `GET /api/health/db/` (app + Mongo).
5. **CMD** — `npm run start` → **no** `next start` (WebSocket no arrancaría).

---

## Troubleshooting

| Síntoma | Causa probable | Solución |
|---------|----------------|----------|
| WebSocket no conecta | Usaste `next start` en lugar de `npm run start` | Usar imagen tal cual o CMD del Dockerfile |
| CORS / socket rechazado | `NEXT_PUBLIC_APP_URL` distinta al dominio del navegador | Igualar URL pública y rebuild si hace falta |
| Healthcheck falla | Mongo inaccesible o URI incorrecta | Revisar `MONGODB_URI` y firewall Atlas |
| Cookie auth no funciona | API en dominio distinto al frontend | Mismo dominio para app y API (monolito) |
| Build falla por env | Faltan placeholders en build | El Dockerfile ya incluye placeholders; revisa logs |

---

## Comandos útiles

```bash
# Logs de la app
docker compose logs -f app

# Shell dentro del contenedor
docker compose exec app sh

# Rebuild sin caché
docker compose build --no-cache app

# Probar imagen de producción local contra Atlas
docker compose -f docker-compose.prod.yml up --build
```

---

## Relacionado

- [Desarrollo local](./development.md) — sin Docker
- [WebSockets](../tiempo-real/websockets.md) — por qué existe `server.ts`
- [Stack y herramientas](../arquitectura/stack-and-tools.md) — variables de entorno generales
- [Arquitectura](../arquitectura/architecture.md) — capas del sistema
