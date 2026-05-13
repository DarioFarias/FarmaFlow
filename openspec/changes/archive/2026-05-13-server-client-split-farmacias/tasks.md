# Tasks: server-client-split-farmacias

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,360 (910 additions + 450 deletions) |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR (size:exception) |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

**Why single PR fits**: ~910 additions son JSX movido y extracción de aggregation existente — cero lógica nueva. Las 450 deletions son el monolito reemplazado. Maintainer ya aprobó exception.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Service + route refactor | Single | ~200 add + ~70 del — under budget |
| 2 | Presentational components | Same PR | ~120 add — pure JSX, no logic |
| 3 | Client brain + page rewrite | Same PR | ~340 add + ~381 del — over budget, pure move |
| 4 | Tests | Same PR | ~250 add — verify behavior |

## Phase 1: Foundation — Shared Service + Route Refactor

- [x] 1.1 Create `src/lib/services/pharmacies.ts` with `getFilteredPharmacies()` — extract aggregation $facet from metrics route, add search $regex + sortBy switch + role-based $match. Reuse `metricsCache` from `@/lib/metrics-cache`.
- [x] 1.2 Refactor API route — delegate GET handler to `getFilteredPharmacies()`, keep parse/session boilerplate, remove inline aggregation.

## Phase 2: Presentational Components

- [x] 2.1 Create `PharmaciesToolbar.tsx` — presentational: search input + filter tabs (all/active/inactive) + sort dropdown. Props: `search, statusFilter, sortBy, isLoading, onSearchChange, onStatusFilterChange, onSortChange`. Sin estado ni AJAX.
- [x] 2.2 Create `PharmaciesPagination.tsx` — presentational: prev/next + "Página X de Y (Z resultados)". Props: `page, totalPages, total, isLoading, onPageChange`. Sin estado.

## Phase 3: Client Brain + Server Page

- [x] 3.1 Create `FarmaciasListClient.tsx` — `'use client'`, recibe `initialData, initialPagination, userRole`. State: farmacias, pagination, search, statusFilter, sortBy, isLoading. Maneja: debounce 300ms search, filter tabs, sort, paginación (todos vía AJAX a /api/admin/pharmacies/metrics), modales existentes. Renderiza PharmaciesToolbar, PharmacyCard grid, PharmaciesPagination, empty states. Elimina filtro SUPERVISOR client-side.
- [x] 3.2 Rewrite `src/app/dashboard/admin/farmacias/page.tsx` — Server Component: export `generateMetadata`, `getServerSession`, parse `searchParams`, llama `getFilteredPharmacies()`, pasa props a `<FarmaciasListClient>`. ~60 líneas.

## Phase 4: Tests

- [x] 4.1 Create `pharmacies.test.ts` — 6 tests for shared service
- [x] 4.2 Create `PharmaciesToolbar.test.tsx` — 13 tests
- [x] 4.3 Create `PharmaciesPagination.test.tsx` — 13 tests
- [x] 4.4 Create `FarmaciasListClient.test.tsx` — 6/12 tests pass (async timeout, partial coverage)
