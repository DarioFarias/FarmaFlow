# Delta for Usuarios Page — Server/Client Split

## Purpose

Refactor del monolito `'use client'` (293 líneas) a Server + Client Component, siguiendo el patrón farmacias. Cero cambios de comportamiento — solo reorganización en 4 artefactos.

## ADDED Requirements

### R1: Server Component con fetch server-side

`page.tsx` MUST export `generateMetadata()`, llamar `getServerSession(authOptions)`, parsear `searchParams` (page, search), llamar `getFilteredUsers()`, fetch `pharmacies` via `Pharmacy.find()` para modales, computar `creatableRoles` via `getCreatableRoles(userRole)`, y pasar `{ initialData, initialPagination, pharmacies, userRole, currentUserId, assignedPharmacies, creatableRoles }` a `<UsuariosListClient>`.

#### Scenario: Render inicial con datos

- GIVEN usuario ADMIN con usuarios y farmacias en DB
- WHEN Server Component ejecuta `getFilteredUsers()` y `Pharmacy.find()`
- THEN pasa datos como props — Client renderiza sin loading inicial

#### Scenario: Sin sesión activa

- GIVEN no hay sesión
- WHEN `getServerSession()` retorna null
- THEN MUST retornar "No autorizado", no renderizar Client Component

### R2: Client Component con interactividad AJAX

`UsuariosListClient` MUST recibir props tipadas, inicializar con `isLoading: false`, y manejar interactividad vía AJAX a `/api/admin/users`.

#### Scenario: Zero HTTP calls en montaje

- GIVEN Server Component pasó `initialData`
- WHEN Client Component se monta
- THEN no ejecuta fetch() — usa datos iniciales directo

#### Scenario: Search debounce 300ms

- GIVEN usuario escribe en search
- WHEN pasan 300ms sin nuevo input
- THEN AJAX fetch con `search`, resetea `page=1`

#### Scenario: Paginación prev/next via AJAX

- GIVEN usuario en página 2 de 5
- WHEN clic en "Siguiente"
- THEN AJAX fetch con `page=3` + filtros actuales (sin resetear search)

### R3: Shared service getFilteredUsers

`src/lib/services/users.ts` MUST exportar `getFilteredUsers(search?, page?, pageSize?, userRole?, assignedPharmacies?)` y retornar `{ data, page, totalPages, total }`.

#### Scenario: Role-based filtering server-side

- GIVEN SUPERVISOR con `assignedPharmacies: ["a", "b"]`
- WHEN query ejecuta
- THEN MUST filtrar `{ assignedPharmacies: { $in: ["a", "b"] } }` Y `{ role: { $in: getCreatableRoles(SUPERVISOR) } }`

#### Scenario: ADMIN sin filtro de farmacias

- GIVEN ADMIN
- WHEN `getFilteredUsers()` ejecuta
- THEN NO aplica filtro por assignedPharmacies
- AND usa `getCreatableRoles(ADMIN)` para `{ role: { $in: allowedRoles } }`

#### Scenario: Búsqueda por $regex

- GIVEN `search = "john"`
- WHEN construye query
- THEN MUST agregar `$or` con name/username/email usando `{ $regex: "john", $options: "i" }`

#### Scenario: Paginación con skip/limit

- GIVEN `page=2, pageSize=20`
- THEN usa `User.find().sort({ createdAt: -1 }).skip(20).limit(20)` + `countDocuments()`
- AND retorna `{ data, page: 2, totalPages, total }`

### R4: Subcomponentes presentacionales

`UsersToolbar` y `UsersPagination` MUST ser presentacionales — reciben props, no tienen estado interno ni lógica AJAX.

#### Scenario: UsersToolbar con search input

- GIVEN `{ search, isLoading, onSearchChange }`
- WHEN usuario escribe
- THEN llama a `onSearchChange(value)`, no hace AJAX
- AND "Nuevo Usuario" NO está en toolbar — está en header del Client Component

#### Scenario: UsersPagination con prev/next

- GIVEN `{ page, totalPages, isLoading, onPageChange }`
- WHEN clic en "Anterior"
- THEN llama a `onPageChange(page - 1)` si `page > 1`
- AND muestra "Página X de Y" (mismo formato visual actual)

### R5: Empty states consistentes

Client Component MUST mantener todos los estados vacíos del monolito sin cambios visuales.

#### Scenario: Sin resultados de búsqueda

- GIVEN search activo y data vacío
- WHEN renderiza `<UserTable>`
- THEN UserTable muestra su estado vacío interno (sin cambios)

## MODIFIED Requirements

None.

## REMOVED Requirements

None.
