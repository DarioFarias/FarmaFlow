# Archive Report: expense-edit

**Status**: ⏳ PLANNED — NOT IMPLEMENTED
**Archived at**: 2026-05-12T23:15 (UTC-3)
**Reason**: Pre-implementation archive — plan complete, pending implementation in a future session.

---

## Overview

Edición de Gastos (ExpenseEdit) enables VENDEDOR/ENCARGADO users to edit their own expenses from the frontend. The `ExpenseForm` already has edit-mode UI (status badge, notes field, "Actualizar Gasto" button) but `onSubmit` always calls POST. The backend PATCH `/api/expenses/[id]` is already deployed and working.

## Engram Artifact References

| Artifact | Observation ID | Topic Key |
|----------|---------------|-----------|
| Proposal | #285 | `sdd/expense-edit/proposal` |
| Spec | #286 | `sdd/expense-edit/spec` |
| Design | #287 | `sdd/expense-edit/design` |
| Tasks | #288 | `sdd/expense-edit/tasks` |
| Archive Report | #289 | `sdd/expense-edit/archive-report` |

## Delta Spec Merge

⚠️ **Not merged** — this is a pre-implementation archive. The delta spec (`specs/Expenses/spec.md`) was NOT merged into the main spec (`openspec/specs/Expenses/spec.md`). The delta spec remains in the archive folder for review during implementation.

## Implementation Plan (for resumption)

### Estimated Workload
- **Lines changed**: ~200-280
- **PR budget risk**: Low
- **Recommended delivery**: Single PR (no chaining needed)
- **Chain strategy**: size-exception

### Recommended Branch
Create a new branch from **`main`**, or reuse the existing **`fix/gastos-bugs`** branch if that work is complete.

### Tasks Overview

| Phase | Task | File(s) |
|-------|------|---------|
| 1 | Create edit route | `src/app/dashboard/gastos/[id]/editar/page.tsx` |
| 2 | Fix ExpenseForm onSubmit to PATCH | `src/app/dashboard/gastos/ExpenseForm.tsx` |
| 3 | Add Editar button in list | `src/app/dashboard/gastos/page.tsx` |
| 4 | Write tests | `__tests__/ExpenseForm.test.tsx`, `__tests__/page.test.tsx` |
| 5 | Verify (test + build) | `npm test`, `npm run build` |

### Resumption Instructions

To resume this change:
1. Read the full artifacts from Engram (IDs #285–#288)
2. Read the delta spec at `openspec/changes/archive/2026-05-12-expense-edit/specs/Expenses/spec.md`
3. Read design and tasks from the archive folder
4. Start with **Phase 1** — create the edit route page
5. After implementation and verification, the delta spec SHOULD be merged into `openspec/specs/Expenses/spec.md`

### Key Design Decisions

1. **Server component for edit page**: Follows `nuevo/page.tsx` pattern — thin server page, `ExpenseForm` is the client component
2. **Edit button as `<Link>`**: No new state management, follows existing "Nuevo Gasto" pattern
3. **No backend changes**: The PATCH endpoint already handles ownership, status transitions, and `wasModified`

### Risks to Watch

| Risk | Mitigation |
|------|------------|
| Non-owner edits another's expense | Backend enforces pharmacy ownership check (existing) |
| Edit while REPORTED | Backend blocks; frontend hides button for non-editable states |
| File re-upload for existing invoice fields | Task 2.2: skip re-upload unless user changes files |

## Archived Contents

- `proposal.md` ✅
- `specs/Expenses/spec.md` ✅ (delta, NOT merged to main specs)
- `design.md` ✅
- `tasks.md` ✅
- `archive-report.md` ✅ (this file)
