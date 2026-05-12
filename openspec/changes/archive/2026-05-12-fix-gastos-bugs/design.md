# Design: fix-gastos-bugs

## Technical Approach

11 bugs corregidos en orden de severidad (CRÍTICO → BAJA). Cada bug tiene un cambio localizado sin refactor mayor. Se prioriza preservar el contrato API existente — no se renombran rutas ni se rompe compatibilidad con frontend.

## Architecture Decisions

### Decision: SUPERVISOR entra en `isAdmin()`

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Incluir SUPERVISOR en `isAdmin()` | Nombre engañoso pero semánticamente correcto para expenses | ✅ |
| Crear `canManageExpenses()` | Más preciso pero agrega complejidad innecesaria | ❌ |

**Rationale**: El frontend ya trata SUPERVISOR como admin para expenses. Crear otra función solo duplica lógica. Se actualiza `hasPharmacyAccess()` para delegar en `isAdmin()`.

### Decision: `pharmacyId` query param se ignora para VENDEDOR/ENCARGADO

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| Ignorar query param y forzar `user.pharmacy` | Seguro, no hay fuga de datos | ✅ |
| Intersectar query param con `user.pharmacy` | Permite sub-filtro pero agrega complejidad | ❌ |

**Rationale**: VENDEDOR/ENCARGADO tienen UNA sola farmacia. No tiene sentido permitir filtrar por otra.

### Decision: Campo `isModified` se renombra a `wasModified`

**Rationale**: Elimina shadowing de `Document.isModified()`. Sin migración — documentos viejos tendrán `wasModified: undefined` (falsy, mismo comportamiento que `false`).

### Decision: batch-return NO se renombra

**Rationale**: El nombre refleja la acción (devuelve gastos a estado previo). Renombrar rompe API contract del frontend. Bug #10 es solo el naming del hook `expenseNumber`.

### Decision: Optimización batch queries NO incluida

**Rationale**: Queda para cambio futuro. Los N queries secuenciales son aceptables para batches pequeños (max 50 IDs).

## Bug Fixes

### Bug #3 — isAdmin() sin SUPERVISOR
- **Files**: `src/lib/roles.ts`, `src/lib/roles.test.ts`, `src/lib/auth.test.ts`
- **Fix**: Agregar `role === UserRole.SUPERVISOR` en `isAdmin()`. Simplificar `hasPharmacyAccess()` a solo `isAdmin(role)`.
- **Before**: `return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN`
- **After**: `return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.SUPERVISOR`
- **Tests**: roles.test.ts cambia expect de `false` a `true` para SUPERVISOR. auth.test.ts igual.
- **Riesgo**: Bajo — el cambio hace más permisivo, no más restrictivo.

### Bug #4 — Tests mockean isAdmin() distinto a prod
- **Files**: `src/tests/expense-v2-batch-approve.test.ts`, `src/tests/expense-v2-batch-report.test.ts`, `src/tests/expense-v2-batch-return.test.ts`, `src/tests/expense-v2-patch-status.test.ts`
- **Fix**: Los tests batch ya mockean `isAdmin` con SUPERVISOR incluido — no requieren cambio. Los tests `patch-status` mockean `isAdmin: vi.fn()` sin implementación — se actualizan para reflejar prod.
- **Riesgo**: Ninguno — tests se alinean con implementación.

### Bug #1 — GET /api/expenses sin filtro pharmacy para no-admin
- **Files**: `src/app/api/expenses/route.ts`
- **Fix**: Agregar bloque que fuerza `query.pharmacy` para VENDEDOR/ENCARGADO basado en `assignedPharmacies[0]`.
- **Riesgo**: Medio — asegurar que ADMIN/SUPER_ADMIN/SUPERVISOR no reciben filtro forzado.

### Bug #6 — SUPERVISOR elude pharmacy filter vía query param
- **Files**: `src/app/api/expenses/route.ts`
- **Fix**: En `buildExpenseFilter()`, no incluir `pharmacyId` si el usuario no es ADMIN/SUPER_ADMIN. Para SUPERVISOR, intersectar pharmacyId (si se provee) con sus `assignedPharmacies`.
- **Before**: `query = { ...query, ...additionalFilters }` — sobrescribe filtro SUPERVISOR
- **After**: Pharmacy filter se aplica DESPUÉS de additionalFilters, no se deja sobrescribir

### Bug #2 — GET /api/expenses/[id] compara pharmacy vs user._id
- **Files**: `src/app/api/expenses/[id]/route.ts`
- **Before**: `expense.pharmacy.toString() !== session.user.id`
- **After**: `!userPharmacies.includes(expense.pharmacy.toString())`
- **Fix**: Comparar `expense.pharmacy` contra `assignedPharmacies[]` del usuario.
- **Riesgo**: Alto — la lógica inline `isAdminRole()` se reemplaza por `isAdmin()` de roles.ts (que ahora incluye SUPERVISOR).

### Bug #8 — PATCH /api/expenses/[id] sin ownership check
- **Files**: `src/app/api/expenses/[id]/route.ts`
- **Fix**: En el branch de field update (no-admin), verificar que `expense.pharmacy` está en `user.assignedPharmacies`. Si no, 403.
- **Riesgo**: Medio — usuarios no-admin que antes podían editar cualquier gasto ahora reciben 403.

### Bug #5 — Date filter rechaza YYYY-MM-DD
- **Files**: `src/lib/validations.ts`
- **Before**: `startDate: z.string().datetime().optional()`
- **After**: `startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()`
- **Riesgo**: Bajo — `buildExpenseFilter()` ya usa `new Date(filters.startDate)` que parsea YYYY-MM-DD correctamente.

### Bug #7 — isModified() choca con Document.isModified()
- **Files**: `src/models/Expense.ts`, `src/types/index.ts`, `src/app/api/expenses/[id]/route.ts`, `src/types/api-responses.ts`
- **Fix**: Renombrar campo `isModified` → `wasModified` en schema, interface IExpenseDocument, IExpense, IExpenseResponseV2, y route.
- **Before**: `isModified: { type: Boolean, default: false }`
- **After**: `wasModified: { type: Boolean, default: false }`
- **Riesgo**: Bajo — updateData cambia de `isModified` a `wasModified` en route.ts.

### Bug #9 — batch-approve y batch-report con lógica duplicada
- **Files**: `src/app/api/expenses/batch-approve/route.ts`, `src/app/api/expenses/batch-report/route.ts` (+ batch-return)
- **Fix**: Crear helper compartido `src/lib/expense-batch.ts` con función `processBatchStatusTransitions()` que recibe configuración de transición.
- **Riesgo**: Medio — refactor de lógica existente. Mantener exacto comportamiento actual.

### Bug #10/#11 — expenseNumber hook usa año actual, no receiptDate
- **Files**: `src/models/Expense.ts`
- **Before**: `const year = new Date().getFullYear()`
- **After**: `const year = this.receiptDate ? new Date(this.receiptDate).getFullYear() : new Date().getFullYear()`
- **Riesgo**: Bajo — números de gasto existentes no cambian. Solo afecta nuevos gastos.

## Interfaces / Contracts

```typescript
// src/lib/expense-batch.ts (nuevo)
type BatchTransitionConfig = {
  fromStatus: ExpenseStatus[]
  toStatus: ExpenseStatus
  validate?: (expense: IExpenseDocument) => { valid: boolean; error?: string }
  extraFields?: (expense: IExpenseDocument, body: any) => Record<string, any>
}

async function processBatchStatusTransitions(
  expenseIds: string[],
  config: BatchTransitionConfig,
  context: { userId: string; notes?: string }
): Promise<BatchResult[]>
```

## Testing Strategy

| Layer | Qué probar | Cómo |
|-------|-----------|------|
| Unit (roles) | `isAdmin()` incluye SUPERVISOR | Actualizar asserts en `roles.test.ts` y `auth.test.ts` |
| Unit (validations) | Date filter acepta YYYY-MM-DD | Tests directos de Zod schema |
| Integration (routes) | GET filtra por pharmacy para VENDEDOR | Tests con session mockeada en `expenses-cache.test.ts` |
| Integration (routes) | GET / [id] no da 403 a dueño | Test con session + expense de misma pharmacy |
| Integration (routes) | PATCH rechaza edición ajena | Test con session de otra pharmacy |
| Integration (batch) | Shared helper procesa transiciones | Tests parametrizados por tipo de batch |

## Data Flow

```
PATCH /api/expenses/[id] (field update, non-admin):

  Request → session → isAdmin? → NO → ownership check:
    expense.pharmacy ∈ user.assignedPharmacies? → NO → 403
                                                  → SÍ → proceed

GET /api/expenses (con filtro):

  Request → session → role?
    ADMIN/SUPER_ADMIN → no forced filter, pharmacyId query param accepted
    SUPERVISOR → filter by assignedPharmacies, pharmacyId intersected
    VENDEDOR/ENCARGADO → filter by assignedPharmacies[0], pharmacyId IGNORED
```

## Migration / Rollout

No se requiere migración de datos. `wasModified` tendrá `undefined` en documentos existentes (comportamiento idéntico a `false`).

**Rollback**: `git revert HEAD~N` sobre commits. Verificar que `isAdmin()` vuelve a estado anterior y GET /api/expenses no filtra.

## Open Questions

- [ ] Ninguno — todas las decisiones están resueltas.
