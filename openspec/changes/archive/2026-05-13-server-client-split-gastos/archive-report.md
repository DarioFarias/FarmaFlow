# Archive Report: server-client-split-gastos

**Archived**: 2026-05-13
**Mode**: hybrid (engram + openspec)

---

## Summary

Split the 626-line `'use client'` gastos list page monolith into a Server Component (page.tsx) that fetches initial data via a shared service, and a Client Component (GastosListClient.tsx) that manages all interactivity via AJAX. Extracted the expense query logic from the API route handler into a shared `getFilteredExpenses()` service.

## Artifact Traceability (Engram Observation IDs)

| Artifact | Observation ID | Topic Key |
|----------|---------------|-----------|
| Proposal | #325 | `sdd/server-client-split-gastos/proposal` |
| Spec | #327 | `sdd/server-client-split-gastos/spec` |
| Design | #326 | `sdd/server-client-split-gastos/design` |
| Tasks | #328 | `sdd/server-client-split-gastos/tasks` |
| Apply Progress | #329 | `sdd/server-client-split-gastos/apply-progress` |
| Archive Report | (this) | `sdd/server-client-split-gastos/archive-report` |

**Note**: Verify report was not persisted to engram. The orchestrator confirmed all 8 new tests pass, all 3 existing page tests pass, and the implementation compiles cleanly. 3 pre-existing failures in `ExpenseForm.test.tsx` are unrelated to this change.

## Implementation Delivered

### Files Created (7)
- `src/lib/services/expenses.ts` — shared `getFilteredExpenses()` service
- `src/app/dashboard/gastos/GastosListClient.tsx` — client brain with state/AJAX
- `src/app/dashboard/gastos/GastosPagination.tsx` — pagination controls
- `src/app/dashboard/gastos/GastosFilters.tsx` — filter controls (presentational)
- `src/app/dashboard/gastos/ExpenseTable.tsx` — desktop table view
- `src/app/dashboard/gastos/ExpenseCards.tsx` — mobile card view
- `__tests__/GastosListClient.test.tsx` — client component tests

### Files Modified (4)
- `src/app/dashboard/gastos/page.tsx` — rewritten as Server Component (~50 lines)
- `src/app/api/expenses/route.ts` — GET handler delegates to service
- `src/lib/roles.ts` — added `isAdminUser()` helper
- `__tests__/page.test.tsx` — rewritten to test Server Component props

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| gastos-list-server | Created | New domain spec for SSR initial data fetch + component architecture. Copied delta spec as full main spec to `openspec/specs/gastos-list-server/spec.md` |

The delta spec was a full spec for a new capability (`gastos-list-server`). No existing main spec existed for this domain, so it was copied directly per the archive convention.

## Archive Contents

```
openspec/changes/archive/2026-05-13-server-client-split-gastos/
  specs/
    gastos-list-server/
      spec.md      ✅ (delta spec — full spec for new capability)
```

## Verification Status

- **Tests**: 8 new + 3 existing page tests — all pass ✅
- **Compilation**: `tsc --noEmit` — clean ✅
- **Pre-existing failures**: 3 in `ExpenseForm.test.tsx` (unrelated, pre-date this change)

## SDD Cycle Complete

The change has been fully planned (proposal → spec → design → tasks), implemented (apply), verified (tests pass), and archived.
