# Design: Unify Batch Expense Routes

## Technical Approach

Consolidate 3 duplicate route files into a single `POST /api/expenses/batch` that dispatches by `body.action` — same pattern as `[id]/route.ts` uses for `body.action === 'reject'`. Old routes become thin wrappers that import and call the unified handler. A new `batchActionSchema` with Zod discriminated union enforces `period` required only when `action='report'`. Response shapes standardize to `{ success, data: { processed, failed, total, results } }` across all actions. Frontend `BatchActionToolbar` updates endpoint URL and adds `period` for report action. Obsolete colocated tests (which test V1 PATCH legacy, not current POST) get deleted; V2 tests update imports to point at unified route.

Per-item processing stays sequential (`findById` loop) for approve/return (partial success OK). Batch-report remains all-or-nothing atomic — validates all first, then `Promise.all` updates. No shared service layer needed; the handler functions live in the route file following project convention.

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Where does shared batch logic live? | **In `batch/route.ts` as local handler functions** | Each action's state logic is different (approve validates pdfUrl/xmlUrl per item, report is atomic, return is per-item). Extracting to a service would add indirection without eliminating meaningful duplication. The route IS the handler, same as existing `[id]/route.ts`. |
| Response shape | **New `BatchResult` type; wrapped in existing `ApiResponse<BatchResult>`** | Current response shapes are inconsistent (batch-report drops `failed` and `total`). A dedicated type enforces uniformity. `ApiResponse<T>` wrapper already projects as `{ success, data }` — no new response envelope needed. |
| Old route strategy | **Thin wrappers that re-export the shared handler** | 301 redirect breaks POST semantics (fetch doesn't follow POST redirects reliably). An internal re-export keeps backward compat zero-cost. |
| Validation approach | **Single `batchActionSchema` with Zod `.discriminatedUnion('action', ...)`** | Single schema enforces global constraints (min 1, max 50 IDs) and branch-specific constraints (`period` required only for `report`) at the schema layer — no imperative validation needed. |
| Extracted common logic | **`requireAdmin()` helper in route; no `processBatch()`** | Auth check + `getServerSession` + 401/403 response repeats 3x — worth extracting as a local helper. The per-item processing loops for approve vs return differ in status-check logic, so a shared `processBatch` would require callbacks and add complexity beyond what it saves. |

## Data Flow

```
BatchActionToolbar ──POST {action, expenseIds, period?, notes?}──→ /api/expenses/batch
                                                                      │
                                                          requireAdmin() ←── getServerSession()
                                                                      │
                                                            batchActionSchema.safeParse()
                                                                      │
                                                            switch (action) ────────────┐
                                                                │                       │
                                                        ┌───────┴───────┐               │
                                                        │               │               │
                                                   handleApprove  handleReport    handleReturn
                                                        │               │               │
                                                  forEach id:    validate ALL:    forEach id:
                                                  findById()     findById()       findById()
                                                  validate pdf   check ALL        check status
                                                  + xmlUrl       are FACTURADO    is REPORTED
                                                  update →       Promise.all      update →
                                                  FACTURADO      → REPORTED       PENDIENTE_DE_PAGO
                                                        │               │               │
                                                        └───────┬───────┘               │
                                                                │                       │
                                                        { processed, failed,           │
                                                          total, results } ←───────────┘
                                                                │
                                                     NextResponse.json<ApiResponse<BatchResult>>
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/expenses/batch/route.ts` | **Create** | Unified POST handler with action dispatch. ~150 LOC. |
| `src/app/api/expenses/batch-approve/route.ts` | Modify | Become thin wrapper: import `POST` from `../batch/route` and re-export as `POST handleApprove`. |
| `src/app/api/expenses/batch-report/route.ts` | Modify | Same thin wrapper pattern. |
| `src/app/api/expenses/batch-return/route.ts` | Modify | Same thin wrapper pattern. |
| `src/lib/validations.ts` | Modify | Add `batchActionSchema` with discriminated union; keep old schemas for backward compat during transition. |
| `src/types/index.ts` | Modify | Add `BatchResult` and `BatchResultItem` interfaces. |
| `src/components/gastos/BatchActionToolbar.tsx` | Modify | Change endpoint to `/api/expenses/batch`; add `action` field and `period` for report; include `notes` field. |
| `src/app/api/expenses/batch-approve/batch-approve.test.ts` | **Delete** | Tests V1 legacy PATCH with V1 statuses — obsolete. |
| `src/app/api/expenses/batch-report/batch-report.test.ts` | **Delete** | Same — tests V1 PATCH. |
| `src/tests/expense-v2-batch-approve.test.ts` | Modify | Update import to unified route; adjust request body to include `action: 'approve'`. |
| `src/tests/expense-v2-batch-report.test.ts` | Modify | Update import to unified route; add `action: 'report'` to body. |
| `src/tests/expense-v2-batch-return.test.ts` | Modify | Update import to unified route; add `action: 'return'` to body. |
| `src/tests/batch-action-toolbar.test.tsx` | Modify | Update expected endpoint URL. |

## Interfaces / Contracts

```typescript
// src/types/index.ts — add
export interface BatchResultItem {
  id: string
  success: boolean
  error?: string
}

export interface BatchResult {
  processed: number
  failed: number
  total: number
  results: BatchResultItem[]
}

// src/lib/validations.ts — add
export const batchActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('approve'),
    expenseIds: z.array(z.string()).min(1, 'Debe incluir al menos un ID').max(50),
    notes: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal('report'),
    expenseIds: z.array(z.string()).min(1).max(50),
    period: z.string().regex(/^\d{4}-\d{2}$/, 'Formato: YYYY-MM'),
    notes: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal('return'),
    expenseIds: z.array(z.string()).min(1).max(50),
    notes: z.string().max(500).optional(),
  }),
])
```

## Key Implementation Details

**`batch/route.ts` structure:**
```
POST(req):
  1. requireAdmin() → session or 401/403
  2. batchActionSchema.safeParse(body) → 400 if invalid
  3. connectDB()
  4. switch(body.action):
       'approve' → handleApprove(expenseIds, notes, session)
       'report'  → handleReport(expenseIds, period, notes, session)
       'return'  → handleReturn(expenseIds, notes, session)
  5. Return NextResponse.json<ApiResponse<BatchResult>>(...)
```

**Thin wrapper pattern (batch-approve/route.ts):**
```typescript
import { POST as batchPost } from '../batch/route'
export const POST = batchPost
// No additional code — the unified handler reads action from body
```

**Frontend changes (BatchActionToolbar.tsx):**
- Endpoint: `/api/expenses/batch` (was `/api/expenses/batch-approve` etc.)
- Body: `{ action: currentAction, expenseIds, period: currentFilter === 'FACTURADO' ? periodValue : undefined, notes }`
- Add a period input/selector when action is `report`

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `batchActionSchema` | Test each action branch: valid approve body, valid report with period, valid return, report without period → 400, invalid action → 400. |
| Integration | `POST /api/expenses/batch` action dispatch | New test file `src/tests/expense-v2-batch.test.ts`: test approve (valid + missing pdfUrl), test report (valid + non-FACTURADO), test return (valid + non-REPORTED). Import from unified route. |
| Integration | Auth enforcement | 401 for no session, 403 for VENDEDOR. |
| Integration | Response shape | All 3 actions return `{ success, data: { processed, failed, total, results } }`. |
| E2E / Component | `BatchActionToolbar` | Update existing `batch-action-toolbar.test.tsx`: verify new endpoint in fetch call. Verify `period` is sent for report action. |

## Migration / Rollout

No migration required. Old routes remain as thin wrappers — no breaking change. Frontend deployment can happen independently; old routes still work during transition.

## Open Questions

- [ ] Does the frontend need a period picker/input, or should the period be auto-derived from the current month? Spec says frontend "must include period" but current code never sends it.
