# Tasks: Unify Batch Expense Routes

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~310 (165 added + 145 deleted) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Types + validation + unified handler + thin wrappers | Single PR | Self-contained; tests included |
| 2 | Frontend + test cleanup | Same PR | Depends on unit 1, included in same PR |

## Phase 1: Foundation — Types + Validation

- [ ] 1.1 Add `BatchResultItem` and `BatchResult` interfaces to `src/types/index.ts` after `ApiResponse`
- [ ] 1.2 Add `batchActionSchema` (Zod discriminated union on `action`) to `src/lib/validations.ts` replacing separate `batchIdsSchema`/`batchReportSchema`

## Phase 2: Unified Route + Handler

- [ ] 2.1 Create `src/app/api/expenses/batch/route.ts` with `requireAdmin()` helper, `handleApprove()`, `handleReport()` (atomic), `handleReturn()` (per-item), and `POST` handler dispatching by `body.action`
- [ ] 2.2 Rewrite `src/app/api/expenses/batch-approve/route.ts` as thin wrapper: `import { POST } from '../batch/route'; export { POST }` — 1 re-export, no try/catch
- [ ] 2.3 Rewrite `src/app/api/expenses/batch-report/route.ts` as thin wrapper (same pattern)
- [ ] 2.4 Rewrite `src/app/api/expenses/batch-return/route.ts` as thin wrapper (same pattern)

## Phase 3: Frontend

- [ ] 3.1 Update `src/components/gastos/BatchActionToolbar.tsx`: single endpoint `/api/expenses/batch`, add `action` field to body, send `period` when `currentAction === 'report'`

## Phase 4: Tests

- [ ] 4.1 Delete `src/app/api/expenses/batch-approve/batch-approve.test.ts` and `src/app/api/expenses/batch-report/batch-report.test.ts`
- [ ] 4.2 Update `src/tests/expense-v2-batch-approve.test.ts`: import from `@/app/api/expenses/batch/route`, add `action: 'approve'` to request body
- [ ] 4.3 Update `src/tests/expense-v2-batch-report.test.ts`: import from unified route, add `action: 'report'` + `period` to body
- [ ] 4.4 Update `src/tests/expense-v2-batch-return.test.ts`: import from unified route, add `action: 'return'` to body
- [ ] 4.5 Update `src/tests/batch-action-toolbar.test.tsx` to assert new endpoint URL `/api/expenses/batch`

## Phase 5: Verify

- [ ] 5.1 Run full test suite (`npm test` or equivalent)
- [ ] 5.2 Run `npm run build` — confirm zero TS errors and no type regressions
