# Proposal: Expense Review Workflow

## Intent

Fix broken supervisor review for expenses: POST auto-promotion bypasses supervisor approval, AuditActions is dead code since V2 migration, no reject mechanism exists, and FACTURADO expenses remain editable after approval.

## Scope

### In Scope
- Remove POST auto-promotion to FACTURADO (always create as PENDIENTE_DE_FACTURAR)
- Lock FACTURADO expenses from editing (PATCH guard, form, edit button)
- Fix AuditActions for V2 statuses — show Approve (→FACTURADO) and Reject (adminComment)
- Add reject mechanism with adminComment (no REJECTED state needed)
- Fix BatchActionToolbar PENDIENTE_DE_PAGO mapping

### Out of Scope
- REJECTED enum value (reject = adminComment, status stays PENDIENTE_DE_FACTURAR)
- Batch approve/reject endpoints (deferred)
- API test suite (deferred to separate change)

## Capabilities

### New Capabilities
- `expense-review`: Supervisor approve (→FACTURADO) and reject (adminComment + stays PENDIENTE_DE_FACTURAR) for expenses. Covers AuditActions component, API behavior, and UI feedback for rejected items.

### Modified Capabilities
- `Expenses`:
  - POST: Always create as PENDIENTE_DE_FACTURAR, never auto-promote
  - PATCH field update: Return 403 when status >= FACTURADO
  - PATCH status transition: Allow FACTURADO → PENDIENTE_DE_FACTURAR (admin undo)
  - Edit Flow: FACTURADO locked (no edit button, locked message on edit page)
  - BatchActionToolbar: Fix PENDIENTE_DE_PAGO mapping (currently maps to "validate" incorrectly)

## Approach

1. **API layer**: Strip auto-promotion from POST. Add status guard to PATCH field update. Keep admin status-transition endpoint but add undo path.
2. **AuditActions**: Replace `PENDING`/`APPROVED` checks with `PENDIENTE_DE_FACTURAR`/`FACTURADO`. Show Approve and Reject buttons with inline comment input.
3. **UI layer**: Hide "Editar" link for FACTURADO+. Show "Este gasto ya fue aprobado" on edit page. Fix batch toolbar status mapping.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/expenses/route.ts` | Modified | Remove POST auto-promotion |
| `src/app/api/expenses/[id]/route.ts` | Modified | Add status guard, admin undo |
| `src/components/audit/AuditActions.tsx` | Modified | V2 status fix, reject support |
| `src/app/dashboard/gastos/page.tsx` | Modified | Hide Editar for FACTURADO+ |
| `src/app/dashboard/gastos/[id]/editar/page.tsx` | Modified | Locked state message |
| `src/components/gastos/BatchActionToolbar.tsx` | Modified | Fix status mapping |
| `openspec/specs/Expenses/spec.md` | Modified | Delta spec for changed reqs |
| `openspec/specs/Expense-Review/spec.md` | New | New spec for review workflow |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing FACTURADO expenses locked from editing | Low | No migration — old rules apply, these are legitimate |
| Reject without REJECTED state confuses users | Low | Show adminComment prominently in expense detail view |

## Rollback Plan

Revert all files to git HEAD. Re-deploy. FACTURADO expenses created under old auto-promotion remain valid — no data migration needed.

## Dependencies

None.

## Success Criteria

- [ ] POST always creates expense as PENDIENTE_DE_FACTURAR regardless of pdfUrl+xmlUrl
- [ ] PATCH returns 403 when status >= FACTURADO for field updates
- [ ] AuditActions renders Approve/Reject for PENDIENTE_DE_FACTURAR expenses
- [ ] Reject adds adminComment to expense, status stays PENDIENTE_DE_FACTURAR
- [ ] "Editar" link hidden for FACTURADO+ in expense list
- [ ] Edit page shows locked message for FACTURADO+ expenses
- [ ] Batch toolbar maps PENDIENTE_DE_PAGO to correct batch action
