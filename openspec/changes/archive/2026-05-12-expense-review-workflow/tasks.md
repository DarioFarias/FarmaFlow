# Tasks: Expense Review Workflow

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120-180 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

```
Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low
```

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | API + Audit + UI + Specs | PR 1 | Single PR — 6 files, <200 lines |

## Phase 1: API Layer — POST + PATCH

- [ ] 1.1 **`src/app/api/expenses/route.ts`** — Remove lines 158–172 (`hasFullInvoice`/`initialStatus` logic). Strip explicit `status` from the `create()` call; Mongoose default applies.
- [ ] 1.2 **`src/app/api/expenses/[id]/route.ts`** — Add status guard (field-update branch: `status !== PENDIENTE_DE_FACTURAR` → 403). Add `action === 'reject'` branch (stores `adminComment` + `rejectedAt`, no status change). Add `PENDIENTE_DE_FACTURAR` to `VALID_TRANSITIONS[FACTURADO]`. Remove `wasAlreadyFacturado`/`wasModified` dead code.

## Phase 2: Audit & Reject UI

- [ ] 2.1 **`src/components/audit/AuditActions.tsx`** — Replace `PENDING` check with `PENDIENTE_DE_FACTURAR`. Approve sends `PATCH { status: FACTURADO, adminComment }`. Reject sends `PATCH { action: 'reject', adminComment }`. Remove legacy `APPROVED`/`REJECTED` literal strings.

## Phase 3: UI Layer — Edit Lock + Batch Toolbar

- [ ] 3.1 **`src/app/dashboard/gastos/page.tsx`** — Edit button condition: show only for `PENDIENTE_DE_FACTURAR`. Drop the `FACTURADO` branch.
- [ ] 3.2 **`src/app/dashboard/gastos/[id]/editar/page.tsx`** — Add locked-state detection: if status !== `PENDIENTE_DE_FACTURAR`, render "Este gasto ya fue aprobado y no puede editarse" instead of ExpenseForm.
- [ ] 3.3 **`src/components/gastos/BatchActionToolbar.tsx`** — Remove `PENDIENTE_DE_PAGO → 'validate'` mapping. Return `null` from `getAction()` for that status.

## Phase 4: Spec Artifacts (Delta Sync)

- [ ] 4.1 **`openspec/specs/Expenses/spec.md`** — Merge ADDED/MODIFIED requirements from Expenses delta spec into the main spec.
- [ ] 4.2 **`openspec/specs/Expense-Review/spec.md`** — Create the new Expense-Review main spec from the delta spec.
