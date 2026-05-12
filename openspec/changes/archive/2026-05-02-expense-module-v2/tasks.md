# Tasks: expense-module-v2 - Expense Module Upgrade

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~3000+ |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Delivery strategy | Single PR (multi-phase) |

## Phase 1: Types & Schema Updates (Foundation)
- [ ] 1.1 Update ExpenseStatus enum from 4 to 5 states
- [ ] 1.2 Add Period type and IPeriodReference interface
- [ ] 1.3 Update IExpense interface with new fields (pdfUrl, pdfPublicId, xmlUrl, xmlPublicId, isModified, period)
- [ ] 1.4 Update ExpenseSchema in models/Expense.ts

## Phase 2: Backend API Updates
- [ ] 2.1 Update validations.ts with new schemas
- [ ] 2.2 Update POST /api/expenses with initial status logic
- [ ] 2.3 Update GET /api/expenses with filters (period, status, dateRange)
- [ ] 2.4 Update PATCH /api/expenses/[id] with status transitions + pharmacy edit
- [ ] 2.5 Create POST /api/expenses/batch-approve
- [ ] 2.6 Create POST /api/expenses/batch-report
- [ ] 2.7 Create POST /api/expenses/batch-return

## Phase 3: Frontend UI Updates
- [ ] 3.1 Update ExpenseForm.tsx: remove category/vendor, add invoice upload
- [ ] 3.2 Update GastosPage.tsx: filters, pagination, batch selection
- [ ] 3.3 Create PeriodSelector component
- [ ] 3.4 Create BatchActionToolbar component
- [ ] 3.5 Update api-responses.ts with new types

## Phase 4: Testing
- [ ] 4.1 Update validations tests for new schema
- [ ] 4.2 Update API tests for new fields
- [ ] 4.3 Add batch operations tests
- [ ] 4.4 Add state transition tests

## Phase 5: Cleanup & Migration
- [ ] 5.1 Data migration script for existing expenses
- [ ] 5.2 Remove deprecated code (category, vendor, old status references)

## Dependencies
- Phase 1 → Phase 2 (API needs types)
- Phase 2 → Phase 3 (UI uses API)
- Phase 4 can run parallel to Phase 2-3 after types are ready
- Phase 5 runs last