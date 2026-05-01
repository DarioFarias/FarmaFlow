# Proposal: Sistema de Roles Jerárquico

## Intent

El sistema actual tiene roles redundantes (ADMIN y SUPER_ADMIN con permisos casi idénticos) y carece de roles operativos necesarios (ENCARGADO/A, VENDEDOR/A). Se necesita una jerarquía donde cada rol solo pueda crear usuarios de nivel inferior, permitiendo una estructura organizativa más clara y segura.

## Scope

### In Scope
- Agregar roles ENCARGADO/A y VENDEDOR/A al enum UserRole
- Implementar jerarquía: SUPER_ADMIN → ADMIN → SUPERVISOR → ENCARGADO/A → VENDEDOR/A
- Actualizar funciones en `src/lib/roles.ts` para nueva jerarquía
- Actualizar schemas Zod en `src/lib/validations.ts`
- Actualizar modelo User en `src/models/User.ts`
- Filtrar roles disponibles en formulario de creación según rol del usuario logueado
- Actualizar API endpoint de usuarios para validar permisos de creación

### Out of Scope
- Cambios en flujos de autenticación (login/logout)
- Integración con sistemas externos
- Migración de datos existentes

## Capabilities

### New Capabilities
- `role-hierarchy-permissions`: Control de permisos de creación de usuarios basado en jerarquía de roles
- `user-role-filtering`: Filtrado de roles disponibles en UI según el rol del usuario autenticado

### Modified Capabilities
- `user-management`: Necesita validar que el creador solo pueda asignar roles de nivel inferior o igual (excepto SUPER_ADMIN)

## Approach

1. Agregar ENCARGADO y VENDEDOR al enum UserRole en `src/types/index.ts`
2. Crear función en `src/lib/roles.ts` que retorne los roles que un usuario puede crear según su propio rol
3. Actualizar schemas de validación para incluir nuevos roles
4. Crear middleware/validación en API para verificar permisos de creación
5. Actualizar formulario de usuarios para filtrar opciones según rol actual

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/types/index.ts` | Modified | Agregar ENCARGADO, VENDEDOR al enum UserRole |
| `src/lib/roles.ts` | Modified | Nuevas funciones de verificación jerárquica |
| `src/lib/validations.ts` | Modified | Actualizar schemas con nuevos roles |
| `src/models/User.ts` | Modified | Actualizar enum en schema mongoose |
| `src/app/dashboard/admin/usuarios/page.tsx` | Modified | Filtrar roles según usuario actual |
| `src/app/api/admin/users/route.ts` | Modified | Validar permisos de creación |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Validación inconsistente entre cliente y servidor | Medium | Centralizar lógica de permisos en `roles.ts` y reutilizar en ambos |
| Usuarios existentes con roles antiguos | Low | Mantener backwards compatibility, solo restrictivo para nuevos |

## Rollback Plan

1. Revertir cambios en `src/types/index.ts` y `src/lib/validations.ts`
2. Restaurar schemas anteriores en Zod y Mongoose
3. Eliminar filtro de roles en UI (mostrar todos)
4. Deshabilitar validación de permisos en API

## Dependencies

- Ninguna dependencia externa

## Success Criteria

- [ ] Enum UserRole incluye ENCARGADO y VENDEDOR
- [ ] Función `getCreatableRoles(role)` retorna array de roles permitidos
- [ ] ADMIN no puede crear SUPER_ADMIN ni ADMIN
- [ ] Formulario muestra solo roles permitidos según usuario actual
- [ ] API valida y rechaza intentos de crear roles no permitidos