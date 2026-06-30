# Autenticación

## Mecanismo

- **JWT** firmado con HS256 (`jose`)
- Cookie HTTP-only: `eq_token`
- Expiración: **7 días** (`JWT_EXPIRES = "7d"`)
- Secreto: `JWT_SECRET` en entorno

## Payload JWT

Definido en `src/lib/server/auth/jwt.ts`:

| Claim | Contenido |
|-------|-----------|
| `sub` | ID usuario Mongo (`Usuario._id`) |
| `correo` | Email |
| `nombre` | Nombre display |
| `rol` | `estudiante`, `docente`, `admin` |

```ts
interface JwtPayload {
  sub: string;
  correo: string;
  nombre: string;
  rol: RolUsuario;
}
```

El JWT **no** incluye hoy `sesionPin` ni progreso de quiz. La reconexión a una sesión live usa `sub` + `GET /sesiones/[pin]/progreso/`.

### Extensión futura (opcional)

Token corto de juego:

```json
{
  "sub": "userId",
  "sesionPin": "123456",
  "quizId": "...",
  "exp": "2h"
}
```

Separado de `eq_token` para no mezclar sesión de app con sesión de quiz.

## Flujo login

1. `POST /api/auth/login` con correo/contraseña
2. `UsuarioModel.findOne` + `verifyPassword` (bcrypt)
3. `signToken(payload)` → cookie en respuesta
4. Cliente: `establecerSesionCache(usuario)` opcional

## Flujo registro

1. `POST /api/auth/registro`
2. Hash contraseña, crear `Usuario`
3. JWT + cookie igual que login

## Sesión en cliente

`lib/client/auth.ts`:

- `obtenerUsuarioActual()` → `GET /api/auth/me` (con cache)
- `cerrarSesionApp()` → logout + limpiar cache

`ProtectedRoute` valida rol antes de dashboards.

## Autorización en API

`lib/server/auth/requerir-auth.ts`:

```ts
requerirAuth()           // cualquier usuario logueado
requerirRol([DOCENTE])   // rol específico
```

Usado en:

- Crear sesión: docente o admin
- Unirse: estudiante
- Control live (PATCH): docente autor del quiz o admin

## Roles y rutas UI

| Rol | Enum | Rutas típicas |
|-----|------|---------------|
| Estudiante | `estudiante` | `/student` |
| Docente | `docente` | `/teacher`, `/teacher/create`, live |
| Admin | `admin` | `/administrador` |

`puedeAccederRutas()` en `types/usuario.ts` para checks genéricos.

## Seguridad de contraseñas

- Mínimo 6 caracteres en validación de registro
- `contraseña` con `select: false` en Mongoose
- Solo se incluye en query de login (`select("+contraseña")`)

## Cookie settings

```ts
httpOnly: true
secure: production
sameSite: "lax"
path: "/"
maxAge: 7 días
```
