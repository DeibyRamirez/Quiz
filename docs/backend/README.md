# Backend — API REST, auth y persistencia

Capa servidor: route handlers, validación Zod, JWT, Mongoose y MongoDB.

## Documentos

| Archivo | Para qué sirve |
|---------|----------------|
| [api-reference.md](./api-reference.md) | Listado de endpoints, métodos, payloads |
| [authentication.md](./authentication.md) | JWT, cookie `eq_token`, roles, protección |
| [models-and-collections.md](./models-and-collections.md) | Esquemas Mongoose y colecciones |

## Relación con otras secciones

```
backend/
  models-and-collections.md ──► dominio/business-logic.md
  authentication.md ──► dominio/user-flows.md (login, guards)
  api-reference.md ──► tiempo-real/websockets.md (REST escribe → socket emite)
                    ──► arquitectura/patterns.md (convenciones handler)
```

**Flujo típico al cambiar una feature:**

1. [models-and-collections.md](./models-and-collections.md) — modelo  
2. [api-reference.md](./api-reference.md) — endpoint  
3. [tiempo-real/websockets.md](../tiempo-real/websockets.md) — si afecta sesión live  

[← Volver al índice general](../README.md)
