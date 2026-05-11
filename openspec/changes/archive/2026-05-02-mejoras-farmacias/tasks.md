# Task Breakdown: mejoras-farmacias

## Change Overview
Unificar UI de Farmacias para usar modales (como Usuarios) + toggle activar/desactivar + opción de reactivar soft-deleted.

---

## Phase 1: Foundation (Setup)

### Task 1.1: Crear carpeta de componentes
- **Path**: `src/components/admin/farmacias/`
- **Action**: Crear directorio

### Task 1.2: Definir tipos para PharmacyModals
- **New file**: `src/components/admin/farmacias/types.ts`
- **Contents**: `PharmacyFormData`, `CreatePharmacyModalProps`, `EditPharmacyModalProps`, `PharmacyDetailsModalProps`

### Task 1.3: Revisar tipos existentes de Farmacia
- **Action**: Verificar `IPharmacy` y `IPharmacyMetrics` en `/types`

---

## Phase 2: Core Components - Modales

### Task 2.1: Crear CreatePharmacyModal
- **Path**: `src/components/admin/farmacias/CreatePharmacyModal.tsx`
- **API**: POST /api/admin/pharmacies

### Task 2.2: Crear EditPharmacyModal
- **Path**: `src/components/admin/farmacias/EditPharmacyModal.tsx`
- **NEW Feature**: Toggle `isActive` (switch) → PATCH /api/admin/pharmacies/[id]

### Task 2.3: Crear PharmacyDetailsModal
- **Path**: `src/components/admin/farmacias/PharmacyDetailsModal.tsx`
- **Display**: Solo lectura con métricas

---

## Phase 3: Page Integration

### Task 3.1: Modificar FarmaciasPage - Estado de modales
- **File**: `src/app/dashboard/admin/farmacias/page.tsx`
- **Add state**: `isCreateModalOpen`, `isEditModalOpen`, `isDetailsModalOpen`, `selectedPharmacy`

### Task 3.2: Modificar FarmaciasPage - Handlers
- **Add**: `handleCreate()`, `handleEdit(pharmacy)`, `handleView(pharmacy)`, `handleDelete(pharmacy)`, `handleToggleActive(pharmacy, isActive)`

### Task 3.3: Modificar FarmaciasPage - Reemplazar Links
- **Action**: Cambiar botón "Nueva Farmacia" para abrir modal

### Task 3.4: Modificar FarmaciasPage - Renderizar modales
- **Action**: Importar y renderizar los 3 modales

### Task 3.5: Modificar FarmaciasPage - pasar callbacks a PharmacyCard
- **File**: `src/components/admin/pharmacies/PharmacyCard.tsx`
- **Modify**: Convertir Link "Editar" y "Ver" en callbacks `onEdit`, `onView`

---

## Phase 4: UX Improvements

### Task 4.1: Mejorar indicador visual de estado en PharmacyCard
- **Enhancement**: Agregar ícono y hacerlo más prominente

### Task 4.2: Agregar opción de reactivar desde lista
- **Location**: PharmacyCard para farmacias inactivas
- **Action**: Botón "Reactivar" que hace PATCH directo

### Task 4.3: Verificar filtros por estado
- **Action**: Verificar que los tabs de filtro funcionen con la nueva UI

---

## Phase 5: Cleanup

### Task 5.1: Eliminar página /nueva obsoleta
- **File**: `src/app/dashboard/admin/farmacias/nueva/page.tsx`

### Task 5.2: Eliminar página /[id] obsoleta
- **File**: `src/app/dashboard/admin/farmacias/[id]/page.tsx`

### Task 5.3: Eliminar página /[id]/editar obsoleta
- **File**: `src/app/dashboard/admin/farmacias/[id]/editar/page.tsx`

---

## Phase 6: Verification

### Task 6.1: Build del proyecto (`npm run build`)
### Task 6.2: Verificar tipos TypeScript (`npx tsc --noEmit`)
### Task 6.3-6.7: Tests manuales (crear, editar, toggle, reactivar, ver detalles)

---

## Tasks Summary by Phase

| Phase | Tasks | Description |
|-------|-------|-------------|
| Phase 1 | 3 | Foundation (carpeta, tipos) |
| Phase 2 | 3 | Core Components (3 modales) |
| Phase 3 | 5 | Page Integration |
| Phase 4 | 3 | UX Improvements |
| Phase 5 | 3 | Cleanup |
| Phase 6 | 7 | Verification |
| **Total** | **24** | |
