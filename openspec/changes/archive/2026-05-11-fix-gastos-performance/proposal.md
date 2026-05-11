# Proposal: Optimizar Performance del Módulo de Gastos

## Intent

Resolver los problemas críticos de performance que generan tiempos de respuesta de ~6-7s en operaciones del módulo de gastos de FarmaFlow. Estos problemas impactan directamente la experiencia del usuario supervisor y administrativo.

## Scope

### In Scope
- **Fix N+1 Query en GET /api/expenses**: Eliminar query redundante a Pharmacy por cada request para usuarios SUPERVISOR
- **Fix Batch Operations**: Convertir operaciones iterativas (findById + findByIdAndUpdate por cada ID) a operaciones bulk
- **Add Client-Side Caching**: Implementar estrategia de cacheo en cliente para reducir llamadas repetitivas
- **Add Missing DB Index**: Crear índice compuesto `{pharmacy, status, createdAt}` en Expense

### Out of Scope
- Duplicación de STATUS_CONFIG (mejora menor, puede resolverse en refactor futuro)
- Cambios en modelo de autenticación o sesión
- Nuevas funcionalidades en el módulo

## Approach

### Fix 1: N+1 Query (Backend)
- **Problema**: Líneas 215-229 en `route.ts` — cada request GET de SUPERVISOR hace query a Pharmacy para obtener pharmacyIds activas
- **Solución**: Implementar in-memory cache con TTL de 1 minuto para resultados de Pharmacy.find({_id: $in})
- **Tradeoff**: Cache pequeño (solo IDs activos) con TTL corto para balance freshness/performance

### Fix 2: Batch Operations
- **Problema**: `batch-approve` y `batch-report` hacen 2 queries por cada gasto (findById + findByIdAndUpdate)
- **batch-approve**: Iteración secuencial con query individual
- **batch-report**: Iteración pero usa Promise.all para updates
- **Solución**: Usar una sola query con `$in` para obtener todos los documentos, validar en memoria, luego bulkWrite para updates
- **Tradeoff**: Más uso de memoria pero mucho menos round-trips a MongoDB

### Fix 3: Client-Side Caching
- **Problema**: Cada mount de componente hace fetch sin cache
- **Solución**: Usar React Query (TanStack Query) con staleTime de 30 segundos
- **Tradeoff**: Agrega dependencia, requiere setup de provider

### Fix 4: Missing Index
- **Problema**: Falta índice compuesto para query común `{pharmacy, status, createdAt}`
- **Solución**: Agregar en modelo: `ExpenseSchema.index({ pharmacy: 1, status: 1, createdAt: -1 })`
- **Tradeoff**: Index write overhead menor que el benefit de lectura

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/expenses/route.ts` | Modified | Fix N+1 query en líneas 215-229 |
| `src/app/api/expenses/batch-approve/route.ts` | Modified | Convertir a bulk operation |
| `src/app/api/expenses/batch-report/route.ts` | Modified | Convertir a bulk operation |
| `src/models/Expense.ts` | Modified | Agregar índice compuesto |
| `src/app/dashboard/gastos/page.tsx` | Modified | Agregar React Query provider |
| `src/app/dashboard/gastos/ExpenseForm.tsx` | Modified | Usar cache existente |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cache outdated (pharmacy desactivada mientras supervisor tiene acceso) | Low | TTL de 1 min limita window de inconsistency |
| Bulk operation falla parcialmente | Medium | Retornar resultados parciales con errores específicos |
| React Query introduce breaking changes | Low | Versión estable, mínima configuración |

## Rollback Plan

1. **N+1 Fix**: Revertir a query directa a Pharmacy — código original en git
2. **Batch Fix**: Restaurar loop iterativo con findById individual
3. **Client Fix**: Remover React Query, usar fetch directo como antes
4. **Index**: Eliminar índice del modelo (db.expenses.dropIndex())

## Dependencies

- TanStack Query v5 (npm install @tanstack/react-query) — para client-side caching
- No cambios en infraestructura existentes

## Success Criteria

- [ ] GET /api/expenses responde en <500ms para usuarios SUPERVISOR (sin cold start)
- [ ] Batch approve de 20 gastos hace ≤3 queries (no 40+)
- [ ] Navegación entre páginas no hace refetch innecesario
- [ ] Índice compuesto presente en db.getIndexes()
