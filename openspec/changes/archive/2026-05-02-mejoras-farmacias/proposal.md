# Proposal: mejoras-farmacias

## Intent

Crear proposal para unificar UI de Farmacias (modales) y agregar toggle activar/desactivar, más opción de reactivar farmacias soft-deleted.

**Why**: Inconsistencia UX entre Usuarios (modales) vs Farmacias (páginas), y farmacias soft-deleted no pueden reactivarse desde UI

**Learned**: 
- API PATCH ya soporta isActive (línea 95) pero UI no tiene toggle
- DELETE en pharmacy hace soft-delete (isActive=false) pero no hay forma de revertir desde UI
- CreateUserModal/EditUserModal pueden servir como referencia para los modales de farmacia

## Scope

### In Scope
- Unificar UI de Farmacias para usar modales en lugar de páginas separadas
- Agregar toggle activar/desactivar en modal de edición
- Agregar opción de reactivar farmacias soft-deleted desde UI
- Mejorar indicador visual de estado (activa/inactiva)
- Eliminar páginas obsoletas (/nueva, /[id], /[id]/editar)

### Out of Scope
- Cambios en API endpoints (ya soportan todo lo necesario)
- Testing E2E automatizado
- Nuevos campos en modelo de datos
- Cache de farmacias

## Approach

1. Crear carpeta `src/components/admin/farmacias/` con modales independientes (CreatePharmacyModal, EditPharmacyModal, PharmacyDetailsModal)
2. Modificar PharmacyCard para aceptar callbacks en lugar de links
3. Modificar page.tsx como orquestador de modales
4. Eliminar páginas obsoletas
5. El toggle isActive en EditPharmacyModal usa PATCH existente

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Romper navegación existente | Low | Mantener página principal como contenedor |
| Conflictos con trabajo previo en farmacias | Low | Revisar compatibilidad |
