# Proposal: Server-Client Split — Farmacias Page

## Intent

El monolito `'use client'` en `src/app/dashboard/admin/farmacias/page.tsx` (441 líneas) mezcla fetching, estado interactivo y UI inline. Bloquea metadata dinámica, empeora mantenibilidad y contradice el patrón Server/Client Component ya probado en gastos.

## Scope

**In Scope:**
- Server Component `page.tsx`: `generateMetadata()`, `getServerSession()`, fetch inicial vía shared service, render `<FarmaciasListClient>`
- Client Component `FarmaciasListClient.tsx`: recibe `initialData`, `initialPagination`, `userRole`; maneja AJAX a `/api/admin/pharmacies/metrics`; renderiza modales existentes
- Shared service `src/lib/services/pharmacies.ts`: `getFilteredPharmacies()` con aggregation pipeline, role-based filtering, paginación
- Subcomponentes extraídos: `PharmaciesToolbar.tsx` (search + filter tabs + sort), `PharmaciesPagination.tsx` (prev/next + page info)

**Out of Scope:**
- Modales existentes (CreatePharmacyModal, EditPharmacyModal, PharmacyDetailsModal, PharmacyCard)
- API routes existentes (`/api/admin/pharmacies/*`)
- Tipos (`farmacias/types.ts`, `api-responses.ts`)
- Migración de gastos

## Capabilities

**New:** None — pure refactor, sin nuevo comportamiento de especificación
**Modified:** None — no cambian requerimientos, solo reorganización de componentes

## Approach

Mismo patrón de gastos: Server Component fetch inicial directo a MongoDB via shared service, pasa `initialData` como props al Client Component. El Client usa esos datos para render inicial y luego hace AJAX a API routes existentes.

**Server Component:**
1. `generateMetadata()` con `{ title, description }` estático
2. `getServerSession()` → `userRole`, `assignedPharmacies`
3. Parse `searchParams` para filtros iniciales
4. `getFilteredPharmacies(search, active, sortBy, page, PAGE_SIZE, role, assignedPharmacies)` → data + paginación
5. Render `<FarmaciasListClient initialData={...} initialPagination={...} userRole={...} />`

**Client Component:**
1. Render inicial con `initialData` — sin loading en primera carga
2. Search debounce 300ms, status filter, sort, paginación → AJAX a `/api/admin/pharmacies/metrics`
3. Modales sin cambios; empty states idénticos

**Shared service (`pharmacies.ts`):**
- `getFilteredPharmacies(search, active, sortBy, page, pageSize, userRole, assignedPharmacies)` → `{ data, page, totalPages, total }`
- Replica aggregation `$facet` del endpoint `/metrics` (Pharmacy + SupplyRequest + Expense + User)
- Filtro role-based para SUPERVISOR server-side (hoy es client-side en `fetchFarmacias`)
- Reusa `TTLCache` de `src/lib/ttl-cache.ts`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/dashboard/admin/farmacias/page.tsx` | Modified | De `'use client'` a Server Component |
| `src/app/dashboard/admin/farmacias/FarmaciasListClient.tsx` | New | Client Component con toda la interactividad |
| `src/app/dashboard/admin/farmacias/PharmaciesToolbar.tsx` | New | Search input + filter tabs + sort dropdown |
| `src/app/dashboard/admin/farmacias/PharmaciesPagination.tsx` | New | Prev/next buttons + page info |
| `src/lib/services/pharmacies.ts` | New | Shared service con aggregation pipeline |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|-------------|
| SUPERVISOR pierde filtro role-based | Low | Shared service recibe `assignedPharmacies` y filtra en aggregation |
| Duplicación lógica `$facet` vs endpoint `/metrics` | Medium | Shared service = fuente de verdad; endpoint puede delegar a futuro |
| Loading states no coinciden durante AJAX | Low | Client mantiene `isLoading` exactamente como hoy |
| Error al extraer inline JSX a subcomponentes | Low | Subcomponentes son puramente presentacionales |

## Rollback

Revertir `page.tsx` a `'use client'`, eliminar `FarmaciasListClient.tsx`, `PharmaciesToolbar.tsx`, `PharmaciesPagination.tsx` y `pharmacies.ts`. Cambios add-only, sin tocar infraestructura existente.

## Dependencies

- `src/lib/services/expenses.ts` como referencia de patrón
- `TTLCache` de `src/lib/ttl-cache.ts`
- Modelos: `Pharmacy`, `SupplyRequest`, `Expense`, `User`

## Success Criteria

- [ ] `page.tsx` sin `'use client'`, metadata dinámica funcionando
- [ ] Server Component pasa datos sin HTTP call inicial
- [ ] Search/filtros/sort/paginación funcionan vía AJAX
- [ ] Mismos empty states y role-based filtering que hoy
- [ ] Sin regresión visual en toolbar ni paginación
