# Proposal: Unify batch expense API routes

## Intent

Eliminate ~200 lines of duplicate boilerplate across 3 batch routes, fix the period bug in batch-report (frontend never sends it), standardize inconsistent response shapes, and clean up obsolete tests.

## Scope

### In Scope
- New `POST /api/expenses/batch` with `{ action, expenseIds, period?, notes? }`
- Old routes become thin redirects (backward compat preserved)
- Unify validation into `batchActionSchema` in `validations.ts`
- Standardize response: `{ processed, failed, total, results }` for all 3 actions
- Fix `BatchActionToolbar`: send `period` for report, target new endpoint
- Remove obsolete colocated tests (batch-approve.test.ts, batch-report.test.ts)
- Update valid V2 tests for new route + response shape
- Update Expenses spec: replace "shared helper" requirement with "unified endpoint"

### Out of Scope
- Adding new batch actions (e.g. "pay") — deferred
- Refactoring `[id]/route.ts` action dispatch
- Non-batch expense route changes

## Capabilities

### New Capabilities
- `batch-action`: Unified POST endpoint for approve/report/return with `{ action, expenseIds, period?, notes? }`. Single auth/validation surface, consistent response, state-machine-enforced transitions.

### Modified Capabilities
- `Expenses`: Replace "batch-approve/batch-report MUST use shared helper" with "batch operations MUST use unified endpoint"
- `Expense-Review`: No spec-level changes

## Approach

1. Create `src/app/api/expenses/batch/route.ts` — dispatches by `body.action` (`'approve' | 'report' | 'return'`), mirroring `[id]/route.ts` pattern
2. Each old route becomes a thin wrapper calling the new handler
3. Add `batchActionSchema` to `validations.ts`: `{ action: z.enum(['approve','report','return']), expenseIds, period?, notes? }`
4. Standardize response: all actions return `{ processed, failed, total, results }`
5. Update `BatchActionToolbar.tsx` — new URL, add `period` when action is 'report'
6. Delete obsolete colocated tests; update V2 tests
7. Remove outdated "shared helper" requirement from Expenses spec

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Frontend period bug (confirmed) | High | Fix in scope — must send period for report |
| Old routes called externally | Low | Keep as thin wrappers |
| Response shape breaks callers | Low | Only frontend reads responses |
| Obsolete tests mask failures | High | Delete them |

## Rollback Plan

1. Revert `BatchActionToolbar.tsx` to old endpoint URLs
2. Restore the 3 old route files (they still exist as redirects)
3. Delete `src/app/api/expenses/batch/route.ts`
4. Revert `validations.ts` to separate schemas
5. Restore deleted test files from git

## Dependencies

None — self-contained API refactor.

## Success Criteria

- [ ] `POST /api/expenses/batch` handles approve/report/return correctly
- [ ] Old routes still work via redirect (backward compat)
- [ ] `BatchActionToolbar` sends `period` for report action
- [ ] All V2 tests pass; obsolete colocated tests removed
- [ ] Response shape identical `{ processed, failed, total, results }` for all 3 actions
