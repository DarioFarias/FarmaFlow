# Farmacias List — Specification

## Purpose

Manage the list view of pharmacies in the admin dashboard. Supports search, filtering by status, sorting, pagination, and role-based access (ADMIN sees all, SUPERVISOR sees only assigned pharmacies).

## Requirements

### R1: Server Component con fetch server-side

The Server Component `page.tsx` MUST:
- Export `generateMetadata()` con `{ title, description }` estático
- Llamar `getServerSession(authOptions)` para obtener `userRole` y `assignedPharmacies`
- Parsear `searchParams` para `page`, `search`, `status`, `sortBy`
- Llamar `getFilteredPharmacies(search, active, sortBy, page, PAGE_SIZE, role, assignedPharmacies)`
- Pasar `initialData`, `initialPagination`, `userRole` como props a `<FarmaciasListClient>`

#### Scenario: Render inicial con datos
- GIVEN usuario ADMIN con farmacias en DB
- WHEN Server Component ejecuta `getFilteredPharmacies()`
- THEN pasa `IPharmacyMetrics[]` como `initialData` al Client Component
- AND Client renderiza sin loading state

#### Scenario: Sin sesión activa
- GIVEN no hay sesión
- WHEN `getServerSession()` retorna null
- THEN MUST retornar "No autorizado", no renderizar Client Component

### R2: Client Component con interactividad AJAX

`FarmaciasListClient` MUST recibir `{ initialData, initialPagination, userRole }: FarmaciasListClientProps`. MUST inicializar estado con esas props (`isLoading: false`). MUST manejar toda la interactividad vía AJAX a `/api/admin/pharmacies/metrics`.

#### Scenario: Zero HTTP calls en montaje
- GIVEN Server Component pasó `initialData`
- WHEN Client Component se monta
- THEN no se ejecuta ningún `fetch()` — usa datos iniciales directo

#### Scenario: Search debounce 300ms
- GIVEN usuario escribe en search
- WHEN pasan 300ms sin nuevo input
- THEN AJAX fetch con `search` param, resetea `page=1`

#### Scenario: Status filter tabs via AJAX
- GIVEN usuario cambia status filter
- WHEN hace clic en tab "Inactivas"
- THEN AJAX fetch con `active=false`, resetea `page=1`

#### Scenario: Sort dropdown via AJAX
- GIVEN usuario cambia sort
- WHEN selecciona "Nombre Z-A"
- THEN AJAX fetch con `sortBy=name-desc`, resetea `page=1`

#### Scenario: Paginación prev/next via AJAX
- GIVEN usuario en página 2 de 5, filtros activos
- WHEN clic en "Siguiente"
- THEN AJAX fetch con `page=3` + filtros actuales (no los resetea)

### R3: Shared service getFilteredPharmacies

The system MUST export `getFilteredPharmacies()` desde `src/lib/services/pharmacies.ts`. MUST aceptar `(search?: string, active?: boolean, sortBy?: string, page?: number, pageSize?: number, userRole?: string, assignedPharmacies?: string[])` y retornar `{ data: IPharmacyMetrics[], page: number, totalPages: number, total: number }`.

#### Scenario: Role-based filtering server-side
- GIVEN usuario SUPERVISOR con `assignedPharmacies: ["id1", "id2"]`
- WHEN `getFilteredPharmacies()` ejecuta aggregation pipeline
- THEN MUST filtrar por `{ _id: { $in: assignedIds } }` en el `$match`
- AND retornar solo farmacias asignadas (hoy se filtraba client-side)

#### Scenario: ADMIN sin filtro role-based
- GIVEN usuario ADMIN
- WHEN `getFilteredPharmacies()` ejecuta
- THEN NO aplica filtro por `assignedPharmacies`

#### Scenario: Paginación con $facet
- GIVEN `page=2, pageSize=20`
- WHEN aggregation ejecuta `$facet` con `$skip` y `$limit`
- THEN retorna `{ data: 20 items, page: 2, totalPages: ceil(total/20), total: N }`

### R4: Subcomponentes presentacionales extraídos

`PharmaciesToolbar` y `PharmaciesPagination` MUST ser subcomponentes puramente presentacionales (no tienen estado interno de filtros ni AJAX). Reciben props, renderizan UI.

#### Scenario: Toolbar con search + tabs + sort
- GIVEN `PharmaciesToolbar` recibe `{ search, statusFilter, sortBy, isLoading, onSearchChange, onStatusFilterChange, onSortChange }`
- WHEN el usuario interactúa
- THEN llama a callbacks, no hace AJAX directo

#### Scenario: Pagination con prev/next
- GIVEN `PharmaciesPagination` recibe `{ page, totalPages, total, isLoading, onPageChange }`
- WHEN clic en prev
- THEN llama a `onPageChange(page - 1)` si `page > 1`

### R5: Empty states consistentes

Client Component MUST mantener los 3 empty states del monolito sin cambios visuales.

#### Scenario: Sin farmacias asignadas
- GIVEN SUPERVISOR sin `assignedPharmacies`
- WHEN render
- THEN "No tienes farmacias asignadas. Contacta al administrador."

#### Scenario: Sin resultados de búsqueda
- GIVEN search activo y data vacía
- WHEN render
- THEN "No se encontraron farmacias"

#### Scenario: Sin farmacias registradas
- GIVEN sin search, sin filtros, sin data
- WHEN render
- THEN "No hay farmacias registradas todavía. ¡Haz clic en Nueva Farmacia para empezar!"
