# Tasks: fix-gastos-bugs

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 300–500 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

## Phase 1: Foundation — Auth Core

- [ ] 1.1 **TDD RED**: Add test asserting `isAdmin(SUPERVISOR) === true` in `roles.test.ts`; fix mock in `auth.test.ts` to match prod
- [ ] 1.2 **GREEN**: Add `SUPERVISOR` to `isAdmin()` in `src/lib/roles.ts`; delegate `hasPharmacyAccess()` to `isAdmin()`

## Phase 2: Ownership & Filters

- [ ] 2.1 **TDD RED**: Write test: GET /api/expenses filters by pharmacy for VENDEDOR/ENCARGADO
- [ ] 2.2 **GREEN**: Force `query.pharmacy` for non-admin in route; reject `pharmacyId` query param for non-admin
- [ ] 2.3 **GREEN**: Intersect SUPERVISOR's `pharmacyId` param with `assignedPharmacies` in `buildExpenseFilter()`
- [ ] 2.4 **TDD RED**: Write test: GET /api/expenses/[id] returns 200 for owner, 403 for non-owner
- [ ] 2.5 **GREEN**: Fix comparison — use `assignedPharmacies.includes(expense.pharmacy)` not `user._id`
- [ ] 2.6 **GREEN**: Add ownership check in PATCH /api/expenses/[id] for non-admin (403 if not owner)

## Phase 3: Validation & Schema

- [ ] 3.1 **TDD RED**: Write test: date filter accepts `YYYY-MM-DD` (rejects non-date strings)
- [ ] 3.2 **GREEN**: Replace `z.string().datetime()` with `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` in validations.ts
- [ ] 3.3 **TDD RED**: Write test: `wasModified` field works without Mongoose `isModified()` conflict
- [ ] 3.4 **GREEN**: Rename `isModified` → `wasModified` in Expense schema, `IExpense`/`IExpenseResponseV2` types, and route

## Phase 4: Batch Ops & Cleanup

- [ ] 4.1 **TDD RED**: Write test: batch-approve rejects FACTURADO→REPORTED (only PENDIENTE→FACTURADO)
- [ ] 4.2 **GREEN**: Create `src/lib/expense-batch.ts` with `processBatchStatusTransitions()`; fix batch-approve transitions
- [ ] 4.3 **TDD RED**: Write test: expenseNumber uses `receiptDate` year, not current year
- [ ] 4.4 **GREEN**: Fix `pre('save')` hook — derive year from `this.receiptDate`

## Phase 5: Tests & Polish

- [ ] 5.1 Fix `patch-status` test mock to reflect real `isAdmin()` (align with Bug #3 change)
- [ ] 5.2 Update batch tests to verify auth/ownership with correct mocks
- [ ] 5.3 Run full test suite; confirm all 11 bugs fixed per spec scenarios
