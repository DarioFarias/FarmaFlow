# Proposal: expense-module-v2 - Expense Module Upgrade

## Intent

Simplificar y optimizar el flujo de gastos en FarmaFlow. El sistema actual tiene 7 estados y categorías obligatorias que no se alinean con el flujo real de trabajo de las farmacias. El objetivo es reducir la fricción operativa: las farmacias cargan gastos, adjuntan facturas (PDF+XML), el supervisor valida y reporta, y la farmacia confirma el pago. Solo 5 estados, sin categorías, y con operaciones por lotes para eficiencia del supervisor.

## Scope

### In Scope
- Redefinir estados: PENDIENTE_DE_FACTURAR → FACTURADO → REPORTED → PENDING_PAYMENT → PAID
- Eliminar ExpenseCategory, usar solo description como texto libre
- Crear/editar gasto con factura adjunta en un paso (directo a FACTURADO)
- Editor de gastos por farmacia (mientras no esté en REPORTED, con flag MODIFIED)
- Operaciones por lotes: validar, reportar, devolver múltiples gastos simultáneamente
- Grouping por período (March 2026, Q1 2026) para auditoría
- Upload/download de PDF + XML por gasto
- Notas opcionales en cada transición de estado
- Dashboard de supervisor: pendientes de facturar, pendientes de reportar, totales por farmacia y global

### Out of Scope
- Integración con sistema contable externo (solo grouping visual)
- Notificaciones automáticas (email/push)
- Histórico de cambios completo (audit trail)
- Export a Excel/CSV de los reportes

## Capabilities

### New Capabilities
- `expense-invoice-upload`: Upload de PDF + XML con download
- `expense-batch-operations`: Validar/reportar/devolver múltiples gastos
- `expense-period-grouping`: Agrupar gastos reportados por período
- `expense-supervisor-dashboard`: Vistas y métricas para supervisor

### Modified Capabilities
- `expense-crud`: Cambios en estados (5 estados), sin categoría, con edición

## Approach

1. **Migración de datos**: Script de migración para mapear estados actuales a nuevos estados (PENDING→PENDIENTE_DE_FACTURAR, APPROVED→REPORTED, DISPUTED→PENDING_PAYMENT)
2. **API Layer**: Actualizar ExpenseStatus enum, nuevo endpoint PATCH con transiciones validadas, nuevos endpoints para batch
3. **Model**: Agregar campos: invoicePdfUrl, invoiceXmlUrl, period, notes, modifiedFlag, modifiedAt
4. **Frontend**: New edit modal, batch selection UI, period grouping en tabla, dashboard cards
5. **Tests**: Actualizar 7 tests existentes + nuevos para batch y period grouping

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/types/index.ts` | Modified | Nuevo ExpenseStatus enum (5 estados), quitar ExpenseCategory |
| `src/models/Expense.ts` | Modified | Agregar campos invoice, period, notes, modifiedFlag |
| `src/lib/validations.ts` | Modified | Actualizar schemas, quitar category |
| `src/app/api/expenses/route.ts` | Modified | Nuevos endpoints batch, transiciones de estado |
| `src/tests/api/expenses.test.ts` | Modified | Actualizar tests existentes + nuevos |
| `src/components/admin/expenses/*` | New/Modified | Edit modal, batch UI, dashboard |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Migración de estados masiva | High | Script con dry-run, backup de datos antes |
| Pérdida de categorías históricas | Medium | Guardar en description como prefijo si es necesario |
| Cambios rompen tests existentes | High | Actualizar todos los tests antes de implementar |

## Rollback Plan

1. Revertir cambio de enum en types/index.ts
2. Restaurar modelo original desde git
3. Revertir migrations: script para revertir estados a valores originales
4. Todos los cambios son backwards-compatible si se mantiene el campo category como opcional en DB

## Success Criteria

- [ ] Los 5 nuevos estados funcionan correctamente en el flujo completo
- [ ] Upload de PDF+XML funciona y se puede descargar
- [ ] Batch operations permiten operar sobre múltiples gastos
- [ ] Period grouping muestra gastos agrupados correctamente
- [ ] Dashboard de supervisor muestra métricas correctas
- [ ] Todos los tests pasan (actualizados + nuevos)
- [ ] Migración de datos exitosa con datos de prueba

## Questions for User

1. ¿Cómo manejamos los gastos existentes con categorías? ¿Se migra el category al description o se pierde?
2. ¿El campo "vendor" (proveedor) se mantiene o se elimina también?
3. ¿El periodo grouping es por mes calendario o por trimestre fiscal?
4. ¿Cuántos gastos como máximo estiman manejar por lote (batch)?
