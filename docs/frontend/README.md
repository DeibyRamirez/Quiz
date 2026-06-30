# Frontend — rutas y componentes

Capa de presentación: App Router, páginas por rol y árbol de componentes React.

## Documentos

| Archivo | Para qué sirve |
|---------|----------------|
| [frontend-routes.md](./frontend-routes.md) | Mapa de rutas `/teacher`, `/student`, `/administrador` |
| [componentes.md](./componentes.md) | Layout, Navigation, componentes custom y shadcn |

## Relación con otras secciones

```
frontend/
  frontend-routes.md ──► dominio/user-flows.md      (qué ve cada rol)
                    ──► backend/authentication.md (ProtectedRoute)
  componentes.md ──► arquitectura/patterns.md     (estructura src/components)
                  ──► tiempo-real/live-sessions.md (hooks useSesionLive en páginas live)
```

**Al añadir una pantalla:** define la ruta aquí y enlaza el flujo en [dominio/user-flows.md](../dominio/user-flows.md).

[← Volver al índice general](../README.md)
