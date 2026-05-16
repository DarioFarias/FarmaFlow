# Tasks: server-client-split-usuarios

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1,250 (+950 / -300) |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR (size:exception) |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

**Why single PR fits**: Mismo patrón probado en farmacias pero más pequeño — 0% lógica nueva, pura extracción y reorganización. Maintainer ya aceptó size:exception.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Shared service getFilteredUsers | Single | ~100 add + tests ~200 add |
| 2 | Presentational components | Same PR | ~120 add + tests ~200 add |
| 3 | Client brain + page rewrite | Same PR | ~250 add + ~293 del |
| 4 | Client integration tests | Same PR | ~300 add |

## Phase 1: Foundation — Shared Service

- [x] 1.1 Create `src/lib/services/users.ts` — RED: `src/lib/services/__tests__/users.test.ts` first covering search `$regex` via `$or`, role-based filtering (ADMIN/SUPERVISOR), empty `assignedPharmacies`, pagination `skip/limit`; GREEN: `getFilteredUsers(params)`, `buildUserFilter()`, `GetUsersParams`/`GetUsersResult`, `connectDB()`, `User.find().lean()` query replicating API route logic.

## Phase 2: Presentational Components

- [x] 2.1 Create `src/app/dashboard/admin/usuarios/UsersToolbar.tsx` — RED: `__tests__/UsersToolbar.test.tsx` first covering search input render, `onSearchChange` callback, loading disabled, clear button; GREEN: search input + "Nuevo Usuario" button, props `{ search, isLoading, onSearchChange, onCreateClick }`.

- [x] 2.2 Create `src/app/dashboard/admin/usuarios/UsersPagination.tsx` — RED: `__tests__/UsersPagination.test.tsx` first covering page info render, prev/next buttons, disabled states, `onPageChange` calls, hidden on single page; GREEN: prev/next + "Página X de Y", props `{ page, totalPages, isLoading, onPageChange }`.

## Phase 3: Core Split — Client Brain + Server Page

- [x] 3.1 Create `src/app/dashboard/admin/usuarios/UsuariosListClient.tsx` — RED: `__tests__/UsuariosListClient.test.tsx` first covering initial render no-ajax, search debounce 300ms, pagination prev/next via AJAX, modal open/close, `onSuccess` refresh; GREEN: `'use client'`, state from props, debounce with `useRef` timer, `fetchUsers(overrides?)` AJAX a `/api/admin/users`, render `UsersToolbar` + `UserTable` + `UsersPagination` + modals (`CreateUserModal`, `EditUserModal`, `PasswordModal`, `DeleteUserModal`). Acepta props: `initialData`, `initialPagination`, `pharmacies`, `currentUserId`, `currentUserRole`, `assignedPharmacies`, `creatableRoles`.

- [x] 3.2 Rewrite `src/app/dashboard/admin/usuarios/page.tsx` — Server Component: remove `'use client'`, export `generateMetadata()`, `getServerSession(authOptions)`, parse `searchParams` para page/search, fetch pharmacies via `Pharmacy.find()`, call `getFilteredUsers()`, pasa props a `<UsuariosListClient>`. Sin sesión: retorna "No autorizado".

## Phase 4: Verify

- [x] 4.1 Run `npm test` — confirm all existing + new tests pass.
- [x] 4.2 Run `npm run build` — confirm type-check and build pass with zero errors.
