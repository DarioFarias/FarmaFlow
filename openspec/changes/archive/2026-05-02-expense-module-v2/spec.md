# Spec: expense-module-v2 - Expense Module Upgrade

## Domain: Expenses
## Type: Delta — new states, no categories, batch operations, invoice upload

## Data Model Changes

### New ExpenseStatus Enum (replaces old)
- PENDIENTE_DE_FACTURAR — expense created, authorized, no invoice
- FACTURADO — expense + PDF + XML attached
- REPORTED — supervisor validated and reported to accounting
- PENDIENTE_DE_PAGO — returned to pharmacy for payment
- PAID — pharmacy confirmed payment

### Removed Fields
- category: REMOVED (previously ExpenseCategory enum)
- vendor: REMOVED (comes from invoice now)

### Added Fields
- description: Free-text string (500 chars) — replaces category-based classification
- invoicePdfUrl: Optional string — uploaded PDF file URL
- invoiceXmlUrl: Optional string — uploaded XML file URL
- invoicePdfPublicId: Optional string — Cloudinary public ID for PDF
- invoiceXmlPublicId: Optional string — Cloudinary public ID for XML
- isModified: Boolean flag — set to true when pharmacy edits after initial creation
- periodId: Optional ObjectId reference to Period model
- periodName: Optional string — manual period name
- reportedBy: Optional ObjectId — user who reported the batch
- reportedAt: Optional Date — when batch was reported
- paidAt: Optional Date — when pharmacy confirmed payment

### New Period Model
- _id, name, startDate, endDate, createdBy, createdAt, expenseCount

## API Endpoints

- POST /api/expenses — Create expense (optionally with invoice files)
- GET /api/expenses — List with filters (status, pharmacyId, periodId, isModified, dateRange)
- GET /api/expenses/[id] — Get single expense
- PATCH /api/expenses/[id] — Update expense with status transitions
- POST /api/expenses/batch-approve — Batch approve expenses
- POST /api/expenses/batch-report — Batch report with period creation
- POST /api/expenses/batch-return — Batch return to pharmacy

## State Machine

Pharmacy transitions:
- PENDIENTE_DE_FACTURAR → FACTURADO (by uploading invoice)
- FACTURADO → PENDIENTE_DE_FACTURAR (by editing, resets)
- PENDIENTE_DE_PAGO → PAID (by confirming payment)

Supervisor transitions:
- FACTURADO → REPORTED (batch report)
- REPORTED → PENDIENTE_DE_PAGO (batch return to pharmacy)

## UI Components
1. ExpenseListPage — filters, pagination, batch selection, period column
2. ExpenseForm — no category dropdown, PDF+XML upload, status badge
3. BatchActionToolbar — appears on multi-select, context-aware actions
4. PeriodSelector — period filtering dropdown
5. ExpenseDetailModal — view with invoice preview

## Key Flows
1. Create expense → optionally attach invoice → PENDIENTE_DE_FACTURAR or FACTURADO
2. Edit expense (pharmacy, pre-REPORTED) → resets to PENDIENTE_DE_FACTURAR + isModified
3. Batch report (supervisor) → creates Period, moves to REPORTED
4. Batch return (accounting) → PENDIENTE_DE_PAGO
5. Confirm payment (pharmacy) → PAID

## Acceptance Criteria
1. 5 expense states as defined
2. No categories (removed from model and UI)
3. Create + invoice in one step
4. Pharmacy can edit while not REPORTED
5. Batch operations work for multi-select
6. Period grouping with manual naming
7. PDF/XML upload per expense
8. Migration path for existing data