# Tasks: Edición de Gastos (ExpenseEdit)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~200-280 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Edit Route

- [ ] 1.1 Create `src/app/dashboard/gastos/[id]/editar/page.tsx` — fetch expense by ID, render `<ExpenseForm expense={expense} />`, handle 403/404 errors

## Phase 2: Fix ExpenseForm onSubmit

- [ ] 2.1 In `ExpenseForm.onSubmit`: detect `isEditMode`, build PATCH URL `/api/expenses/${expense._id}`, change method to `PATCH`, send same body
- [ ] 2.2 Skip file re-upload for existing invoice fields in edit mode (only upload if user changes files)

## Phase 3: Edit Button in List

- [ ] 3.1 In `gastos/page.tsx`: add "Editar" `<Link>` column per row, shown only when `g.status` is `PENDIENTE_DE_FACTURAR` or `FACTURADO`

## Phase 4: Tests

- [ ] 4.1 Test: `ExpenseForm` calls PATCH when submitted with `expense` prop (mock fetch, assert URL and method)
- [ ] 4.2 Test: Edit page shows expense data in form fields when `expense` prop is provided
- [ ] 4.3 Test: `page.test.tsx` — edit button present for `PENDIENTE_DE_FACTURAR` and `FACTURADO`, absent for other statuses

## Phase 5: Verify

- [ ] 5.1 Run `npm test` — all existing + new tests pass
- [ ] 5.2 Run `npm run build` — no type/build errors
