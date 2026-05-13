# Delta for Expenses

## ADDED Requirements

### Requirement: POST MUST create expense as PENDIENTE_DE_FACTURAR

`POST /api/expenses` MUST always create expenses with status `PENDIENTE_DE_FACTURAR`, regardless of whether `pdfUrl` and `xmlUrl` are provided. Auto-promotion to `FACTURADO` MUST NOT occur.

#### Scenario: New expense without files

- GIVEN a valid expense payload without pdfUrl/xmlUrl
- WHEN POST /api/expenses is called
- THEN the expense is created with status `PENDIENTE_DE_FACTURAR`

#### Scenario: New expense with files remains PENDIENTE

- GIVEN a valid expense payload with pdfUrl AND xmlUrl
- WHEN POST /api/expenses is called
- THEN the expense is created with status `PENDIENTE_DE_FACTURAR` (NOT FACTURADO)

### Requirement: Admin MUST undo FACTURADO via PATCH status update

Admin users MUST be able to transition an expense from `FACTURADO` back to `PENDIENTE_DE_FACTURAR` with `wasModified=true`. Non-admin users SHALL receive 403 for any PATCH on `FACTURADO` expenses.

#### Scenario: Admin undoes approval

- GIVEN an admin user and an expense with status `FACTURADO`
- WHEN PATCH /api/expenses/{id} is called with `status: PENDIENTE_DE_FACTURAR`
- THEN the expense transitions to `PENDIENTE_DE_FACTURAR` with `wasModified=true` (200)

#### Scenario: Non-admin PATCH on FACTURADO blocked

- GIVEN a non-admin user and an expense with status `FACTURADO`
- WHEN PATCH /api/expenses/{id} is called with any body
- THEN the endpoint returns 403

### Requirement: BatchActionToolbar MUST fix PENDIENTE_DE_PAGO mapping

The `BatchActionToolbar` MUST map each status to the correct batch action label. `PENDIENTE_DE_PAGO` MUST NOT map to "validate" or approve-related actions.

#### Scenario: PENDIENTE_DE_PAGO labeled correctly

- GIVEN a batch including an expense with status `PENDIENTE_DE_PAGO`
- WHEN the toolbar renders
- THEN the expense shows a payment-related label (not "validate")

## MODIFIED Requirements

### Requirement: PATCH MUST enforce ownership AND status guard

The endpoint MUST reject updates where the user is not admin AND `expense.pharmacy !== user.pharmacy`. Additionally, when `expense.status >= FACTURADO`, non-admin PATCH field updates MUST return 403.
(Previously: ownership check only, no status guard)

#### Scenario: Owner can update own expense

- GIVEN an expense with status `PENDIENTE_DE_FACTURAR` owned by pharmacy "A", and a VENDEDOR assigned to pharmacy "A"
- WHEN PATCH /api/expenses/{id} is called with valid body
- THEN the endpoint returns 200

#### Scenario: Non-owner update rejected

- GIVEN an expense owned by pharmacy "A", and a VENDEDOR assigned to pharmacy "B"
- WHEN PATCH /api/expenses/{id} is called
- THEN the endpoint returns 403

#### Scenario: Status guard blocks FACTURADO field updates

- GIVEN a non-admin user and an expense with status `FACTURADO`
- WHEN PATCH /api/expenses/{id} is called with field updates
- THEN the endpoint returns 403

### Requirement: Edit button SHALL show only for PENDIENTE_DE_FACTURAR

The expense list MUST render an "Editar" link per row only when status is `PENDIENTE_DE_FACTURAR`. For `FACTURADO` and beyond (`REPORTED`, `PENDIENTE_DE_PAGO`, `PAID`) the link MUST NOT appear.
(Previously: Editar was visible for PENDIENTE_DE_FACTURAR and FACTURADO)

#### Scenario: Edit button visible for PENDIENTE_DE_FACTURAR

- GIVEN an expense list containing an expense with status `PENDIENTE_DE_FACTURAR`
- WHEN the table renders
- THEN an "Editar" link is present for that row

#### Scenario: Edit button hidden for FACTURADO

- GIVEN an expense list containing an expense with status `FACTURADO`
- WHEN the table renders
- THEN no "Editar" link appears for that row

#### Scenario: Edit button hidden for REPORTED

- GIVEN an expense list containing an expense with status `REPORTED`
- WHEN the table renders
- THEN no "Editar" link appears for that row

### Requirement: Edit page MUST show locked state for FACTURADO+

The edit page SHALL render the form only for `PENDIENTE_DE_FACTURAR` expenses. For `FACTURADO` or beyond, it MUST display a locked message and MUST NOT render the form.
(Previously: form rendered for both PENDIENTE_DE_FACTURAR and FACTURADO)

#### Scenario: Form renders for PENDIENTE_DE_FACTURAR

- GIVEN a user with an expense in `PENDIENTE_DE_FACTURAR`
- WHEN navigating to `/dashboard/gastos/{id}/editar`
- THEN the page renders the form with "Actualizar Gasto"

#### Scenario: Locked message for FACTURADO

- GIVEN a user with an expense in `FACTURADO`
- WHEN navigating to `/dashboard/gastos/{id}/editar`
- THEN the page shows "Este gasto ya fue aprobado"
- AND the form is NOT rendered

### Requirement: Submit in edit mode MUST call PATCH

When `ExpenseForm` is in edit mode (`expense` prop provided), `onSubmit` MUST call `PATCH /api/expenses/{id}`. Editing a `PENDIENTE_DE_FACTURAR` expense with new files MUST NOT auto-promote to `FACTURADO`.
(Previously: edit on FACTURADO reset status to PENDIENTE_DE_FACTURAR + wasModified)

#### Scenario: Edit form submits via PATCH

- GIVEN `ExpenseForm` rendered with an existing `PENDIENTE_DE_FACTURAR` expense
- WHEN the user modifies fields and clicks "Actualizar Gasto"
- THEN the form sends PATCH to `/api/expenses/{id}`
- AND redirects to `/dashboard/gastos` on success

#### Scenario: Edit with files stays PENDIENTE_DE_FACTURAR

- GIVEN an expense with status `PENDIENTE_DE_FACTURAR` and new pdfUrl/xmlUrl files
- WHEN the user edits and submits
- THEN the expense status stays `PENDIENTE_DE_FACTURAR` (no auto-promotion to FACTURADO)
