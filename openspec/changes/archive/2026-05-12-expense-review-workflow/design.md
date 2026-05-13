# Design: Expense Review Workflow

## Technical Approach

Five targeted changes across API and UI layers. POST auto-promotion is removed by deleting the `hasFullInvoice`/`initialStatus` block — the Mongoose default (`PENDIENTE_DE_FACTURAR`) applies automatically. PATCH field updates are gated: only `PENDIENTE_DE_FACTURAR` may be edited, others get 403. AuditActions replaces legacy `PENDING`/`APPROVED` checks with `PENDIENTE_DE_FACTURAR` and exposes inline Reject via an `action: 'reject'` discriminator in PATCH. Batch toolbar drops the `PENDIENTE_DE_PAGO → validate` mapping (returns null, hides button).

## Architecture Decisions

### Decision: Action discriminator for reject flow
| Option | Tradeoff | Decision |
|--------|----------|----------|
| `action` field in PATCH body | One new branch in handler, parallels existing `status` routing | ✅ **Chosen** |
| Separate `POST /api/expenses/[id]/reject` | Route overhead, breaks existing pattern | Rejected |
| Implicit detection via `adminComment` presence | Ambiguous if field-update branch ever includes adminComment | Rejected |

**Rationale**: `{ action: 'reject', adminComment: '...' }` is explicit, minimal code change, and follows the existing `body.status` routing convention.

### Decision: Status guard for field updates
Change `currentStatus === REPORTED` → `currentStatus !== PENDIENTE_DE_FACTURAR`. Enum ordinal comparison (`status >= FACTURADO`) was rejected — it couples to declaration order and breaks if new statuses are inserted. Direct inequality is self-documenting and robust.

### Decision: FACTURADO undo path
Add `PENDIENTE_DE_FACTURAR` to `VALID_TRANSITIONS[FACTURADO]`. Reuses the existing status-transition branch with `isAdmin` guard. A dedicated undo endpoint was rejected as overengineered.

### Decision: Batch toolbar null action
`getAction()` returns `null` for `PENDIENTE_DE_PAGO`, hiding the action button. Mapping to a future `'pay'` action would show a non-functional button — null is safer and trivially extendable later.

## Data Flow

```
PATCH /api/expenses/:id
  │
  ├─ body.action === 'reject' ──→ Store adminComment only. Status unchanged.
  ├─ body.status + isAdmin   ──→ Status transition (incl. undo via VALID_TRANSITIONS)
  └─ (no status, no action)  ──→ Field update. Requires PENDIENTE_DE_FACTURAR only.
                                   Validated via updateExpenseSchema.
```

```
AuditActions (when status === PENDIENTE_DE_FACTURAR)
  ├─ Approve → PATCH { status: FACTURADO, adminComment }
  └─ Reject  → PATCH { action: 'reject', adminComment }
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/expenses/route.ts` | Modify | Remove lines 158–172 (hasFullInvoice/initialStatus), strip `status` from create call |
| `src/app/api/expenses/[id]/route.ts` | Modify | Guard field-update branch: `status !== PENDIENTE_DE_FACTURAR` → 403. Add `action === 'reject'` branch. Add `PENDIENTE_DE_FACTURAR` to `VALID_TRANSITIONS[FACTURADO]`. Remove `wasAlreadyFacturado`/`wasModified` dead code. |
| `src/components/audit/AuditActions.tsx` | Modify | Replace `PENDING` check with `PENDIENTE_DE_FACTURAR`. Approve sends `FACTURADO` status. Reject sends `action: 'reject'`. Remove legacy `APPROVED`/`REJECTED` literal strings. |
| `src/app/dashboard/gastos/page.tsx` | Modify | Edit button condition: drop `FACTURADO`, show only for `PENDIENTE_DE_FACTURAR` |
| `src/app/dashboard/gastos/[id]/editar/page.tsx` | Modify | Add locked-state detection: if expense status !== `PENDIENTE_DE_FACTURAR`, render locked message ("Este gasto ya fue aprobado y no puede editarse") instead of ExpenseForm |
| `src/components/gastos/BatchActionToolbar.tsx` | Modify | Remove `PENDIENTE_DE_PAGO → 'validate'` mapping. Update return type to allow `null` |

## Interfaces / Contracts

**New PATCH discriminator for rejects:**
```typescript
// Reject (no status change)
{ action: 'reject', adminComment: string }

// Status transition (existing)
{ status: ExpenseStatus, adminComment?: string }

// Field update (existing)
{ amount?: number, description?: string, ... }  // updateExpenseSchema fields
```

**Validation schema update:** No new Zod schemas needed. The `action` field is validated inline in the handler (optional string, only used when `=== 'reject'`). Existing `updateExpenseSchema` unchanged.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `isValidTransition` with new FACTURADO → PENDIENTE_DE_FACTURAR | Add test case to existing transition tests |
| Integration | POST creates PENDIENTE_DE_FACTURAR always | Hit POST with pdfUrl+xmlUrl, assert status |
| Integration | PATCH field update on FACTURADO returns 403 | Send PATCH with field changes to FACTURADO expense |
| Integration | PATCH reject adds adminComment | Send `{ action: 'reject', adminComment: 'X' }`, check DB |
| Integration | AuditActions renders for PENDIENTE_DE_FACTURAR only | Render with different statuses, assert snapshot |
| Integration | Batch toolbar hides button for PENDIENTE_DE_PAGO | Set filter, assert no action button rendered |

## Migration / Rollout

No data migration required. Existing FACTURADO records from auto-promotion remain valid. Deploy as a single PR — changes are small (< 200 lines delta). **Rollback**: revert to git HEAD.

## Open Questions

- [ ] Should the edit page show the `adminComment` (rejection reason) to the VENDEDOR? Proposal implies yes but no UI mockup exists — defer to spec.
- [ ] `PENDIENTE_DE_PAGO` batch action: map to `null` now, or add a `'pay'` action as scaffolding even without an endpoint? Design says `null` — confirm during tasks.
