# Tiempo real — sesiones en vivo y WebSockets

Todo lo relacionado con quizzes en vivo: lobby, PIN, timer, Socket.io y reconexión.

## Documentos

| Archivo | Para qué sirve |
|---------|----------------|
| [live-sessions.md](./live-sessions.md) | Estados lobby/active/ended, presencia, timer, hook `useSesionLive` |
| [websockets.md](./websockets.md) | Arquitectura Socket.io en este repo, eventos, depuración |
| [reconexion-y-sincronizacion.md](./reconexion-y-sincronizacion.md) | Reconexión docente/estudiante, `serverTime`, localStorage |
| [implementing-socketio.md](./implementing-socketio.md) | Guía genérica reutilizable en otros proyectos |

## Relación con otras secciones

```
tiempo-real/
  live-sessions.md ──► dominio/user-flows.md
                    ──► backend/api-reference.md (/api/sesiones/*)
  websockets.md ──► arquitectura/architecture.md (server.ts)
               ──► guias/docker.md (un proceso Node = Next + socket)
  reconexion-y-sincronizacion.md ──► frontend/ (páginas live/play)
```

**Orden de lectura:**

1. [live-sessions.md](./live-sessions.md) — comportamiento funcional  
2. [websockets.md](./websockets.md) — implementación técnica  
3. [reconexion-y-sincronizacion.md](./reconexion-y-sincronizacion.md) — edge cases  

[← Volver al índice general](../README.md)
