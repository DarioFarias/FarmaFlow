# Specification: SUPERVISOR Pharmacies Access

## ADDED Requirements

### Requirement: Supervisor Access to Pharmacies Page

El sistema DEBE permitir acceso de usuarios con rol SUPERVISOR a la página `/dashboard/admin/farmacias`.

#### Scenario: SupervisorAccess

- GIVEN usuario logueado con rol SUPERVISOR
- WHEN accede a `/dashboard/admin/farmacias`
- THEN debe ver la página (no 403)

### Requirement: Filter Assigned Pharmacies Only

El sistema DEBE mostrar únicamente las farmacias assignadas al supervisor.

#### Scenario: ShowOnlyAssigned

- GIVEN supervisor con assignedPharmacies: `["pharmacy-1-id"]`
- WHEN visualiza lista de farmacias
- THEN solo muestra `pharmacy-1-id`
- AND no muestra otras farmacias

#### Scenario: NoAssignedPharmacies

- GIVEN supervisor sin farmacias assignadas (assignedPharmacies: `[]`)
- WHEN visualiza lista de farmacias
- THEN muestra mensaje "No tienes farmacias assignadas"

### Requirement: Admin Sees All Pharmacies

El sistema DEBE permitir que ADMIN y SUPER_ADMIN vean todas las farmacias.

#### Scenario: AdminSeesAll

- GIVEN usuario logueado con rol ADMIN
- WHEN accede a `/dashboard/admin/farmacias`
- THEN ve todas las farmacias del sistema