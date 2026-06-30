# Guías — instalación y despliegue

Documentación operativa: cómo levantar el proyecto en tu máquina o en un servidor.

## Documentos

| Archivo | Para qué sirve |
|---------|----------------|
| [development.md](./development.md) | Requisitos, `.env.local`, `npm run dev`, build, depuración |
| [docker.md](./docker.md) | Dockerfile, docker-compose, Render, escalabilidad |

## Relación con otras secciones

```
guias/
  development.md ──► arquitectura/stack-and-tools.md   (variables, scripts)
                 ──► arquitectura/architecture.md      (por qué server.ts)
  docker.md      ──► arquitectura/architecture.md      (monolito + despliegue)
                 ──► tiempo-real/websockets.md         (WebSocket en contenedor)
```

**Orden recomendado:** `development.md` → probar local → `docker.md` si vas a producción.

[← Volver al índice general](../README.md)
