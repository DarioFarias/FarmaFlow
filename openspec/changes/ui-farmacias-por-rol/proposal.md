# Proposal: UI de Farmacias por Rol

## Intent

El formulario de creación de usuarios currently muestra TODAS las farmacias sin filtrar por el rol del usuario logueado. Esto causa que SUPERVISOR vea farmacias que no le pertenecen y que ENCARGADO no pueda crear usuarios. Se necesita filtrar el selector de farmacias según el rol y aplicar la regla de auto-asignación cuando ENCARGADO crea VENDEDOR.

## Scope

### In Scope
- Filtrar opciones de farmacias según rol del usuario actual
- Mostrar pharmacy info (display-only) para ENCARGADO/VENDEDOR
- ENCARGADO puede crear VENDEDOR con auto-asignación a su farmacia
- SUPERVISOR ve solo sus farmacias asignadas (el API ya filtra)

### Out of Scope
- Modificaciones al backend de creación de usuarios (ya existe lógica)
- Cambios en el modelo de datos de usuarios o farmacias
- Validación de permisos a nivel API (solo UI)

## Capabilities

### Modified Capabilities
- `user-management`: La UI de gestión de usuarios ahora filtra farmacias según el rol del creador y aplica auto-asignación para ENCARGADO → VENDEDOR

## Approach

1. **Obtener farmacias filtradas**: Usar `/api/admin/pharmacies` que ya filtra por `assignedPharmacies` para SUPERVISOR
2. **Lógica por rol**:
   - ADMIN: mostrar todas las farmacias (selector)
   - SUPERVISOR: mostrar solo sus asignadas (selector)
   - ENCARGADO: mostrar su única farmacia (display, no selector) + puede crear VENDEDOR
   - VENDEDOR: mostrar su farmacia asignada (display, no selector)
3. **Auto-asignación**: En el submit, si el creador es ENCARGADO y el rol objetivo es VENDEDOR, asignar automáticamente la farmacia del ENCARGADO

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/dashboard/admin/usuarios/page.tsx` | Modified | Filtro de farmacias por rol, display mode, auto-assign |
| `src/lib/roles.ts` | Modified | Agregar `getVisiblePharmacies()` helper |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking existing ENCARGADO workflow | Medium | Probar flujo completo post-cambio |
| SUPERVISOR sin farmacias asignadas ve vacío | Low | Mostrar mensaje claro |

## Rollback Plan

1. Revertir cambios en `page.tsx` (quitar filtro y lógica de auto-assign)
2. El selector vuelve a mostrar todas las farmacias (comportamiento actual)

## Dependencies

- `/api/admin/pharmacies` debe seguir retornando solo las asignadas para SUPERVISOR (ya funciona)

## Success Criteria

- [ ] ADMIN ve todas las farmacias en el selector
- [ ] SUPERVISOR ve solo sus farmacias asignadas en el selector
- [ ] ENCARGADO ve su farmacia como texto (no selector)
- [ ] ENCARGADO puede crear VENDEDOR y se auto-asigna su farmacia
- [ ] VENDEDOR ve su farmacia como texto (display-only, no puede crear usuarios)