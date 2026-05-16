# Design: server-client-split-usuarios

## Technical Approach

Split the 293-line `'use client'` monolith in `src/app/dashboard/admin/usuarios/page.tsx` into a Server Component page + Client Component following the identical pattern proven in `server-client-split-farmacias`. Extract a shared service (`getFilteredUsers`) that replicates the API route's role-based and `$regex` query logic server-side, and presentational subcomponents (`UsersToolbar`, `UsersPagination`) for search and pagination controls.

## Architecture Decisions

### Decision: Shared service replicates API route query logic

| Option | Tradeoff |
|--------|----------|
| Extract from API route into shared service | Single source of truth for query building; Server Component and API route share the same logic |
| Keep logic duplicated in service | Less refactor surface but maintenance burden |
| Make API route call the service | Chosen pattern (farmacias), API route stays independent |

**Choice**: Extract `query-building helpers` (`buildUserQuery`, `getAllowedRoleFilter`) into the service. API route is **out of scope** — no changes to it. The service is used exclusively by the Server Component for initial SSR data.

### Decision: `getFilteredUsers` as named-params object (not positional)

**Rationale**: The farmacias service uses positional params (`search, active, sortBy, page, pageSize, userRole, assignedPharmacies`). Users needs 6 params — a named-params interface is cleaner than 6+ positional args and matches the existing `PharmacyFilterParams` pattern establisheed in `expenses.ts`.

### Decision: No changes to modals or UserTable

**Rationale**: The 4 modal components (`CreateUserModal`, `EditUserModal`, `PasswordModal`, `DeleteUserModal`) and `UserTable` are already extracted and imported — they receive props and callbacks. They are `'use client'` and stay that way. Only the `onSuccess` callback changes from `fetchUsers` (local function) to a prop from `<UsuariosListClient>`.

## Data Flow

```
Browser                          Server                          DB
  │                                │                              │
  │  GET /dashboard/admin/usuarios │                              │
  │ ──────────────────────────────►│                              │
  │                                │  getServerSession()          │
  │                                │  getFilteredUsers(...)       │
  │                                │  ───────────────────────────►│
  │                                │  ◄─── { data, total, ... } ──│
  │                                │                              │
  │  ◄─── SSR: <UsuariosListClient │                              │
  │        initialData={data}      │                              │
  │        initialPagination={...} │                              │
  │        pharmacies={...}        │                              │
  │        currentUserId           │                              │
  │        currentUserRole         │                              │
  │                                │                              │
  │  [user types search]           │                              │
  │  ───300ms debounce──►          │                              │
  │  GET /api/admin/users?search=X │                              │
  │  ──────────────────────────────►                              │
  │  ◄─── JSON response ───────────                               │
  │                                │                              │
  │  [clicks page 2]               │                              │
  │  GET /api/admin/users?page=2   │                              │
  │  ──────────────────────────────►                              │
  │  ◄─── JSON response ───────────                               │
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/services/users.ts` | **Create** | Shared service: `getFilteredUsers()`, `buildUserFilter()` helper |
| `src/lib/services/__tests__/users.test.ts` | **Create** | Tests for `getFilteredUsers` |
| `src/app/dashboard/admin/usuarios/page.tsx` | **Modify** | Remove `'use client'`, rewrite as Server Component |
| `src/app/dashboard/admin/usuarios/UsuariosListClient.tsx` | **Create** | Client Component: state, AJAX, modals |
| `src/app/dashboard/admin/usuarios/UsersToolbar.tsx` | **Create** | Search input + "Nuevo Usuario" button |
| `src/app/dashboard/admin/usuarios/UsersPagination.tsx` | **Create** | Prev/next + "Página X de Y" |

No changes to: modals (`CreateUserModal`, `EditUserModal`, `PasswordModal`, `DeleteUserModal`), `UserTable`, API routes, models, types.

## Interfaces / Contracts

### Shared service: `src/lib/services/users.ts`

```typescript
import { IUser } from '@/types'

export interface GetUsersParams {
  page?: number          // default: 1
  pageSize?: number      // default: 20
  search?: string
  userRole?: string      // role of requesting user (for filtering)
  assignedPharmacies?: string[] // for SUPERVISOR filtering
  currentUserId?: string  // exclude self from results (optional)
}

export interface GetUsersResult {
  data: IUser[]
  total: number
  page: number
  totalPages: number
}

export async function getFilteredUsers(
  params: GetUsersParams
): Promise<GetUsersResult>
```

### Server Component props interface (`page.tsx`)

```typescript
interface PageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}
```

### Client Component props (`UsuariosListClient.tsx`)

```typescript
interface UsuariosListClientProps {
  initialData: IUser[]
  initialPagination: {
    page: number
    totalPages: number
    total: number
  }
  pharmacies: IPharmacy[]
  currentUserId: string | undefined
  currentUserRole: string | undefined
}
```

### UsersToolbar props

```typescript
interface UsersToolbarProps {
  search: string
  isLoading: boolean
  onSearchChange: (value: string) => void
  onCreateClick: () => void
}
```

### UsersPagination props

```typescript
interface UsersPaginationProps {
  page: number
  totalPages: number
  isLoading: boolean
  onPageChange: (newPage: number) => void
}
```

## Key Implementation Details

### `getFilteredUsers()` query logic (replicating API route)

1. Call `connectDB()`
2. Build `allowedRoles` via `getCreatableRoles(userRole)` — restricted to roles the current user can manage
3. Build query:
   - If `search` provided: `{ $or: [ { name: $regex }, { username: $regex }, { email: $regex } ] }` (case-insensitive)
   - Role filter: `{ role: { $in: allowedRoles } }` — unless a specific role filter is in searchParams
   - SUPERVISOR: add `{ assignedPharmacies: { $in: session.user.assignedPharmacies } }`
4. `User.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize).select(userFields).lean()`
5. `User.countDocuments(query)` for total
6. Return `{ data, total, page, totalPages }`

### Server Component (`page.tsx`)

- Remove `'use client'`, remove all imports related to hooks/modals
- Export `generateMetadata()` with title/description
- `getServerSession(authOptions)` — handle `!session` with "No autorizado" div
- Parse `searchParams` for `page` and `search`
- Fetch `pharmacies` via `Pharmacy.find()` for modal dropdowns (FarmaciasListClient needs them)
- Call `getFilteredUsers()` with parsed params + session data
- Return `<UsuariosListClient>` passing all fetched data

### Client Component (`UsuariosListClient.tsx`)

- `'use client'`
- State initialized from props: `users = initialData`, `page = initialPagination.page`, `totalPages = initialPagination.totalPages`
- `search` state starts empty — user types to search
- Debounce 300ms via `useRef` timer (same pattern as farmacias)
- `fetchUsers(overrides?)` → `fetch('/api/admin/users?...')` with JSON response
- `onSearchChange`: reset page to 1, set debounce timer
- `onPageChange(newPage)`: update page + call `fetchUsers({ page: newPage })`
- Render: header (title + `<UsersToolbar>`) → table with `<UserTable>` → `<UsersPagination>` → modals (CreateUserModal, EditUserModal, PasswordModal, DeleteUserModal)
- Pass `fetchUsers` as `onSuccess` to modals (same as monolith)
- Pass `currentUserId`, `currentUserRole`, `creatableRoles`, `pharmacies` to modals

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `getFilteredUsers` query building | Test `buildUserFilter` helper with: basic search, SUPERVISOR role, empty assignedPharmacies, different roles |
| Unit | `getFilteredUsers` pagination | Test skip/limit calculation, totalPages edge cases (0 results, partial page) |
| Unit | `getFilteredUsers` role filtering | Test that ADMIN cannot see ADMIN-level users, SUPERVISOR filtering by assignedPharmacies |
| E2E | Full page load + search/paginate | Manual — covered by existing tests |

## Migration / Rollout

No migration required. The API route (`/api/admin/users`) stays unchanged — the Client Component uses it for AJAX search/pagination exactly as before. The Server Component uses the new shared service for initial SSR.

## Open Questions

None — the farmacias pattern is proven and this is a straightforward application of the same architecture.
