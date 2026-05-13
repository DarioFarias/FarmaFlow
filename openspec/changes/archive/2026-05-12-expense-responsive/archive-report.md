# Archive Report: expense-responsive

**Archived**: 2026-05-12
**Status**: ✅ Archived

## Summary

Hacer responsive el módulo de gastos para mobile (360px+). La tabla de gastos era ilegible a partir de ~900px, el BatchActionToolbar desbordaba en <360px, los uploads ocupaban espacio excesivo, y los filtros no colapsaban. Todo esto hacía imposible usar el módulo desde un celular.

Cambios puramente de presentación (CSS + JSX condicional) en 4 componentes, sin tocar lógica de negocio ni API.

## Engram Artifact IDs

| Artifact | Observation ID | Topic Key |
|----------|---------------|-----------|
| Proposal | #312 | `sdd/expense-responsive/proposal` |
| Spec | #314 | `sdd/expense-responsive/spec` |
| Design | #315 | `sdd/expense-responsive/design` |
| Tasks | #316 | `sdd/expense-responsive/tasks` |
| Apply Progress | #317 | `sdd/expense-responsive/apply-progress` |
| Verify Report | N/A (verify was implicit — no separate verify report created) | — |
| Archive Report | #318 (this) | `sdd/expense-responsive/archive-report` |

## Files Modified

| File | Action | Description |
|------|--------|-------------|
| `src/app/dashboard/gastos/page.tsx` | Modified | +cards section (block md:hidden), +filters toggle (showFilters state), +responsive containers (hidden md:block for table) |
| `src/components/gastos/BatchActionToolbar.tsx` | Modified | w-[calc(100vw-2rem)] max-w-lg, p-3 md:p-4, gap-2 md:gap-4, truncate labels, flex-1 button |
| `src/app/dashboard/gastos/ExpenseForm.tsx` | Modified | aspect-[3/4] → aspect-video md:aspect-[3/4] |
| `src/app/dashboard/gastos/__tests__/page.test.tsx` | Rewritten | Mock fetch() + useSession instead of non-existent useExpenses hook |

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| Presentation | Added to main spec | 5 new requirements + 12 scenarios appended to `openspec/specs/Expenses/spec.md` |

### Requirements Added to Main Spec

1. **Responsive List — Cards in mobile, table in desktop** — Dual-render with `hidden md:block` (table) and `block md:hidden` (cards)
2. **Responsive Filters — Collapsible on mobile** — useState toggle with ChevronUp/Down icons
3. **Responsive BatchActionToolbar — No horizontal overflow** — Viewport-constrained container with truncation
4. **Responsive Upload Area — Variable aspect-ratio** — `aspect-video md:aspect-[3/4]`
5. **Correct Test Mock Dependencies** — Mock fetch() + useSession, not useExpenses

## Test Execution Results

```
✓ Tests:  11 passed (11)
✓ File:   1 passed (1)
```

| Test | Status | Notes |
|------|--------|-------|
| Loading state (spinner) | ✅ | Spinner visible at mount |
| Render list (expenses load) | ✅ | expenseNumber, description, amount rendered |
| Status badge | ✅ | Badge visible per expense |
| Admin columns (pharmacy) | ✅ | Pharmacy column for admin role |
| AuditActions for admin | ✅ | Rendered for admin users |
| Empty state | ✅ | "No hay gastos registrados" shown |
| Edit button for PENDIENTE_DE_FACTURAR | ✅ | Link visible for editable status |
| No edit button for PAID | ✅ | Link hidden for non-editable status |
| Pagination controls | ✅ | Visible when data present |
| Filters section visible (desktop) | ✅ | Visible by default, no toggle on desktop |
| Filters toggle (mobile) | ✅ | Click "Filtros" toggles visibility |

## Architecture Decisions

1. **Dual-render (table + cards)** instead of `block md:table-row` approach — avoids CSS table display bugs on mobile. Table desktop wrapped in `hidden md:block`. Cards in `block md:hidden`. Same state (selectedIds, toggleSelectOne, handlers) shared between both views.

2. **useState for collapsible filters** instead of CSS peer/checkbox or HTML details/summary — consistent with existing component state pattern, maintains filter values when toggling.

3. **Rewrite test file from scratch** instead of patching — the original mock used `useExpenses` which the page hasn't imported for several iterations. New tests mock `fetch()` and `useSession()` directly.

## Implementation Details

- **Cards view**: Each card has checkbox header (expenseNumber + status badge), detail grid (fecha, monto, sucursal for admin, descripción), and actions footer (Editar link for PENDIENTE_DE_FACTURAR + AuditActions for admin)
- **BatchActionToolbar**: Container uses `calc(100vw-2rem)` to prevent overflow, responsive padding (p-3 mobile, p-4 desktop), responsive gap (gap-2 mobile, gap-4 desktop), action button full-width on mobile with truncation
- **Upload area**: Aspect ratio changes from 3:4 (portrait) to 16:9 (video) on mobile, reducing height to <50% viewport
- **Filters**: Toggle button visible only on mobile (`md:hidden`), filters wrapping div uses `showFilters ? 'flex' : 'hidden'` combined with `md:flex` to always show on desktop

## Verification

- ✅ Tests pass: 11/11 (vitest run)
- ✅ Dual-render: table hidden on mobile, cards visible
- ✅ Dual-render: cards hidden on desktop, table visible
- ✅ Filters toggle works on mobile, no toggle on desktop
- ✅ BatchActionToolbar constrained to viewport width
- ✅ Action labels truncated on overflow
- ✅ Upload area uses aspect-video on mobile, aspect-[3/4] on desktop
- ✅ Tests mock fetch() + useSession(), not useExpenses

## Archive Contents

```
openspec/changes/archive/2026-05-12-expense-responsive/
├── archive-report.md     (this file)
├── proposal.md            — scope, approach, risks
├── design.md              — technical approach, architecture decisions
├── tasks.md               — task breakdown (5 tasks)
└── specs/
    └── Expenses/
        └── spec.md        — delta spec (5 added requirements)
```

## Source of Truth Updated

- `openspec/specs/Expenses/spec.md` — Presentation Domain section added with 5 responsive requirements

## Final State

✅ **Archived** — SDD cycle complete. 5/5 tasks implemented and verified.
