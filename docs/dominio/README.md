# Dominio — negocio y flujos de usuario

Qué hace el producto, reglas de negocio y recorridos por rol (docente, estudiante, admin).

## Documentos

| Archivo | Para qué sirve |
|---------|----------------|
| [business-logic.md](./business-logic.md) | Reglas por módulo: quizzes, sesiones, calificación, roles |
| [user-flows.md](./user-flows.md) | Flujos end-to-end desde la perspectiva del usuario |
| [question-types.md](./question-types.md) | Tipos de pregunta, mapeo UI ↔ Mongo, puntaje |

## Relación con otras secciones

```
dominio/
  user-flows.md ──► frontend/frontend-routes.md   (páginas de cada flujo)
               ──► backend/api-reference.md       (endpoints que ejecutan el flujo)
               ──► tiempo-real/live-sessions.md  (sesión en vivo)
  business-logic.md ──► backend/models-and-collections.md
  question-types.md ──► backend/api-reference.md (POST respuestas, calificar)
```

**Para QA o producto:** empieza por [user-flows.md](./user-flows.md).  
**Para implementar una regla nueva:** [business-logic.md](./business-logic.md) + [backend/](../backend/README.md).

[← Volver al índice general](../README.md)
