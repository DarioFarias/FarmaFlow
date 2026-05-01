# Proposal: Optimización de Queries de Base de Datos en Métricas

## Intent

El endpoint `/api/admin/pharmacies/metrics` ejecuta **7 queries separadas a MongoDB** por cada solicitud, causando tiempos de respuesta lentos (2-5s) y degrade de experiencia para supervisores/admin al cargar el dashboard. Se requiere optimizar las queries y añadir índices faltantes.

## Scope

### In Scope
- Consolidar 7 queries a 2-3 queries usando `$facet` o pipeline combinado
- Añadir índices compuestos en SupplyRequest y Expense para queries de métricas
- Añadir índice en User.assignedPharmacies
- Implementar cache en memoria con TTL (30s) para métricas
- Medir mejora con logging de tiempo de ejecución

### Out of Scope
- Migración a otra base de datos
- Reescribir el modelo de datos
- Optimización de otras rutas API

## Capabilities

### New Capabilities
- `<metrics-cache>`: Sistema de cache en memoria con TTL para endpoint de métricas

### Modified Capabilities
- `dashboard.md`: REQ-003可能要actualizar con tiempos de respuesta máximos (<500ms)

## Approach

1. **Consolidar queries con $facet**: Unir las 4 aggregate queries (pending supplies, pending expenses, monthly expenses, delivered orders) en una sola con `$facet`
2. **Añadir índices compuestos**: Crear índices `(pharmacy, status)` y `(pharmacy, createdAt)` en SupplyRequest y Expense
3. **Cache con Map + TTL**: Implementar cache simple en memoria para evitar queries repetidas en ventana de 30 segundos

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/admin/pharmacies/metrics/route.ts` | Modified | Consolidar 7 queries a 2-3 queries |
| `src/models/SupplyRequest.ts` | Modified | Añadir índices compuestos |
| `src/models/Expense.ts` | Modified | Añadir índices compuestos |
| `src/models/User.ts` | Modified | Añadir índice en assignedPharmacies |
| `src/lib/` (nuevo) | New | Módulo de cache para métricas |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking existing queries con nuevo índice | Low |Verificar en dev que queries existentessiguen funccionando |
| Cache con datos stale | Medium | TTL corto (30s) y invalidación manual si hay mutations |
| memory leak en cache | Low | Usar WeakMap o limpiar explícitamente |

## Rollback Plan

1. Revertir cambios en `metrics/route.ts` a versión anterior
2. Eliminar índices añadidos: `db.supplyrequests.dropIndex('pharmacy_status_idx')`, etc.
3. Comentar/eliminar import del módulo de cache

## Dependencies

- Ninguna dependencia externa nueva

## Success Criteria

- [ ] Tiempo de respuesta metrics < 500ms con 100 pharmacies (antes: 2-5s)
- [ ] Reducción de 7 queries a 2-3 por request
- [ ] Tests pasan con `npm test`
- [ ] Cobertura no disminuye