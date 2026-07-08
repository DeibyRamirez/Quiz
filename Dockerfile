# =============================================================================
# Electro Quiz — imagen de producción (monolito Next.js + Socket.io)
# =============================================================================
#
# Arquitectura:
#   - UN solo contenedor de aplicación: API REST + WebSocket comparten el
#     mismo proceso Node (ver server.ts). No separar socket en otro contenedor
#     sin refactorizar el código.
#   - MongoDB va SIEMPRE fuera de este contenedor en producción (Atlas u otro
#     servicio gestionado). En desarrollo local, docker-compose levanta mongo.
#
# Build multi-etapa para reducir tamaño final y no incluir herramientas de dev.
# =============================================================================

# --- Etapa 1: base común -----------------------------------------------------
FROM node:20-alpine AS base
WORKDIR /app

# libc6-compat mejora compatibilidad de binarios nativos en Alpine
RUN apk add --no-cache libc6-compat

# --- Etapa 2: dependencias ---------------------------------------------------
FROM base AS deps

# Copiamos manifiestos primero para aprovechar la caché de capas de Docker
COPY package.json package-lock.json ./

# Instalación en imagen limpia. `npm ci` falla con npm 10 del contenedor cuando el
# lockfile fue generado con npm 11 y faltan peers opcionales de mongodb/firebase.
RUN npm install --no-audit --no-fund

# --- Etapa 3: build de Next.js -----------------------------------------------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables NEXT_PUBLIC_* se inlined en el bundle en tiempo de build.
# Si cambias la URL pública, reconstruye la imagen (--build-arg).
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_API_URL=
ARG NEXT_PUBLIC_SOCKET_URL=

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

# Placeholders solo para que `next build` no falle; runtime usa env del contenedor
ENV MONGODB_URI=mongodb://build-placeholder:27017/Electroquiz
ENV JWT_SECRET=build-placeholder-no-usar-en-runtime

RUN npm run build

# --- Etapa 4: imagen final mínima --------------------------------------------
FROM base AS runner

ENV NODE_ENV=production
# 0.0.0.0 permite conexiones desde fuera del contenedor (Render, Fly, K8s…)
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Usuario sin privilegios (buena práctica en producción)
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 electroquiz

# Artefactos necesarios para `npm run start` → tsx server.ts
COPY --from=builder --chown=electroquiz:nodejs /app/public ./public
COPY --from=builder --chown=electroquiz:nodejs /app/.next ./.next
COPY --from=builder --chown=electroquiz:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=electroquiz:nodejs /app/package.json ./package.json
COPY --from=builder --chown=electroquiz:nodejs /app/server.ts ./server.ts
COPY --from=builder --chown=electroquiz:nodejs /app/src ./src
COPY --from=builder --chown=electroquiz:nodejs /app/next.config.mjs ./next.config.mjs
COPY --from=builder --chown=electroquiz:nodejs /app/tsconfig.json ./tsconfig.json

USER electroquiz

EXPOSE 3000

# Comprueba app + conexión Mongo (requiere MONGODB_URI válida en runtime)
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health/db/').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# IMPORTANTE: no usar `next start`; el WebSocket vive en server.ts
CMD ["npm", "run", "start"]
