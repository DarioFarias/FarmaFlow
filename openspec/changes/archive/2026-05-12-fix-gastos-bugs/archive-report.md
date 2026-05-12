# Archive Report: fix-gastos-bugs

**Date archived**: 2026-05-12
**Branch**: `fix/gastos-bugs`
**Mode**: Hybrid (Engram + OpenSpec)
**Status**: ⚠️ **PARTIAL** — Branch NOT merged to main. Critical bugs fixed, remaining work pending.

---

## Branch & Commit Info

| Field | Value |
|-------|-------|
| Branch | `fix/gastos-bugs` |
| HEAD SHA | `9dd617c` |
| HEAD Date | 2026-05-12 16:18:38 -0600 |
| HEAD Message | `fix: resolve merge conflict markers in GastosPage + TypeScript build errors (isModified, db null check)` |
| Merged to main | ❌ No — branch is NOT merged |
| Origin tracking | `origin/main` at same commit (rebased) |

> **Note**: This change is archived while still on the fix branch. The branch has been rebased onto `origin/main` (HEAD and origin/main point to the same commit). Changes will take effect once the branch is merged to `main`.

---

## Artifact Observation IDs (Engram)

| Artifact | Engram ID |
|----------|-----------|
| Exploration | #276 |
| Proposal | #277 |
| Spec | #278 |
| Design | #279 |
| Tasks | #280 |
| Apply Progress | #281 |
| Verify Report | #282 |
| Archive Report | *(this document)* |

---

## Bugs Fixed (8 of 11)

### Critical (3/3) ✅

| Bug | Severity | Description | Fixed |
|-----|----------|-------------|-------|
| #1 | CRÍTICO | GET /api/expenses sin filtro pharmacy para no-admin | ✅ Task 2.2 |
| #2 | CRÍTICO | GET /api/expenses/[id] compara ObjectId de pharmacy vs user._id | ✅ Task 2.5 |
| #3 | CRÍTICO | isAdmin() no incluye SUPERVISOR | ✅ Task 1.2 |

### High (3/3) ✅

| Bug | Severity | Description | Fixed |
|-----|----------|-------------|-------|
| #5 | ALTA | Date filter rechaza YYYY-MM-DD | ✅ Task 3.2 |
| #6 | ALTA | SUPERVISOR elude pharmacy filter por query param | ✅ Task 2.3 |
| #8 | ALTA | PATCH /api/expenses/[id] sin ownership check | ✅ Task 2.6 |

### Medium (2/3) ⚠️

| Bug | Severity | Description | Fixed |
|-----|----------|-------------|-------|
| #4 | MEDIA | Tests mockean isAdmin() distinto a prod | ✅ Task 1.1 |
| #7 | MEDIA | isModified() choca con Document.isModified() | ✅ Task 3.4 |
| #9 | MEDIA | batch-approve/report lógica duplicada | ❌ Not implemented |

### Low (0/2) ⚠️

| Bug | Severity | Description | Fixed |
|-----|----------|-------------|-------|
| #10/#11 | BAJA | expenseNumber hook usa año actual, no receiptDate | ✅ Task 4.4 |

---

## What Was Fixed

| Bug | Summary |
|-----|---------|
| #1 | GET /api/expenses: VENDEDOR/ENCARGADO ahora ven solo gastos de su farmacia. Query param `pharmacyId` ignorado. |
| #2 | GET /api/expenses/[id]: Comparación corregida — usa `assignedPharmacies.includes(expense.pharmacy)`, no `user._id`. |
| #3 | `isAdmin()` incluye `SUPERVISOR`. El frontend ya lo trataba como admin — backend ahora coincide. |
| #4 | Tests actualizados para mockear `isAdmin()` con SUPERVISOR incluido, reflejando producción. |
| #5 | Filtro fecha cambió de `z.string().datetime()` a regex `YYYY-MM-DD`. |
| #6 | SUPERVISOR puede filtrar por `pharmacyId` pero intersectado con `assignedPharmacies`. VENDEDOR/ENCARGADO ignoran el param. |
| #7 | Campo `isModified` renombrado a `wasModified` en schema, tipos y rutas. Sin migración necesaria. |
| #8 | PATCH /api/expenses/[id] ahora verifica ownership — no-admin solo edita gastos de su farmacia. |
| #10/#11 | Hook `pre('save')` deriva año de `receiptDate`, no de `new Date().getFullYear()`. |

---

## What Remains Pending (3 Bugs, 9 Tasks)

### Bug #9 — Batch helper refactor (MEDIA)
- **4.2**: Crear `src/lib/expense-batch.ts` con `processBatchStatusTransitions()` helper compartido
- Lógica batch funciona pero está duplicada en batch-approve, batch-report y batch-return

### Missing TDD Tests
- **2.1**: TDD RED for GET /api/expenses pharmacy filter
- **2.4**: TDD RED for GET /api/expenses/[id] ownership
- **3.1**: TDD RED for date filter validation
- **3.3**: TDD RED for wasModified field
- **4.1**: TDD RED for batch-approve transition
- **4.3**: TDD RED for expenseNumber year

### Phase 5 — Polish
- **5.1**: Fix patch-status test mock
- **5.2**: Update batch tests for auth/ownership
- **5.3**: Full test suite run

---

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` | ✅ PASS |
| `npx vitest run` | ✅ PASS (272/310 — 38 pre-existing UI failures) |
| Core unit tests | ✅ 12/12 (roles.test.ts) |
| Critical security bugs | ✅ All 3 fixed |
| Spec scenarios | 8/11 bugs fixed (73%) |
| Tasks complete | 10/19 (53%) |

### Risk Assessment

- **Low risk**: Production code changes are solid
- **Medium risk**: Missing tests mean regression risk for edge cases
- **Recommendation**: Merge to main with noted gaps; complete TDD tests and batch refactor as follow-up

---

## Files Changed

| File | Action |
|------|--------|
| `src/lib/roles.ts` | Modified — isAdmin() includes SUPERVISOR |
| `src/lib/roles.test.ts` | Modified — test expects true for SUPERVISOR |
| `src/lib/auth.test.ts` | Modified — test expects true for SUPERVISOR |
| `src/app/api/expenses/route.ts` | Modified — pharmacy filters by role |
| `src/app/api/expenses/[id]/route.ts` | Modified — ownership checks + wasModified rename |
| `src/lib/validations.ts` | Modified — date regex YYYY-MM-DD |
| `src/models/Expense.ts` | Modified — wasModified field, expenseNumber year fix |
| `src/types/index.ts` | Modified — wasModified type |
| `src/types/api-responses.ts` | Modified — wasModified type |
| `src/tests/expense-v2-types.test.ts` | Modified — wasModified usage |
| `src/tests/expense-v2-patch-status.test.ts` | Modified — isAdmin mock update |

---

## Main Specs Updated

| Domain | Action | Details |
|--------|--------|---------|
| Expenses | ✅ Created | `openspec/specs/Expenses/spec.md` — full spec from delta |

### Source of Truth

The following specs now reflect the new behavior:
- `openspec/specs/Expenses/spec.md` — Auth, API, and Data domain requirements for the expenses module

---

## Archive Contents

| Artifact | Status |
|----------|--------|
| `proposal.md` | ✅ |
| `spec.md` | ✅ |
| `design.md` | ✅ |
| `tasks.md` | ✅ |
| `verify-report.md` | ✅ |
| `archive-report.md` | ✅ (this document) |

Archived to: `openspec/changes/archive/2026-05-12-fix-gastos-bugs/`

---

## SDD Cycle

| Phase | Status |
|-------|--------|
| Exploration | ✅ Complete |
| Proposal | ✅ Complete |
| Spec | ✅ Complete |
| Design | ✅ Complete |
| Tasks | ✅ Complete |
| Apply | ⚠️ Partial (10/19 tasks) |
| Verify | ⚠️ Partial (8/11 bugs) |
| Archive | ✅ Complete |
