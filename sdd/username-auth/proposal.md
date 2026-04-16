# Proposal: username-auth

## Intent

Cambiar el sistema de autenticación de email a username. Actualmente el login usa email como identificador, pero el usuario requiere autenticarse con username. El campo email ya es opcional en el schema (sparse: true), solo necesitamos agregar username como identificador único requerido.

## Scope

### In Scope
- Agregar campo `username` requerido y único en User model
- Modificar `authorize()` en auth.ts para buscar por username
- Actualizar LoginForm para aceptar username (campo y validación)
- Actualizar tipos TypeScript relacionados

### Out of Scope
- Cambios en registro de usuarios (será tema de otro change)
- Modificación de APIs existentes que expongan email

## Capabilities

### New Capabilities
- `user-auth-username`: Autenticación con username y password en lugar de email

### Modified Capabilities
- Ninguna - el comportamiento de auth cambia a nivel de implementación, no de especificación

## Approach

1. **User model**: Agregar campo `username` con `required`, `unique: true`, `trim`, `lowercase`
2. **auth.ts**: Cambiar `credentials.email` a `credentials.username`, modificar query de búsqueda de `email: credentials.email` a `username: credentials.username`
3. **LoginForm**: Cambiar schema de `email` a `username`, actualizar label, placeholder y mensajes de error

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/models/User.ts` | Modified | Agregar campo username requerido y único |
| `src/lib/auth.ts` | Modified | authorize() busca por username |
| `src/app/login/LoginForm.tsx` | Modified | Campo username en lugar de email |
| `src/types/index.ts` | Modified | Agregar username a IUser interface |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Usuarios existentes no tienen username | Med | seed script o migración con usernames derivados del email |
| Conflicto con username existente | Low | Validar uniqueness antes de migración |

## Rollback Plan

1. Revertir cambios en `src/models/User.ts` (remover campo username)
2. Restaurar en `src/lib/auth.ts` la búsqueda por email
3. Restaurar `src/app/login/LoginForm.tsx` a uso de email
4. Si email era required previamente, restaurarlo (actualmente ya es optional)

## Success Criteria

- [ ] Usuario puede logearse con username y password
- [ ] El campo email sigue siendo opcional en el schema
- [ ] El sistema de auth funciona con JWT de 30 días
- [ ] Username es único en el sistema
