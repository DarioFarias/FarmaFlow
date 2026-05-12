# Design: Edición de Gastos (ExpenseEdit)

## Technical Approach

Wire the existing edit-mode UI in `ExpenseForm` to call PATCH, add an edit route page, and surface an edit button per row. Zero backend changes — the PATCH endpoint already handles ownership, status transitions, and `wasModified`.

## Architecture Decisions

### Decision: Server component for edit page, client form inside

| Option | Tradeoff |
|--------|----------|
| Full client page | Simpler but loses Next.js data fetching patterns |
| Server component fetching expense | Follows existing `nuevo/page.tsx` pattern, clean separation |

**Choice**: Server component page fetches expense via server-side fetch (if possible) or client fetch. Follow the same pattern as `nuevo/page.tsx` — the page is a thin wrapper, `ExpenseForm` is the client component.
**Rationale**: Consistency with existing architecture. The form is already `'use client'`.

### Decision: Edit button as `<Link>` (no new state)

| Option | Tradeoff |
|--------|----------|
| `<Link>` to edit route | Simple, no state management, follows existing "Nuevo Gasto" pattern |
| Inline edit in table | Requires complex state lifting, breaks pagination |

**Choice**: `<Link href="/dashboard/gastos/{id}/editar">`.
**Rationale**: Keeps the list page simple. Navigation is a hard requirement (user needs the full form).

## Data Flow

```
[Gastos List Page]                    [Edit Page]
    │                                       │
    │  Click "Editar"                       │
    │  ──────────────────────────────────►   │
    │                                       │
    │                             GET /api/expenses/[id]
    │                                   │
    │                              ┌─────┴──────┐
    │                              │  Backend    │
    │                              │  - Fetch    │
    │                              │  - Owner    │
    │                              │    check    │
    │                              │  - Return   │
    │                              │  expense    │
    │                              └─────┬──────┘
    │                              │
    │                    Render ExpenseForm(expense)
    │                                       │
    │                           User edits + submits
    │                                       │
    │                             PATCH /api/expenses/[id]
    │                                   │
    │                              ┌─────┴──────┐
    │                              │  Backend    │
    │                              │  - Validate │
    │                              │  - Reset    │
    │                              │    status   │
    │                              │  - Return   │
    │                              │    updated  │
    │                              └─────┬──────┘
    │                                       │
    │  Redirect to /dashboard/gastos ◄─────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/dashboard/gastos/[id]/editar/page.tsx` | Create | Server page that renders `<ExpenseForm expense={...} />` |
| `src/app/dashboard/gastos/ExpenseForm.tsx` | Modify | Change `onSubmit` to call PATCH when `isEditMode` |
| `src/app/dashboard/gastos/page.tsx` | Modify | Add "Editar" Link per row (visible for editable states) |
| `src/app/dashboard/gastos/__tests__/ExpenseForm.test.tsx` | Modify | Add tests: PATCH called in edit mode |
| `src/app/dashboard/gastos/__tests__/page.test.tsx` | Modify | Add tests: edit button visibility per status |

## Interfaces / Contracts

No new interfaces. The existing `ExpenseFormProps` already has `expense?: IExpense`.

`onSubmit` change:
```
// Before (always POST):
fetch('/api/expenses', { method: 'POST', body: ... })

// After (POST when new, PATCH when edit):
const url = isEditMode ? `/api/expenses/${expense._id}` : '/api/expenses'
fetch(url, { method: isEditMode ? 'PATCH' : 'POST', body: ... })
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | ExpenseForm submits PATCH in edit mode | Mock fetch, render with `expense` prop, submit, assert `PATCH` URL |
| Unit | Edit button visibility per status | Render list with mock expenses of different statuses, check for "Editar" link |
| Unit | Non-owner 403 on edit page | Mock fetch returning 403, assert error message renders |

## Migration / Rollout

No migration required. New route + edit button are purely additive.

## Open Questions

- None
