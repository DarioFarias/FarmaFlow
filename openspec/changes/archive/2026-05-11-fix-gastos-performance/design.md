# Design: Optimizar Performance del Módulo de Gastos

## Technical Approach

Cuatro intervenciones independientes que reducen queries a MongoDB y agregan caching en cliente/server. Se reutiliza el patrón `MetricsCache<T>` existente en `src/lib/metrics-cache.ts` extrayendo la lógica genérica a `src/lib/ttl-cache.ts`.

```
Antes (GET /api/expenses, SUPERVISOR):
  Pharmacy.find({$in}) → Expense.find() → Expense.countDocuments()
  3 queries, Pharmacy query repetido en cada request

Después (mismo escenario):
  cache hit? → Expense.find() → Expense.countDocuments()
  2 queries (o 3 si cache miss)
```

## Architecture Decisions

### 1. In-Memory Cache para Pharmacy Query

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| React.cache() de Next.js | Solo para Server Components, no route handlers | ❌ |
| Redis/Memcached externo | Overhead de infraestructura para cache simple | ❌ |
| **Map in-memory con TTL** | Simple, 0 dependencias, se pierde en deploy/reinicio | ✅ |

Se extrae `TTLCache<T>` genérico de `MetricsCache<T>`, se reusa con TTL=60s, keyed por `sorted(assignedPharmacies).join(',')`.

### 2. Bulk Operations en Batch Routes

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| for+await secuencial (actual) | 2N queries, fácil de leer pero lentísimo | ❌ |
| Promise.all con findById+findByIdAndUpdate | batch-report ya lo usa parcialmente, pero aún 2N queries | ❌ |
| **find({$in}) + bulkWrite** | 2 queries totales, validación en memoria, operación atómica parcial | ✅ |

Se aplica a `batch-approve`, `batch-report`, y `batch-return` (mismo patrón).

### 3. Client-Side Caching con React Query

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| SWR | Similar a React Query, 0.1kB lighter | ❌ Ya establecido usar React Query en proyecto |
| **TanStack React Query v5** | +29kB bundle, setup de provider, staleTime 30s | ✅ |
| localStorage + manual invalidation | Sin dependencias, pero sin dedup automático ni refetch inteligente | ❌ |

Se agrega `@tanstack/react-query`, se envuelve `Providers.tsx` con `QueryClientProvider`, se crean hooks `useExpenses()` y `useMyPharmacies()`.

### 4. Índice Compuesto `{pharmacy, status, createdAt}`

| Opción | Tradeoff | Decisión |
|--------|----------|--------|
| Usar índices existentes | `{pharmacy:1,status:1}` + `{pharmacy:1,createdAt:-1}` — MongoDB los combina parcialmente pero no optimiza sort | ❌ |
| **Agregar índice compuesto** | Write overhead mínimo (ya hay índices similares), sort cubierto por índice | ✅ |

Se agrega `ExpenseSchema.index({ pharmacy: 1, status: 1, createdAt: -1 })`.

## Data Flow

```
GET /api/expenses (SUPERVISOR) — BEFORE:

  Route Handler
    ├─ await connectDB()
    ├─ await import('@/models/Pharmacy')      ← dynamic import cada request
    ├─ await Pharmacy.find({$in, isActive})   ← N+1: siempre a DB
    ├─ await Expense.find(query).sort().skip()
    └─ await Expense.countDocuments(query)

GET /api/expenses (SUPERVISOR) — AFTER:

  Route Handler
    ├─ await connectDB()
    ├─ pharmacyCache.get(key) ??              ← cache TTL 60s
    │    await Pharmacy.find({$in, isActive})
    │    pharmacyCache.set(key, result)
    ├─ await Expense.find(query).sort().skip()
    └─ await Expense.countDocuments(query)

batch-approve — BEFORE:  20 expenses → 40 queries (2N)
batch-approve — AFTER:   20 expenses →  2 queries (find + bulkWrite)
```

## File Changes

| File | Acción | Descripción |
|------|--------|-------------|
| `src/lib/ttl-cache.ts` | Crear | `TTLCache<T>` genérico extraído de `MetricsCache` |
| `src/lib/metrics-cache.ts` | Modificar | Re-exportar desde `ttl-cache.ts` (backward compat) |
| `src/app/api/expenses/route.ts` | Modificar | Usar `pharmacyCache` para cachear Pharmacy query (L215-229) |
| `src/app/api/expenses/batch-approve/route.ts` | Modificar | `find({$in})` + `bulkWrite` en lugar de `for+findById` |
| `src/app/api/expenses/batch-report/route.ts` | Modificar | `find({$in})` + `bulkWrite` en lugar de dos loops |
| `src/app/api/expenses/batch-return/route.ts` | Modificar | Mismo patrón que batch-approve (nuevo scope) |
| `src/models/Expense.ts` | Modificar | Agregar `index({ pharmacy: 1, status: 1, createdAt: -1 })` |
| `src/components/Providers.tsx` | Modificar | Envolver con `QueryClientProvider` |
| `src/lib/hooks/use-expenses.ts` | Crear | Hook `useExpenses(filters, pagination)` con React Query |
| `src/lib/hooks/use-my-pharmacies.ts` | Crear | Hook `useMyPharmacies()` con staleTime 5min |
| `src/app/dashboard/gastos/page.tsx` | Modificar | Reemplazar `useState+useEffect+fetch` por `useExpenses()` |
| `src/app/dashboard/gastos/ExpenseForm.tsx` | Modificar | Reemplazar `useEffect+fetch` por `useMyPharmacies()` |
| `package.json` | Modificar | Agregar `@tanstack/react-query` |

## Interfaces / Contracts

### `src/lib/ttl-cache.ts`

```typescript
class TTL_CACHE<T> {
  constructor(private ttlMs: number = 60_000)
  get(key: string): T | null
  set(key: string, data: T): void
  invalidate(key: string): void
  clear(): void
}
```

### `src/lib/hooks/use-expenses.ts`

```typescript
interface UseExpensesResult {
  expenses: IExpenseResponse[]
  total: number
  totalPages: number
  page: number
  isLoading: boolean
  error: Error | null
}

function useExpenses(
  filters: ExpenseFilters,
  page: number,
  pageSize?: number
): UseExpensesResult
```

### `src/lib/hooks/use-my-pharmacies.ts`

```typescript
interface UseMyPharmaciesResult {
  pharmacies: PharmacyOption[]
  isLoading: boolean
}

function useMyPharmacies(): UseMyPharmaciesResult
```

## Testing Strategy

| Capa | Qué testear | Cómo |
|------|-------------|------|
| Unit | `TTLCache<T>` — set/get, TTL expiry, invalidate | Vitest + fake timers |
| Unit | `batch-approve` bulk logic — validación en memoria, partial failures | Mockear `Expense.find` + `Expense.bulkWrite` |
| Unit | `batch-report` bulk logic | Idem |
| Integration | GET /api/expenses con/ sin cache hit | Supertest + mongodb-memory-server |
| Integration | batch operations con expenseIds válidos/inválidos | Supertest + mongodb-memory-server |
| Component | `page.tsx` — lista se renderiza con datos mockeados | @testing-library/react + mock de hook |
| Component | `ExpenseForm.tsx` — dropdown de pharmacies carga correctamente | Idem |

## Migration / Rollout

1. **Deploy individual**: Cada fix es independiente — se puede deployar por separado
2. **Rollback plan**: git revert de commits individuales
3. **Índice**: Crear en segundo plano con `expireAfterSeconds: 0` (no bloqueante en MongoDB)
4. **React Query**: No rompe funcionalidad existente — el provider envuelve todo sin afectar componentes que no lo usan

## Open Questions

- [ ] `batch-return` no estaba en el proposal original pero tiene el mismo patrón N+1 — incluir? ✅ incluido
- [ ] La página `page.tsx` tiene lógica de paginación/filtros acoplada a useState — la migración a React Query requiere mantener ese estado local o delegarlo a la URL (searchParams)? Se mantiene estado local para minimizar cambios.
