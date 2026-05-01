# Proposal: Pharmacy View Mode Page

## Intent

Crear una página de visualización de solo lectura para ver los detalles completos de una farmacia. Actualmente existe la página de edición (`/editar`) pero no existe una página de solo visualización (`/ver`) que permita a cualquier usuario ver los detalles sin opción de modificar.

## Scope

### In Scope
- Crear página nueva en `/dashboard/admin/farmacias/[id]/ver`
- Crear componente `PharmacyView` para mostrar datos de pharmacy en modo solo lectura
- Añadir link "Ver" en PharmacyCard (similar al link "Editar" existente)
- Mostrar: nombre, dirección, teléfono, email, estado (activo/inactivo), métricas (pedidos pendientes, gastos pendientes), usuarios asignados, resumen mensual
- Manejo de estados: loading, error, not-found

### Out of Scope
- Dashboard analytics con gráficos detallados
- Exportación de datos (PDF/CSV)
- Historial de cambios de la farmacia
- edición inline desde la vista

## Capabilities

### New Capabilities
- `pharmacy-view`: Página de solo lectura para visualizar detalles de una farmacia específica

### Modified Capabilities
- Ninguno (es funcionalidad nueva)

## Approach

Reutilizar el patrón existente de la página de edición (`[id]/editar/page.tsx`):
1. Reutilizar la API `/api/admin/pharmacies/[id]` existente (GET)
2. Crear componente `PharmacyView` con diseño similar a `PharmacyCard` expandido pero en formato página
3. Mostrar toda la información disponible incluyendo métricas y usuarios asignados
4. Links de navegación: Volver al listado, Editar (si tiene permisos)

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/dashboard/admin/farmacias/[id]/ver/page.tsx` | New | Page route para ver pharmacy |
| `src/components/admin/pharmacias/PharmacyView.tsx` | New | Componente de presentación |
| `src/components/admin/pharmacias/PharmacyCard.tsx` | Modified | Añadir link "Ver" junto a "Editar" |
| `/api/admin/pharmacies/[id]` | No change | Ya existe y se reutiliza |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Datos inconsistentes entre card y view | Low | Reutilizar mismos campos/tipos |
| Permisos incorrectos en vista | Low | Verificar roles en componente |

## Rollback Plan

1. Eliminar `src/app/dashboard/admin/farmacias/[id]/ver/`
2. Eliminar `src/components/admin/pharmacias/PharmacyView.tsx`
3. Revertir cambios en `PharmacyCard.tsx` (quitar link "Ver")
4. No hay cambios en API ni DB

## Dependencies

- API endpoint `/api/admin/pharmacies/[id]` (ya existe)
- Tipos `IPharmacyMetrics` (ya existen)

## Success Criteria

- [ ] Página accesible en `/dashboard/admin/farmacias/[id]/ver` carga correctamente
- [ ] Muestra todos los campos de la pharmacy (nombre, dirección, teléfono, email, estado)
- [ ] Muestra métricas (pedidos pendientes, gastos pendientes)
- [ ] Muestra usuarios asignados y resumen mensual
- [ ] Maneja estados: loading, error, not-found correctamente
- [ ] Link "Ver" visible en PharmacyCard
- [ ] Build pasa sin errores