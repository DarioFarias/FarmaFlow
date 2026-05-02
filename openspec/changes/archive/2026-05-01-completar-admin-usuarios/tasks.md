# Tasks: Completar funcionalidad de administración de usuarios

## Phase 1: Foundation (API Backend)

- [ ] 1.1 Agregar `username` al `.select()` en GET `/api/admin/users/route.ts` (línea ~63)
- [ ] 1.2 Crear endpoint POST `/api/auth/verify-password` que valide contraseña del admin con bcrypt.compare
- [ ] 1.3 Devolver `{ valid: true }` o `{ error: string, code: 'INVALID_PASSWORD' }` en verify-password
- [ ] 1.4 Manejar 401 si no hay sesión activa en verify-password

## Phase 2: Core Components (Nuevo Componente)

- [ ] 2.1 Crear `AdminConfirmModal.tsx` en `src/components/admin/users/`
- [ ] 2.2 Definir props: isOpen, onClose, onConfirm, isLoading, title, message
- [ ] 2.3 Implementar input de contraseña con toggle show/hide (Eye/EyeOff)
- [ ] 2.4 Agregar caché de 5 minutos con useState + timestamp (expira después de 5 min)
- [ ] 2.5 Llamar a `/api/auth/verify-password` en onConfirm

## Phase 3: Page Component (Estados y Fetch)

- [ ] 3.1 Agregar estado `searchQuery` (string) en `usuarios/page.tsx`
- [ ] 3.2 Agregar estado `currentPage` (number, default 1)
- [ ] 3.3 Agregar estado `totalPages` (number)
- [ ] 3.4 Crear función `fetchUsers(search, page)` con parámetros en URL
- [ ] 3.5 Implementar debounce de 300ms para search antes de llamar API
- [ ] 3.6 Actualizar tabla cuando cambie searchQuery o currentPage

## Phase 4: UserTable Component (Búsqueda y Paginación)

- [ ] 4.1 Agregar input de búsqueda con debounce en `UserTable.tsx`
- [ ] 4.2 Agregar controles de paginación (botones Anterior/Siguiente)
- [ ] 4.3 Mostrar indicador "Página X de Y"
- [ ] 4.4 Deshabilitar botón Anterior en página 1
- [ ] 4.5 Deshabilitar botón Siguiente en última página

## Phase 5: CreateUserModal (Fix UX)

- [ ] 5.1 Corregir icono password duplicado (línea 280) - cambiar icono mostrar
- [ ] 5.2 Usar icons diferentes para mostrar/ocultar (Eye/EyeOff)

## Phase 6: PasswordModal (Reset + Confirmación)

- [ ] 6.1 Resetear `newPassword` a string vacío al cerrar modal
- [ ] 6.2 Integrar `AdminConfirmModal` antes de cambiar password
- [ ] 6.3 Solo ejecutar cambio si contraseña del admin es válida

## Phase 7: EditUserModal (Integrar Confirmación)

- [ ] 7.1 Integrar `AdminConfirmModal` antes de guardar cambios
- [ ] 7.2 Aplicar confirmación para username, email, rol
- [ ] 7.3 No aplicar confirmación para nombre visible ni farmacias

## Phase 8: DeleteUserModal (Integrar Confirmación)

- [ ] 8.1 Integrar `AdminConfirmModal` antes de eliminar usuario
- [ ] 8.2 Mensaje personalizado: "Esta acción no se puede deshacer"

## Phase 9: Testing e Integración

- [ ] 9.1 Verificar búsqueda filtra usuarios por nombre/username
- [ ] 9.2 Verificar paginación navega correctamente
- [ ] 9.3 Verificar EditUserModal muestra username del usuario
- [ ] 9.4 Verificar confirmación funciona en todos los modales
- [ ] 9.5 Verificar caché de 5 minutos expira correctamente