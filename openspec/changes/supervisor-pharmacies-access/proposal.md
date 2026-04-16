# Proposal: supervisor-pharmacies-access

## Intent

Permitir que usuarios con rol SUPERVISOR accedan a la página `/dashboard/admin/farmacias` viendo únicamente las farmacias asignadas a ellos. Actualmente el sistema bloquea todo acceso a rutas `/dashboard/admin/*` con error 403.

## Scope

### In Scope
- Modificar middleware para permitir acceso de SUPERVISOR a `/dashboard/admin/farmacias`
- Modificar página de farmacias para filtrar por `assignedPharmacies` del usuario actual
- Ajustar endpoint API existente para devolver farmacias filtradas por supervisor

### Out of Scope
- Cambiar permisos de otras páginas admin
- Modificar funcionalidades de ADMIN/SUPER_ADMIN
- Agregar UI de asignación de farmacias (ya existe campo en modelo)

## Capabilities

### New Capabilities
- `supervisor-view-assigned-pharmacies`: Supervisor puede ver lista de farmacias asignadas

### Modified Capabilities
- None

## Approach

1. **Middleware**: Modificar `src/middleware.ts` para permitir rol SUPERVISOR en `/dashboard/admin/farmacias`
2. **API**: Extender endpoint `/api/admin/pharmacies` para aceptar rol SUPERVISOR y filtrar por `assignedPharmacies`
3. **UI**: En `src/app/dashboard/admin/farmacias/page.tsx`, agregar lógica de filtrado según el rol

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/middleware.ts` | Modified | Permitir SUPERVISOR a `/dashboard/admin/farmacias` |
| `src/app/api/admin/pharmacies/route.ts` | Modified | Agregar filtro por assignedPharmacies para SUPERVISOR |
| `src/app/dashboard/admin/farmacias/page.tsx` | Modified | Mostrar solo farmacias asignadas |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Filtro no aplicado correctamente | Low | Validar en backend que no se expongan datos de otras farmacias |

## Rollback Plan

1. Revertir cambios en middleware.ts (quitar SUPERVISOR de la ruta permitida)
2. Revertir endpoint API para solo aceptar ADMIN/SUPER_ADMIN
3. Restaurar página de farmacias a comportamiento anterior

## Dependencies

- NextAuth.js configurado
- Campo `assignedPharmacies` ya existe en modelo User
- MongoDB/Mongoose

## Success Criteria

- [ ] Supervisor puede acceder a `/dashboard/admin/farmacias` sin error 403
- [ ] Solo muestra las farmacias asignadas al supervisor logueado
- [ ] Otros roles (ADMIN/SUPER_ADMIN) ven todas las farmacias como antes
