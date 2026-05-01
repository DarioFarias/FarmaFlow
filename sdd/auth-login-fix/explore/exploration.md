# Exploration: Auth Login Fix

## Current State

El sistema de autenticación de FarmaFlow tiene un bug de **case-sensitivity** que impide que los usuarios creados desde el panel de administración puedan hacer login, mientras que el superadmin sí puede.

### Flujo de login (src/lib/auth.ts)

1. El frontend envía el username en **minúsculas**: `data.username.toLowerCase()` (LoginForm.tsx:40)
2. El backend busca por username **case-sensitive** primero (auth.ts:64-68)
3. Si no encuentra, hace fallback a lowercase del input (auth.ts:71-76)
4. Finalmente busca por email (auth.ts:80-86)

### Flujo de creación de usuarios (src/app/api/admin/users/route.ts)

1. El schema de validación **NO** aplica toLowerCase al username (validations.ts:108)
2. La API guarda el username **exactamente** como se envió: `username: validated.username.trim()` (route.ts:115)
3. El índice de MongoDB es **case-sensitive** (User.ts:93)

### El problema

| Usuario | Username guardado | Username en login | ¿Encontrado? |
|---------|-------------------|-------------------|---------------|
| superadmin (seed) | `superadmin` | `superadmin` | ✅ Sí |
|Usuario creado "Juan" | `Juan` | `juan` | ❌ No |
|Usuario creado "AdminTest" | `AdminTest` | `admintest` | ❌ No |

## Affected Areas

- `src/app/login/LoginForm.tsx` — Envía username en lowercase (línea 40)
- `src/app/api/admin/users/route.ts` — No convierte username a lowercase al crear (línea 115)
- `src/models/User.ts` — Índice case-sensitive, sin collación (línea 93)
- `src/lib/auth.ts` — Lógica de búsqueda con fallbacks

## Approaches

### 1. **Normalizar username en creación** (RECOMENDADO)
- **Descripción**: Convertir username a lowercase en la API de creación
- **Pros**: Solución simple, mantiene consistencia, poco riesgo
- **Cons**: Requiere migrate datos existentes con usernames en mayúsculas
- **Effort**: Low

### 2. **Normalizar username en login**
- **Descripción**: Buscar tanto el input original como su versión lowercase
- **Pros**: No requiere cambio en creación, usuarios existentes funcionan
- **Cons**: Inconsistencia con cómo se almacenan los datos
- **Effort**: Low

### 3. **Cambiar índice de MongoDB a case-insensitive**
- **Descripción**: Agregar collation con strength: 1 en el índice
- **Pros**: Solución a nivel de DB, transparente para la app
- **Cons**: Puede tener impacto en performance, requiere recreate índice
- **Effort**: Medium

## Recommendation

**Approach 1**: Normalizar username a lowercase en la API de creación (`src/app/api/admin/users/route.ts:115`).

Cambiar:
```typescript
username: validated.username.trim()
```

A:
```typescript
username: validated.username.trim().toLowerCase()
```

También considerar:
- Migrar usernames existentes que contengan mayúsculas
- Actualizar el schema de validación para reflejar esta normalización

## Risks

- **Datos existentes**: Usuarios creados con usernames en mayúsculas no podrán hacer login hasta que se ejecute una migración
- **Inconsistencia histórica**: Si hay usernames duplicados en diferente case (ej: "Juan" y "juan"), el unique index fallará al migrar

## Ready for Proposal

**Sí**. El diagnóstico está completo. La causa raíz está identificada: inconsistencia en el case del username entre la creación (se guarda como se envía) y el login (se envía en lowercase).

Se recomienda proceder a crear el proposal para implementar la solución.