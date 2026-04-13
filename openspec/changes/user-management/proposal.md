# Proposal: User Management - Super Admin CRUD

## Intent

Permitir al Super Admin la gestión completa de usuarios del sistema: crear supervisores (ADMIN) y farmacias (PHARMACY), modificar sus datos, cambiar contraseñas y roles. Actualmente el sistema carece de un CRUD completo desde la perspectiva del Super Admin.

## Scope

### In Scope
- Crear usuarios con rol ADMIN o PHARMACY vía API
- Editar perfil de cualquier usuario (nombre, email, teléfono, pharmacyName, pharmacyCode)
- Cambiar contraseña de cualquier usuario
- Cambiar rol de usuarios (incluyendo degrade de ADMIN a PHARMACY)
- Eliminar usuarios (soft delete: isActive = false)
- UI de gestión de usuarios para Super Admin

### Out of Scope
- Autogestión de perfil por parte del usuario (ya existe en /api/user/profile)
- Exportación de usuarios a CSV/Excel
- Gestión deSuper Admin (solo existe 1, no se puede crear/eliminar)

## Capabilities

### New Capabilities
- `user-management`: Gestión completa de usuarios por Super Admin
  - CREATE: POST /api/admin/users
  - READ: GET /api/admin/users (ya existe)
  - UPDATE: PATCH /api/admin/users/[id] (actualizar campos adicionales)
  - DELETE: PATCH /api/admin/users/[id] con isActive=false

### Modified Capabilities
- `user-auth`: Se expande para permitir cambio de contraseña por admin

## Approach

1. **API Layer**: Extender `/api/admin/users` con POST (create) y DELETE (soft delete)
2. **PATCH Enhancement**: Agregar campos email, phone al PATCH existente
3. **Validations**: Crear schemas Zod para createUserByAdmin (rol dinámico)
4. **UI**: Crear página `/dashboard/admin/usuarios` con tabla, formularios

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/admin/users/route.ts` | New | POST para crear usuarios |
| `src/app/api/admin/users/[id]/route.ts` | Modified | PATCH + email/phone, DELETE |
| `src/lib/validations.ts` | Modified | Agregar createUserByAdminSchema |
| `src/app/dashboard/admin/usuarios/page.tsx` | New | UI de gestión |
| `src/models/User.ts` | No change | Validación existente |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cambio de rol a PHARMACY sin pharmacyCode | Low | Validación condicional en schema |
| Soft delete vs hard delete confusión | Low | Documentar en UI, usar PATCHcon isActive |
| Colisión de email único | Low | Validar unicidad antes de crear/actualizar |

## Rollback Plan

1. Revertir cambios en API routes (`git revert`)
2. Eliminar página UI `/dashboard/admin/usuarios`
3. Restaurar validations anteriores si fueron modificadas

## Dependencies

- NextAuth.js configurado (ya existe)
- MongoDB/Mongoose (ya existe)
- Zod validations (ya existe)

## Success Criteria

- [ ] Super Admin puede crear ADMIN desde UI
- [ ] Super Admin puede crear PHARMACY desde UI
- [ ] Super Admin puede editar todos los campos de cualquier usuario
- [ ] Super Admin puede cambiar contraseña de cualquier usuario
- [ ] Super Admin puede cambiar rol de usuario
- [ ] Tests unitarios pasan (Vitest)