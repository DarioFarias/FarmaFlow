# Proposal: Completar funcionalidad de administración de usuarios

## Intent

El componente de administración de usuarios en el dashboard de admin tiene ~80% de sus funcionalidades core implementadas, pero carece de features de usabilidad crítica (búsqueda, paginación) y presenta bugs menores de UX. El objetivo es completar el CRUD con las features faltantes y arreglar los bugs reportados para mejorar la experiencia del administrador.

## Scope

### In Scope
- Implementar búsqueda por nombre/username en UI (la API ya soporta filtrado)
- Implementar controles visuales de paginación (la API devuelve total, page, totalPages)
- Corregir bug de icono password duplicado en CreateUserModal (línea 280)
- Corregir bug de reset de password al cerrar PasswordModal
- **NUEVO**: Confirmación de contraseña del admin para cambios críticos de seguridad
- **BUG FIX**: El endpoint GET `/api/admin/users` no devuelve el campo `username`, causando que el EditUserModal muestre el campo vacío

### Out of Scope
- Validación de complejidad de password (declarada explícitamente fuera de scope por el usuario)
- Exportación CSV (prioridad BAJA, deferida para futura iteración)
- Logs de auditoría
- Modo oscuro

## Capabilities

### New Capabilities
- `user-search`: Input de búsqueda en UI que filtra usuarios por nombre o username
- `user-pagination`: Controles visuales de paginación (anterior/siguiente/números de página)
- `admin-password-confirmation`: Modal de confirmación que requiere que el admin ingrese su propia contraseña antes de ejecutar cambios críticos (password, username, email, rol, eliminación)

### Modified Capabilities
- `user-crud`: Actualizar para incluir búsqueda y paginación en la interfaz
- `security-flow`: Añadir paso de confirmación de identidad para operaciones sensibles

## Approach

Se implementarán las features faltantes y se corregirán los bugs manteniendo la arquitectura existente (componentes separados, validaciones Zod, API REST). Se modificarán los componentes UserTable.tsx para añadir búsqueda y paginación, se corregirán los bugs en los modales de creación y password, y se añadirá la confirmación de contraseña del admin para operaciones críticas de seguridad.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/dashboard/admin/usuarios/page.tsx` | Modified | Añadir estado para búsqueda y paginación |
| `src/components/admin/users/UserTable.tsx` | Modified | Añadir input de búsqueda y controles de paginación |
| `src/components/admin/users/CreateUserModal.tsx` | Modified | Corregir icono password duplicado línea 280 |
| `src/components/admin/users/PasswordModal.tsx` | Modified | Resetear campo password al cerrar modal |
| `src/components/admin/users/EditUserModal.tsx` | Modified | Añadir confirmación de contraseña antes de guardar (para username, email, rol) |
| `src/components/admin/users/DeleteUserModal.tsx` | Modified | Añadir confirmación de contraseña antes de eliminar |
| `src/components/admin/users/AdminConfirmModal.tsx` | **NEW** | Componente reutilizable para confirmar con contraseña del admin |
| `src/app/api/admin/users/route.ts` | **FIX** | Agregar `username` al `.select()` de Mongoose (línea 63) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Quebrar funcionalidad existente al añadir búsqueda/paginación | Low | Mantener comportamiento actual si no hay parámetros de búsqueda |
| El admin olvida su contraseña durante confirmación | Medium | Ofrecer opción de "cerrar sesión y recuperar" |
| UX: confirmación repetitiva si hace varios cambios seguidos | Low | Cachear confirmación por sesión (5 min) |

## Rollback Plan

1. Revertir cambios en UserTable.tsx y page.tsx a versión anterior
2. Restaurar validaciones anteriores en validations.ts
3. Deshacer cambios en CreateUserModal.tsx y PasswordModal.tsx
4. No requiere migración de base de datos

## Dependencies

- Ninguna dependencia externa. La API ya soporta filtrado y paginación.
- Se requerirá endpoint de validación de contraseña del admin (`/api/auth/verify-password`)

## Detalle: Confirmación de Contraseña del Admin

### Problema que resuelve
Evitar cambios accidentales o no autorizados cuando el admin deja su sesión abierta. Si el admin se paró a atender algo y alguien accede a su equipo, no puede hacer cambios críticos sin saber la contraseña del admin.

### Cambios que requieren confirmación
| Operación | Requiere confirmación |
|-----------|----------------------|
| Cambiar contraseña de usuario | ✅ Sí |
| Cambiar username de usuario | ✅ Sí |
| Cambiar email de usuario | ✅ Sí |
| Cambiar rol de usuario | ✅ Sí |
| Eliminar usuario | ✅ Sí |
| Activar/Desactivar usuario | ❌ No |
| Editar nombre visible | ❌ No |
| Editar farmacias asignadas | ❌ No |

### Flujo propuesto
1. Admin hace click en acción crítica (ej: cambiar password)
2. Se abre modal "Confirmar identidad" pidiendo contraseña del admin
3. Admin ingresa su contraseña actual
4. Si es correcta, se ejecuta la acción
5. La confirmación se cachea por 5 minutos (opcional)

## Success Criteria

- [ ] La búsqueda por nombre/username filtra correctamente los usuarios en tiempo real
- [ ] Los controles de paginación navegan entre páginas actualizando la tabla
- [ ] El icono de mostrar/ocultar password muestra iconos diferentes en CreateUserModal
- [ ] El campo de password se limpia al cerrar el PasswordModal
- [ ] **BUG FIX**: El EditUserModal ahora muestra el username del usuario cuando se abre
- [ ] Al cambiar password de un usuario, se pide confirmación con contraseña del admin
- [ ] Al cambiar username, email o rol, se pide confirmación con contraseña del admin
- [ ] Al eliminar un usuario, se pide confirmación con contraseña del admin
- [ ] La confirmación se puede cachear por 5 minutos para evitar pedidos repetitivos