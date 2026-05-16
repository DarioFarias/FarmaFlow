# Archive Report: unify-batch-expense-routes

**Archived**: 2026-05-16
**Source**: openspec/changes/unify-batch-expense-routes/
**Destination**: openspec/changes/archive/2026-05-16-unify-batch-expense-routes/

## Summary

Unified 3 duplicate batch expense routes (batch-approve, batch-report, batch-return) into a single `POST /api/expenses/batch` with action dispatch. Old routes preserved as thin wrappers for backward compatibility. Fixed frontend period bug in BatchActionToolbar.

## Status

| Phase | Status |
|-------|--------|
| Proposal | Complete |
| Spec | Complete (2 domains: batch-action new, Expenses modified) |
| Design | Complete |
| Tasks | Complete (11/11) |
| Apply | Complete |
| Verify | Complete (build success, 10 batch tests passing) |
| Archive | ✅ Done |

## Engram Artifact References

| Artifact | Observation ID | Topic Key |
|----------|---------------|-----------|
| Proposal | #357 | sdd/unify-batch-expense-routes/proposal |
| Spec | #358 | sdd/unify-batch-expense-routes/spec |
| Design | #359 | sdd/unify-batch-expense-routes/design |
| Tasks | #360 | sdd/unify-batch-expense-routes/tasks |
| Apply Progress | #361 | sdd/unify-batch-expense-routes/apply-progress |

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| batch-action | Already exists (new full spec) | 8 requirements (R1-R8), already present at `openspec/specs/batch-action/spec.md` |
| Expenses | Modified | Replaced 2 old requirements ("shared helper" + "naming semantics") with 1 new unified requirement "Operaciones batch DEBEN usar endpoint unificado" + 3 scenarios |

## Archive Contents

- proposal.md ✅
- specs/Expenses/spec.md ✅ (delta)
- design.md ✅
- tasks.md ✅ (11/11 tasks complete)

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived. Ready for the next change.

## Merge Details

### Expenses Spec Changes
- **REMOVED**: `Requirement: batch-approve and batch-report MUST use shared helper` (old approach — separate routes with shared helper)
- **REMOVED**: `Requirement: batch-return naming MUST match action semantics` (no longer needed — single unified endpoint)
- **ADDED**: `Requirement: Operaciones batch DEBEN usar endpoint unificado` — all batch operations go through `POST /api/expenses/batch`; old routes are thin wrappers

### batch-action Spec
- Already exists as a complete full spec — no merge needed. Covers all 8 requirements from the delta spec.
