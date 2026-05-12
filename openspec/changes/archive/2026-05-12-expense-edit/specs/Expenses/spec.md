# Delta for Expenses — Expense Edit Flow

## ADDED Requirements

### Requirement: Frontend MUST provide edit route for own expenses

The system MUST expose `/dashboard/gastos/[id]/editar` that fetches the expense by ID and renders `ExpenseForm` in edit mode. The page SHALL use `GET /api/expenses/[id]` to retrieve the expense.

#### Scenario: Navigate to edit page for PENDIENTE_DE_FACTURAR

- GIVEN a VENDEDOR assigned to pharmacy "A" with an expense in `PENDIENTE_DE_FACTURAR`
- WHEN the user navigates to `/dashboard/gastos/{expenseId}/editar`
- THEN the page loads the expense data and renders the form with the "Actualizar Gasto" button

#### Scenario: Navigate to edit page for FACTURADO

- GIVEN a VENDEDOR assigned to pharmacy "A" with an expense in `FACTURADO`
- WHEN the user navigates to `/dashboard/gastos/{expenseId}/editar`
- THEN the page loads and renders the form in edit mode with current status badge

### Requirement: Expense list MUST show "Editar" for editable states

The expense list `gastos/page.tsx` MUST render an "Editar" link per row when the expense status is `PENDIENTE_DE_FACTURAR` or `FACTURADO`. For other states (`REPORTED`, `PENDIENTE_DE_PAGO`, `PAID`) the link MUST NOT appear.

#### Scenario: Edit button visible for PENDIENTE_DE_FACTURAR

- GIVEN an expense list containing one expense with status `PENDIENTE_DE_FACTURAR`
- WHEN the table renders
- THEN an "Editar" link is present for that row

#### Scenario: Edit button hidden for REPORTED

- GIVEN an expense list containing one expense with status `REPORTED`
- WHEN the table renders
- THEN no "Editar" link appears for that row

### Requirement: Submit in edit mode MUST call PATCH

When `ExpenseForm` is in edit mode (`expense` prop is provided), `onSubmit` MUST call `PATCH /api/expenses/{id}` instead of `POST /api/expenses`.

#### Scenario: Edit form submits via PATCH

- GIVEN the `ExpenseForm` rendered with an existing expense
- WHEN the user modifies the description and clicks "Actualizar Gasto"
- THEN the form sends a `PATCH` request to `/api/expenses/{expenseId}`
- AND the user is redirected to `/dashboard/gastos` on success

#### Scenario: Edit resets status to PENDIENTE_DE_FACTURAR + wasModified

- GIVEN an expense with status `FACTURADO` and existing `pdfUrl`/`xmlUrl`
- WHEN the user edits and submits a new PDF/XML
- THEN the PATCH body includes the new files
- AND the backend resets status to `PENDIENTE_DE_FACTURAR` with `wasModified=true`

### Requirement: Non-owner MUST receive 403 on edit

The edit page SHALL rely on backend enforcement. If `GET /api/expenses/[id]` returns 403 (non-owner), the page MUST show an error message and not render the form.

#### Scenario: Non-owner sees 403 error on edit page

- GIVEN a VENDEDOR assigned to pharmacy "B"
- WHEN navigating to `/dashboard/gastos/{expenseId}/editar` where the expense belongs to pharmacy "A"
- THEN the page displays "Acceso denegado" or redirects to `/dashboard/gastos`
