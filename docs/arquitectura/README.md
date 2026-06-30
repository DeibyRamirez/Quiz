# Arquitectura — diseño técnico

Visión de capas, stack y convenciones de código del monolito Next.js + MongoDB + Socket.io.

## Documentos

| Archivo | Para qué sirve |
|---------|----------------|
| [architecture.md](./architecture.md) | Capas presentación → API → Mongo → Socket.io |
| [stack-and-tools.md](./stack-and-tools.md) | Dependencias npm, scripts, env vars |
| [patterns.md](./patterns.md) | Convenciones: rutas API, servicios, tipos |

## Relación con otras secciones

```
arquitectura/
  architecture.md ──► backend/          (implementación API y modelos)
                   ──► frontend/         (App Router y componentes)
                   ──► tiempo-real/      (server.ts + Socket.io)
  stack-and-tools.md ──► guias/         (setup y Docker)
  patterns.md ──► dominio/ + backend/   (cómo extender el código)
```

**Punto central:** [architecture.md](./architecture.md) — léelo antes de tocar backend o tiempo real.

[← Volver al índice general](../README.md)
