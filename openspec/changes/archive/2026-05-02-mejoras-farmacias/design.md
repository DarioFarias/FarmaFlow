# Technical Design: Farmacias Admin UI con Modales

## Change: mejoras-farmacias

---

## 1. Technical Approach Resumido

El objetivo es unificar la interfaz de administración de Farmacias para seguir el mismo patrón que Usuarios: modales en lugar de páginas separadas. La página principal (`/dashboard/admin/farmacias`) se mantiene como contenedor, pero las acciones de crear, editar y ver detalles se realizan mediante modales overlay.

**Estrategia de implementación:**
- Crear carpeta `src/components/admin/farmacias/` para los nuevos componentes de modales
- Reutilizar `AdminConfirmModal` existente (ya soporta verificación de contraseña con cache)
- Modificar `PharmacyCard` para aceptar callbacks de editar/ver en lugar de usar links
- La página `page.tsx` se convierte en el orquestador de modales
- Los indicadores visuales de estado (isActive) ya existen en PharmacyCard - solo requieren mejora visual

---

## 2. Architecture Decisions

### Opción A: Modales como Componentes Independientes (Elegida)
- Crear `CreatePharmacyModal`, `EditPharmacyModal`, `PharmacyDetailsModal` independientes
- La página principal maneja el estado de qué modal está abierto
- **Ventaja**: Componentes más pequeños, reutilizables, fáciles de testear
- **Ventaja**: Separación clara de responsabilidades
- **Desventaja**: Requiere pasar muchos props a través de la página

### Opción B: Componente FarmaciasController Unificado
- Un solo componente que maneja toda la lógica de UI
- **Desventaja**: Componente muy grande, difícil de mantener
- **Desventaja**: Difícil de testear unitariamente

### Decisiones Adicionales:

1. **Toggle isActive en EditPharmacyModal**: 
   - Usar un Switch component de UI existente o crear uno simple con HTML/CSS
   - El toggle envía PATCH a `/api/admin/pharmacies/[id]` con `isActive: boolean`
   - Mostrar toast de éxito: "Farmacia activada" / "Farmacia desactivada"

2. **Reactivar desde Lista**:
   - Agregar botón "Reactivar" en PharmacyCard para farmacias inactivas
   - El botón hace PATCH directo (sin modal de confirmación)

3. **Indicador Visual de Estado**:
   - El PharmacyCard ya tiene indicadores (verde "Activa", rojo "Inactiva")
   - Mejorar: agregar ícono y hacerlo más prominente
   - Los filtros por estado ya existen en la página

---

## 3. File Changes

### Archivos a CREAR (nuevos componentes):

| Archivo | Descripción |
|---------|-------------|
| `src/components/admin/farmacias/types.ts` | Tipos para PharmacyModals |
| `src/components/admin/farmacias/CreatePharmacyModal.tsx` | Modal para crear nueva farmacia |
| `src/components/admin/farmacias/EditPharmacyModal.tsx` | Modal para editar + toggle isActive |
| `src/components/admin/farmacias/PharmacyDetailsModal.tsx` | Modal de solo lectura para ver detalles |

### Archivos a MODIFICAR:

| Archivo | Cambios |
|---------|---------|
| `src/app/dashboard/admin/farmacias/page.tsx` | Eliminar Link a "/nueva", manejar estado de modales, pasar callbacks a PharmacyCard |
| `src/components/admin/pharmacias/PharmacyCard.tsx` | Convertir Links de Edit/Ver en callbacks onEdit/onView, agregar botón Reactivar |

### Archivos a ELIMINAR (ya no necesarios):
- `src/app/dashboard/admin/farmacias/nueva/page.tsx`
- `src/app/dashboard/admin/farmacias/[id]/page.tsx`
- `src/app/dashboard/admin/farmacias/[id]/editar/page.tsx`

---

## 4. Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FarmaciasPage (page.tsx)                     │
│                                                                     │
│  Estado:                                                            │
│  - isCreateModalOpen: boolean                                       │
│  - isEditModalOpen: boolean                                         │
│  - isDetailsModalOpen: boolean                                      │
│  - selectedPharmacy: IPharmacyMetrics | null                        │
│                                                                     │
│  Funciones:                                                         │
│  - handleCreate() → open create modal                               │
│  - handleEdit(pharmacy) → open edit modal + set selected            │
│  - handleView(pharmacy) → open details modal + set selected         │
│  - handleDelete(pharmacy) → DELETE /api/admin/pharmacies/[id]       │
│  - handleToggleActive(pharmacy, isActive) → PATCH isActive          │
│  - handleRefresh() → fetchFarmacias()                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     CreatePharmacyModal                             │
│  Props: isOpen, onClose, onSuccess, currentRole                     │
│  API: POST /api/admin/pharmacies                                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     EditPharmacyModal                               │
│  Props: isOpen, pharmacy, onClose, onSuccess                        │
│  Toggle: isActive (switch) → PATCH /api/admin/pharmacies/[id]       │
│  API: PATCH /api/admin/pharmacies/[id]                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    PharmacyDetailsModal                             │
│  Props: isOpen, pharmacy, onClose, onEdit                           │
│  Solo lectura: mostrar todos los campos de la farmacia              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 5. Testing Strategy

### Unit Tests
- **CreatePharmacyModal**: Testing de validación de form, manejo de errores API
- **EditPharmacyModal**: Testing del toggle isActive, refetch después de cambio de estado
- **PharmacyCard**: Testing de los callbacks onEdit, onView, onToggleActive

### Integration Tests
- Flujo completo: crear farmacia → aparece en lista
- Flujo completo: editar pharmacyName → se actualiza en lista
- Flujo completo: togglear isActive → cambia indicador visual + se persiste en API

---

## 6. API Endpoints a Utilizar

| Método | Endpoint | Uso |
|--------|----------|-----|
| GET | `/api/admin/pharmacies` | Fetch lista (ya existe) |
| POST | `/api/admin/pharmacies` | Crear nueva (ya existe) |
| PATCH | `/api/admin/pharmacies/[id]` | Editar, incluir isActive (ya existe, línea 95) |
| DELETE | `/api/admin/pharmacies/[id]` | Soft-delete (isActive=false) (ya existe) |

---

## 7. Consideraciones de UX

1. **Indicador visual de estado**: El PharmacyCard ya tiene badges verde/rojo - mejorar con ícono
2. **Filtros por estado**: Los tabs "Todas/Activas/Inactivas" ya existen - mantienen funcionalidad
3. **Botón Reactivar**: Agregar en PharmacyCard (farmacias inactivas) - acción directa sin modal
4. **Transiciones**: Usar las mismas animaciones que CreateUserModal
5. **Errores**: Toast de error para fallos API, inline errors para validación de form

---

## 8. Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Modales muy grandes con muchos campos | Separar en secciones (datos básicos, contacto, configuración) |
| API no soporta algún campo nuevo | Revisar endpoint PATCH línea 95 - ya soporta isActive |
| Conflictos con trabajo anterior en páginas | Las páginas a eliminar no están en uso activo todavía |
| Testing insuficiente | Priorizar integration tests sobre unit tests |
