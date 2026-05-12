# Especificaciones: Expenses Module

> Este spec fue creado a partir del delta spec del cambio `fix-gastos-bugs`.
> Archivo original: `openspec/changes/archive/2026-05-12-fix-gastos-bugs/spec.md`

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

### Requirement: batch-approve and batch-report MUST use shared helper

Both endpoints MUST deduplicate transition logic into a shared helper for status changes. The expense schema SHALL define valid transitions in one place.

#### Scenario: Approved expense can be reported

- GIVEN an expense with status `approved`
- WHEN batch-report is called
- THEN the expense transitions to `reported`

#### Scenario: Duplicate transition rejected

- GIVEN an expense already with status `reported`
- WHEN batch-report is called
- THEN the endpoint returns 400 for that expense

### Requirement: batch-return naming MUST match action semantics

The endpoint name and route SHALL clearly indicate the action. If the operation returns expenses to a previous status, the route MUST NOT use vague naming that suggests approval or reporting.

#### Scenario: Naming reflects return action

- GIVEN the expense API routes
- WHEN listing expense batch operations
- THEN each route name clearly matches its semantic action (return vs approve vs report)

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
