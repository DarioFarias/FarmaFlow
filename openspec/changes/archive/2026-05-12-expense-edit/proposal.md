# Proposal: Edición de Gastos (ExpenseEdit)

## Intent

VENDEDOR/ENCARGADO users currently can't edit expenses after creation. The `ExpenseForm` already has edit-mode UI (status badge, notes field, "Actualizar Gasto" button) but `onSubmit` always calls POST. The backend PATCH `/api/expenses/[id]` is ready. We need to wire the frontend: edit route, edit button in list, and PATCH call from form.

## Scope

### In Scope
- New route `gastos/[id]/editar/page.tsx` that fetches expense and renders `ExpenseForm` in edit mode
- Fix `ExpenseForm.onSubmit` to call `PATCH /api/expenses/[id]` when `isEditMode`
- "Editar" button per row in gastos list for editable states (`PENDIENTE_DE_FACTURAR`, `FACTURADO`)
- Backend status reset to `PENDIENTE_DE_FACTURAR` + `wasModified` flag on edit
- Tests for edit flow (happy path, blocked states, 403)

### Out of Scope
- Admin status-change UI (already works via AuditActions)
- Bulk edit
- Edit after `REPORTED` status (blocked by backend)

## Capabilities

### New Capabilities
- `ExpenseEdit`: End-to-end ability for pharmacy users to edit their own expenses in editable states

### Modified Capabilities
- None — existing `Expenses` spec already covers PATCH behavior; we're adding frontend wiring and new scenarios

## Approach

1. Create `gastos/[id]/editar/page.tsx` — fetch expense via `GET /api/expenses/[id]`, pass to `<ExpenseForm expense={...} />`
2. In `ExpenseForm.onSubmit`: detect `isEditMode`, change fetch to `PATCH /api/expenses/${expense._id}` with same body
3. In `gastos/page.tsx`: add "Editar" Link per row, visible only when `status` is `PENDIENTE_DE_FACTURAR` or `FACTURADO`
4. The backend already handles the edit — PATCH resets status to `PENDIENTE_DE_FACTURAR` and sets `wasModified` when invoice fields change while status is `FACTURADO`

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/dashboard/gastos/[id]/editar/page.tsx` | New | Edit route page |
| `src/app/dashboard/gastos/ExpenseForm.tsx` | Modify | Fix `onSubmit` to PATCH in edit mode |
| `src/app/dashboard/gastos/page.tsx` | Modify | Add "Editar" button per row |
| `src/app/dashboard/gastos/__tests__/ExpenseForm.test.tsx` | Modify | Add edit-flow tests |
| `src/app/dashboard/gastos/__tests__/page.test.tsx` | Modify | Add edit button tests |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Non-owner edits another's expense | Low | Backend enforces pharmacy ownership check |
| Edit while REPORTED | Low | Backend blocks, frontend hides button |

## Rollback Plan

Revert changes to `ExpenseForm.tsx`, `page.tsx`, delete the edit route page. The backend PATCH is unchanged and harmless.

## Dependencies

- Backend PATCH `/api/expenses/[id]` already deployed (bugs #2 and #8 fixed)

## Success Criteria

- [ ] VENDEDOR can navigate to edit page from any editable expense
- [ ] Submitting edit calls PATCH (not POST) and updates the expense
- [ ] Non-editable expenses (REPORTED, PENDIENTE_DE_PAGO, PAID) show no edit button
- [ ] All existing tests pass
