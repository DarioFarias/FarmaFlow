# Design: expense-module-v2 - Expense Module Upgrade

## Technical Approach

Implementar un sistema simplificado de 5 estados para gastos, eliminando categorías obligatorias y cambiando el almacenamiento de facturas de la base de datos a Cloudinary. La arquitectura sigue el patrón existente: modelo Mongoose → API route Next.js → componentes React.

## Architecture Decisions

### Decision: Cloudinary para PDF y XML
**Choice**: Almacenar solo URLs y publicIds de Cloudinary, no binary en MongoDB
**Rationale**: Cloudinary ya está integrado. PDF/XML son documentos pero Cloudinary soporta raw upload.

### Decision: Estado inicial según presencia de invoice
**Choice**: Sin invoice → PENDIENTE_DE_FACTURAR; con invoice → FACTURADO
**Rationale**: Reduce fricción operativa.

### Decision: Period grouping manual
**Choice**: Supervisor define nombre y rango al reportar batch
**Rationale**: Flexibilidad para períodos irregulares.

### Decision: Edición pre-REPORTED
**Choice**: Pharmacy edita en PENDIENTE_DE_FACTURAR/FACTURADO → isModified=true
**Rationale**: Una vez reportado, está en contabilidad.

### Decision: Batch filtradas por pharmacy
**Choice**: Supervisor selecciona pharmacy primero
**Rationale**: 70 farmacias, riesgo de error en selección mixta.

## Data Flow

POST /api/expenses → PENDIENTE_DE_FACTURAR (no invoice) o FACTURADO (with invoice)
PATCH /api/expenses/[id] → pharmacy edit resets to PENDIENTE_DE_FACTURAR + isModified
POST /api/expenses/batch-report → REPORTED + periodId, reportedBy, reportedAt
POST /api/expenses/batch-return → PENDIENTE_DE_PAGO
POST /api/expenses/batch-paid → PAID + paidAt

## File Changes

| File | Action | Description |
|------|--------|-------------|
| src/types/index.ts | Modify | ExpenseStatus (5 values), remove category/vendor, add IPeriod |
| src/models/Expense.ts | Modify | Add invoice fields, isModified, period, reportedBy/At, paidAt |
| src/models/Period.ts | Create | New model for period grouping |
| src/lib/validations.ts | Modify | Updated schemas, batch operation schemas |
| src/lib/cloudinary.ts | Modify | Add uploadInvoiceDocument for PDF/XML |
| src/app/api/expenses/route.ts | Modify | Filters, pagination, new status logic |
| src/app/api/expenses/[id]/route.ts | Modify | PATCH with state machine |
| src/app/api/expenses/batch-approve/route.ts | Create | Batch approve |
| src/app/api/expenses/batch-report/route.ts | Create | Batch report |
| src/app/api/expenses/batch-return/route.ts | Create | Batch return |
| src/api/periods/route.ts | Create | Period CRUD |
| src/app/dashboard/gastos/page.tsx | Modify | Filters, batch selection, period column |
| src/app/dashboard/gastos/ExpenseForm.tsx | Modify | Remove category, add PDF/XML upload |
| src/components/expenses/BatchActionToolbar.tsx | Create | Toolbar for selected expenses |

## Testing Strategy
- Unit: State machine transitions, validation schemas
- Integration: API endpoints with real DB
- Key scenarios: create without/with invoice, edit pre-REPORTED, edit REPORTED blocked, batch operations, state transitions

## Migration / Rollback
- Map: PENDING→PENDIENTE_DE_FACTURAR, REVIEWED→PENDIENTE_DE_FACTURAR, APPROVED→REPORTED, DISPUTED→PENDIENTE_DE_PAGO
- Rollback: revert enum, restore model, migration script to revert