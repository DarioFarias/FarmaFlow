# Delta Spec: Farmacias Admin UI

## Change: mejoras-farmacias

## Context
Proposal: unificar UI de Farmacias (modales como Usuarios) + toggle activar/desactivar + restaurar soft-deleted.

---

## MODIFIED Requirements

### Requirement: Interfaz de Farmacias usa modales en lugar de páginas separadas

La interfaz de administración de farmacias DEBE utilizar modales para crear, editar y visualizar farmacias, siguiendo el patrón establecido en CreateUserModal/EditUserModal.

(Previously: Cada acción (crear, editar, ver) era una página separada en /dashboard/admin/farmacias/)

#### Scenario: Editar farmacia desde lista
- GIVEN el usuario está en la página de lista de farmacias
- WHEN hace clic en el botón "Editar" de una farmacia
- THEN se abre el EditPharmacyModal con los datos de la farmacia cargados
- AND la URL no cambia (no hay navegación a página separada)

#### Scenario: Crear nueva farmacia
- GIVEN el usuario está en la página de lista de farmacias
- WHEN hace clic en el botón "Nueva Farmacia"
- THEN se abre el CreatePharmacyModal
- AND la URL no cambia

#### Scenario: Ver detalles de farmacia
- GIVEN el usuario está en la lista de farmacias
- WHEN hace clic en el nombre de una farmacia
- THEN se abre un modal de solo lectura con los detalles completos
- AND no hay navegación a página separada

---

## ADDED Requirements

### Requirement: Toggle activar/desactivar en modal de edición

El modal de edición de farmacia DEBE incluir un toggle para activar o desactivar la farmacia. Este toggle DEBE llamar al endpoint PATCH /api/admin/pharmacies/[id] con el campo isActive.

#### Scenario: Desactivar farmacia desde modal
- GIVEN el usuario tiene abierto el EditPharmacyModal de una farmacia activa
- WHEN togglea el switch "Activa" a posición "desactivado"
- THEN el sistema envía PATCH a /api/admin/pharmacies/[id] con isActive: false
- AND la UI actualiza el indicador visual en la lista
- AND muestra toast de éxito "Farmacia desactivada"

#### Scenario: Activar farmacia desde modal
- GIVEN el usuario tiene abierto el EditPharmacyModal de una farmacia inactiva
- WHEN togglea el switch "Activa" a posición "activado"
- THEN el sistema envía PATCH a /api/admin/pharmacies/[id] con isActive: true
- AND la UI actualiza el indicador visual en la lista
- AND muestra toast de éxito "Farmacia reactivada"

---

### Requirement: Reactivar farmacia soft-deleted desde UI

El sistema DEBE permitir restaurar (reactivar) farmacias que fueron soft-deleted (isActive: false) desde la interfaz de usuario.

#### Scenario: Reactivar desde modal de edición
- GIVEN el usuario abre el EditPharmacyModal de una farmacia inactiva
- WHEN togglea el switch "Activa" a posición "activado"
- THEN el sistema envía PATCH a /api/admin/pharmacies/[id] con isActive: true
- AND la farmacia se reactiva lógicamente

#### Scenario: Reactivar desde lista con acción directa
- GIVEN el usuario está en la lista de farmacias y ve una farmacia inactiva
- WHEN hace clic en el botón "Reactivar" disponible para farmacias inactivas
- THEN el sistema envía PATCH a /api/admin/pharmacies/[id] con isActive: true
- AND la lista se actualiza mostrando la farmacia como activa

---

### Requirement: Indicador visual de estado en lista de farmacias

La lista de farmacias DEBE mostrar un indicador visual claro del estado (activa/inactiva) de cada farmacia.

#### Scenario: Ver indicador de farmacia activa
- GIVEN el usuario está en la lista de farmacias
- WHEN la farmacia tiene isActive: true
- THEN se muestra un indicador visual verde (badge/icono) con texto "Activa"
- AND el toggle en el modal de edición aparece marcado como activo

#### Scenario: Ver indicador de farmacia inactiva
- GIVEN el usuario está en la lista de farmacias
- WHEN la farmacia tiene isActive: false
- THEN se muestra un indicador visual gris/rojo (badge/icono) con texto "Inactiva"
- AND el toggle en el modal de edición aparece desmarcado
- AND puede mostrar un botón o opción para "Reactivar"

#### Scenario: Filtrar por estado
- GIVEN el usuario está en la lista de farmacias
- WHEN selecciona el filtro "Solo activas" o "Solo inactivas"
- THEN la lista muestra únicamente las farmacias que coinciden con el filtro seleccionado
- AND el estado del filtro se mantiene entre sesiones si es posible

---

## Requirements Summary

| Type | Count | Description |
|------|-------|-------------|
| MODIFIED | 1 | Farmacias UI usa modales en lugar de páginas separadas |
| ADDED | 3 | Toggle activar/desactivar, Reactivar soft-deleted, Indicador visual de estado |
| Total | 4 | Requisitos totales |

## API Reference
- PATCH /api/admin/pharmacies/[id] — ya soporta campo isActive (línea 95)
- DELETE /api/admin/pharmacies/[id] — realiza soft-delete (isActive=false)
