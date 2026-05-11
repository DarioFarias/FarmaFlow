# Tasks: Optimizar Performance del Módulo de Gastos

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~450-600 |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR (size:exception accepted) |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | All 4 fixes in one PR | PR 1 | Maintainer accepted size:exception |

## Phase 1: Foundation

- [x] 1.1 Install `@tanstack/react-query` in `package.json`
- [x] 1.2 Create `src/lib/ttl-cache.ts` with generic `TTLCache<T>` class (set, get, invalidate, clear, TTL expiry)
- [x] 1.3 Refactor `src/lib/metrics-cache.ts` to re-export from `ttl-cache.ts` (backward compat)
- [x] 1.4 Wrap `src/components/Providers.tsx` with `QueryClientProvider`

## Phase 2: Backend Performance Fixes

- [x] 2.1 Add compound index `{pharmacy: 1, status: 1, createdAt: -1}` to `src/models/Expense.ts`
- [x] 2.2 Add TTL cache for Pharmacy query (L215-229) in `src/app/api/expenses/route.ts`
- [x] 2.3 Convert `batch-approve/route.ts` to `find({$in})` + `bulkWrite`
- [x] 2.4 Convert `batch-report/route.ts` to `find({$in})` + `bulkWrite`
- [x] 2.5 Convert `batch-return/route.ts` to `find({$in})` + `bulkWrite`

## Phase 3: Client-Side Caching

- [x] 3.1 Create `src/lib/hooks/use-expenses.ts` with TanStack React Query (staleTime 30s)
- [x] 3.2 Create `src/lib/hooks/use-my-pharmacies.ts` (staleTime 5min)
- [x] 3.3 Refactor `src/app/dashboard/gastos/page.tsx` to use `useExpenses()` hook
- [x] 3.4 Refactor `src/app/dashboard/gastos/ExpenseForm.tsx` to use `useMyPharmacies()` hook

## Phase 4: Testing

- [x] 4.1 Write unit tests for `TTLCache<T>`: set/get, TTL expiry (fake timers), invalidate, clear
- [x] 4.2 Write integration tests for batch-approve: valid batch, partial failure, empty request (REQ-PERF-002)
- [x] 4.3 Write integration tests for batch-report/batch-return: valid batch, partial failure (REQ-PERF-002)
- [x] 4.4 Write integration test for GET /api/expenses cache hit (REQ-PERF-001 scenarios 1-2)
- [x] 4.5 Write component test for page.tsx: renders list with mocked `useExpenses()` (REQ-PERF-003)
- [x] 4.6 Write component test for ExpenseForm.tsx: dropdown loads with `useMyPharmacies()` (REQ-PERF-003)
