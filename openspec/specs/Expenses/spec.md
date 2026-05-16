# Especificaciones: Expenses Module

> Este spec fue creado a partir del delta spec del cambio `fix-gastos-bugs`.
> Archivo original: `openspec/changes/archive/2026-05-12-fix-gastos-bugs/spec.md`
> Secciones de Edit Flow agregadas desde el cambio `expense-edit`:

## Auth Domain

### Requirement: isAdmin() MUST include SUPERVISOR

`isAdmin()` in `src/lib/roles.ts` MUST return `true` for `SUPERVISOR` role in addition to `ADMIN`. The frontend already treats SUPERVISOR as admin — the backend MUST match.

#### Scenario: SUPERVISOR recognized as admin

- GIVEN a user with role `SUPERVISOR`
- WHEN `isAdmin(user)` is called
- THEN it returns `true`

#### Scenario: VENDEDOR not recognized as admin

- GIVEN a user with role `VENDEDOR`
- WHEN `isAdmin(user)` is called
- THEN it returns `false`

### Requirement: Tests MUST mock isAdmin() matching production

Test mocks of `isAdmin()` MUST use the same role set as production (include `SUPERVISOR`). Tests that exercise admin-gated routes SHALL reflect real behavior.

#### Scenario: Admin test passes with SUPERVISOR

- GIVEN a test mocking `isAdmin` with a SUPERVISOR user
- WHEN the test exercises an admin-gated expense route
- THEN the route authorizes the request (same as production)

---

## API Domain

### Requirement: GET /api/expenses MUST filter by pharmacy for non-admin

For roles `VENDEDOR` and `ENCARGADO`, the endpoint MUST filter expenses to only those matching `user.pharmacy`. The query param `pharmacyId` MUST be ignored for non-admin roles.

#### Scenario: VENDEDOR sees only own pharmacy

- GIVEN an authenticated VENDEDOR assigned to pharmacy "A"
- WHEN GET /api/expenses is called
- THEN the response includes only expenses where `pharmacy` equals pharmacy "A"

#### Scenario: Query param ignored for non-admin

- GIVEN an authenticated VENDEDOR assigned to pharmacy "A"
- WHEN GET /api/expenses?pharmacyId=B is called
- THEN the response still filters by pharmacy "A"

### Requirement: SUPERVISOR MUST NOT bypass pharmacy filter via query param

For `SUPERVISOR` role, the `pharmacyId` query param SHALL be accepted (to filter specific pharmacy). For non-admin roles (VENDEDOR, ENCARGADO), the query param MUST be stripped and overwritten by `user.pharmacy`.

#### Scenario: Supervisor can filter by pharmacy

- GIVEN an authenticated SUPERVISOR
- WHEN GET /api/expenses?pharmacyId=A is called
- THEN the response includes only expenses from pharmacy "A"

### Requirement: GET /api/expenses/[id] MUST compare pharmacy ObjectId correctly

The comparison MUST check `expense.pharmacy` against `user.pharmacy` (both ObjectId), NOT against `user._id`.

#### Scenario: Owner can fetch own expense

- GIVEN an expense owned by pharmacy "A", and a VENDEDOR assigned to pharmacy "A"
- WHEN GET /api/expenses/{expenseId} is called
- THEN the endpoint returns the expense (200)

#### Scenario: Non-owner receives 403

- GIVEN an expense owned by pharmacy "A", and a VENDEDOR assigned to pharmacy "B"
- WHEN GET /api/expenses/{expenseId} is called
- THEN the endpoint returns 403

### Requirement: PATCH /api/expenses/[id] MUST enforce ownership

The endpoint MUST reject updates to expenses where the user is not admin AND `expense.pharmacy !== user.pharmacy`.

#### Scenario: Owner can update own expense

- GIVEN an expense owned by pharmacy "A", and a VENDEDOR assigned to pharmacy "A"
- WHEN PATCH /api/expenses/{expenseId} is called with valid body
- THEN the endpoint updates the expense (200)

#### Scenario: Non-owner update rejected

- GIVEN an expense owned by pharmacy "A", and a VENDEDOR assigned to pharmacy "B"
- WHEN PATCH /api/expenses/{expenseId} is called
- THEN the endpoint returns 403

### Requirement: Date filter MUST accept YYYY-MM-DD

The `startDate` and `endDate` query params MUST accept `YYYY-MM-DD` format. Using `z.string().datetime()` SHALL be replaced with `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)` or equivalent.

#### Scenario: Valid date filter accepted

- GIVEN an authenticated user
- WHEN GET /api/expenses?startDate=2026-01-15&endDate=2026-03-20 is called
- THEN the endpoint returns expenses within that range (200)

#### Scenario: Invalid date returns 400

- GIVEN an authenticated user
- WHEN GET /api/expenses?startDate=not-a-date is called
- THEN the endpoint returns 400

---

## Data Domain

### Requirement: Expense model MUST NOT conflict with Document.isModified

The custom `isModified()` function in `Expense.ts` MUST be renamed to avoid shadowing `Mongoose.Document.isModified()`.

#### Scenario: Mongoose isModified works after rename

- GIVEN an Expense document with a renamed custom function (e.g. `wasModified`)
- WHEN `doc.isModified('status')` is called (Mongoose built-in)
- THEN it returns the correct boolean without interference

### Requirement: Operaciones batch DEBEN usar endpoint unificado

(Todos los requisitos batch fueron reemplazados: antes usaban rutas separadas con un helper compartido)

Los módulos de gastos DEBEN canalizar todas las operaciones batch (approve, report, return) a través de `POST /api/expenses/batch` con `{ action, expenseIds, period?, notes? }`. Las rutas antiguas (`batch-approve`, `batch-report`, `batch-return`) existen como wrappers delgados para compatibilidad. El schema de Expense DEBE definir las transiciones válidas en un solo lugar.

#### Scenario: Approve vía endpoint unificado

- DADO un gasto en estado `PENDIENTE_DE_FACTURAR` con pdfUrl y xmlUrl válidos
- CUANDO se ejecuta la acción approve a través del endpoint unificado
- ENTONCES el gasto transiciona a `FACTURADO`

#### Scenario: Report vía endpoint unificado

- DADO un gasto en estado `FACTURADO`
- CUANDO se ejecuta la acción report a través del endpoint unificado con `period`
- ENTONCES el gasto transiciona a `REPORTED`

#### Scenario: Transición duplicada rechazada

- DADO un gasto que ya está en estado `REPORTED`
- CUANDO se ejecuta una acción batch que intenta approve ese gasto
- ENTONCES el resultado incluye un fallo para ese gasto sin arrojar error global

### Requirement: expenseNumber hook MUST use receiptDate, not current year

The `pre('save')` hook that generates `expenseNumber` MUST derive the year from `receiptDate`, not `new Date().getFullYear()`.

#### Scenario: Future receipt uses receipt year

- GIVEN an expense with `receiptDate = 2027-06-01` created in 2026
- WHEN the expense is saved
- THEN `expenseNumber` contains "2027" (from receiptDate), not "2026"

#### Scenario: Past receipt uses receipt year

- GIVEN an expense with `receiptDate = 2024-12-31` created in 2026
- WHEN the expense is saved
- THEN `expenseNumber` contains "2024" (from receiptDate)

---

## Edit Flow Domain

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

---

## POST & Status Domain

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

Admin users MUST be able to transition an expense from `FACTURADO` back to `PENDIENTE_DE_FACTURAR`. Non-admin users SHALL receive 403 for any PATCH on `FACTURADO` expenses.

#### Scenario: Admin undoes approval

- GIVEN an admin user and an expense with status `FACTURADO`
- WHEN PATCH /api/expenses/{id} is called with `status: PENDIENTE_DE_FACTURAR`
- THEN the expense transitions to `PENDIENTE_DE_FACTURAR` with `wasModified=true` (200)

#### Scenario: Non-admin PATCH on FACTURADO blocked

- GIVEN a non-admin user and an expense with status `FACTURADO`
- WHEN PATCH /api/expenses/{id} is called with any body
- THEN the endpoint returns 403

### Requirement: PATCH MUST enforce ownership AND status guard

The endpoint MUST reject updates where the user is not admin AND `expense.pharmacy !== user.pharmacy`. Additionally, when `expense.status >= FACTURADO`, non-admin PATCH field updates MUST return 403.

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

#### Scenario: Edit form submits via PATCH

- GIVEN `ExpenseForm` rendered with an existing `PENDIENTE_DE_FACTURAR` expense
- WHEN the user modifies fields and clicks "Actualizar Gasto"
- THEN the form sends PATCH to `/api/expenses/{id}`
- AND redirects to `/dashboard/gastos` on success

#### Scenario: Edit with files stays PENDIENTE_DE_FACTURAR

- GIVEN an expense with status `PENDIENTE_DE_FACTURAR` and new pdfUrl/xmlUrl files
- WHEN the user edits and submits
- THEN the expense status stays `PENDIENTE_DE_FACTURAR` (no auto-promotion to FACTURADO)

### Requirement: BatchActionToolbar MUST fix PENDIENTE_DE_PAGO mapping

The `BatchActionToolbar` MUST map each status to the correct batch action label. `PENDIENTE_DE_PAGO` MUST NOT map to "validate" or approve-related actions.

#### Scenario: PENDIENTE_DE_PAGO labeled correctly

- GIVEN a batch including an expense with status `PENDIENTE_DE_PAGO`
- WHEN the toolbar renders
- THEN the expense shows a payment-related label (not "validate")

---

## Presentation Domain

### Requirement: Responsive List — Cards in mobile, table in desktop

The expense list MUST render as cards on viewports < 768px and as the existing table on viewports >= 768px. Each card SHALL display expenseNumber, date, description, amount, status, and actions.

#### Scenario: Cards in mobile viewport

- GIVEN a viewport of 375px AND expenses in the list
- WHEN the page renders
- THEN each expense displays as a card with expenseNumber, fecha, descripción, monto, estado, and acciones

#### Scenario: Table in desktop viewport

- GIVEN a viewport of 1024px AND expenses in the list
- WHEN the page renders
- THEN the existing table renders unchanged

#### Scenario: Card checkbox selection

- GIVEN a viewport of 375px
- WHEN a card checkbox is selected
- THEN the expense ID is added to selectedIds

#### Scenario: Toggle select all with cards

- GIVEN a viewport of 375px AND expenses visible as cards
- WHEN toggleSelectAll is called
- THEN all card checkboxes toggle on/off accordingly

### Requirement: Responsive Filters — Collapsible on mobile

Filters MUST be hidden on viewports < 768px with a "Filtros" toggle button to show them. On viewports >= 768px, filters SHALL remain visible without a toggle.

#### Scenario: Filters hidden on mobile load

- GIVEN a viewport of 375px
- WHEN the page loads
- THEN filters are hidden AND a "Filtros" button is visible

#### Scenario: Toggle reveals filters

- GIVEN a viewport of 375px AND filters hidden
- WHEN the user clicks "Filtros"
- THEN filters are displayed

#### Scenario: Filters visible on desktop

- GIVEN a viewport of 1024px
- WHEN the page loads
- THEN filters are visible with no toggle button

### Requirement: Responsive BatchActionToolbar — No horizontal overflow

The BatchActionToolbar width MUST NOT exceed the viewport width on mobile. Long action labels SHALL NOT cause overflow.

#### Scenario: Toolbar constrained to viewport

- GIVEN a viewport of 375px AND 5 expenses selected
- WHEN the toolbar renders
- THEN the toolbar width ≤ 375px

#### Scenario: Long label does not overflow

- GIVEN the toolbar on mobile AND the action label is "Reportar a Contabilidad"
- WHEN the toolbar renders
- THEN the text does not overflow horizontally

### Requirement: Responsive Upload Area — Variable aspect-ratio

The image upload area MUST use aspect-video on viewports < 768px and aspect-[3/4] on viewports >= 768px.

#### Scenario: Mobile upload aspect-ratio

- GIVEN a viewport of 375px
- WHEN the image upload renders
- THEN it uses aspect-video (wide ratio)

#### Scenario: Desktop upload aspect-ratio

- GIVEN a viewport of 1024px
- WHEN the image upload renders
- THEN it uses aspect-[3/4] (current desktop behavior)

### Requirement: Correct Test Mock Dependencies

Tests in page.test.tsx MUST mock the correct dependencies — fetch() and useSession() — and MUST NOT mock useExpenses, which the page does not import.

#### Scenario: Tests mock fetch, not useExpenses

- GIVEN page.test.tsx
- WHEN tests execute
- THEN they mock fetch() directly (as gastos-page-v2.test.tsx does)
- AND they do NOT mock useExpenses
