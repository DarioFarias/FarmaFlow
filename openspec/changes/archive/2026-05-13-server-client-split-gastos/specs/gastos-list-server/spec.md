# gastos-list-server Specification

> Full spec for new capability introduced by `server-client-split-gastos`.

## Purpose

Server-side initial data fetch for the gastos list page. This capability ensures the page renders with SSR data on first paint and delegates interactivity to extracted client components.

## Requirements

### Requirement: Server Component fetches initial data

`page.tsx` MUST remove `'use client'`, use `getServerSession(authOptions)`, and fetch initial expenses server-side via the internal API. It MUST pass `initialGastos`, `initialPagination`, `userRole`, and `pharmacies` to `GastosListClient`.

#### Scenario: Server renders with initial data

- GIVEN a valid session
- WHEN `page.tsx` renders as a Server Component
- THEN it calls `getServerSession` and fetches `/api/expenses` internally
- AND renders `GastosListClient` with the fetched data, no loading spinner on first paint

#### Scenario: Server passes role and pharmacies

- GIVEN a session with user role ADMIN
- WHEN the page renders
- THEN `userRole` and `pharmacies` are passed as props to `GastosListClient`

### Requirement: Server Component exports metadata

`page.tsx` MUST export `generateMetadata` returning appropriate title/metadata.

#### Scenario: Metadata for gastos page

- GIVEN the page is accessed
- WHEN `generateMetadata` is called
- THEN it returns a title for the gastos list page

### Requirement: GastosListClient manages interactive state

The Client Component MUST accept all initial data via props and manage filter, pagination, selection state, and AJAX fetches internally.

#### Scenario: Initial render with data

- GIVEN `GastosListClient` receives `initialGastos` with 10 items
- WHEN it renders
- THEN the data is displayed without any client-side fetch

#### Scenario: Filter change triggers AJAX

- GIVEN the user changes a filter and clicks "Aplicar"
- WHEN `applyFilters` fires
- THEN the component fetches `/api/expenses` with new params
- AND shows a loading state during the request

#### Scenario: Pagination click triggers AJAX

- GIVEN pagination on page 1 with data
- WHEN the user clicks next page
- THEN the component fetches `/api/expenses?page=2`
- AND updates the display

#### Scenario: Empty state after fetch

- GIVEN an AJAX fetch returns zero expenses
- WHEN the response is processed
- THEN "No hay gastos registrados" is displayed

### Requirement: GastosFilters is presentational

The component MUST receive filter values and `onChange` callbacks via props. It MUST NOT manage state or make API calls directly.

#### Scenario: Props-driven filter selection

- GIVEN `GastosFilters` receives `status`, `pharmacyId`, `fromDate`, `toDate` and callbacks
- WHEN the user selects a status
- THEN `onStatusChange` fires with the new value

#### Scenario: Mobile filter toggle

- GIVEN a viewport under 768px
- WHEN the component renders
- THEN filters are hidden with a "Filtros" toggle button

### Requirement: ExpenseTable renders desktop view

The component MUST render the table with checkbox column, expense data, status badges, pharmacy column for admin, edit links, and audit actions for admin.

#### Scenario: Admin sees pharmacy and audit columns

- GIVEN `userRole=ADMIN`
- WHEN `ExpenseTable` renders
- THEN pharmacy column and audit actions column appear

#### Scenario: VENDEDOR does not see pharmacy column

- GIVEN `userRole=VENDEDOR`
- WHEN `ExpenseTable` renders
- THEN no pharmacy column or audit actions appear

#### Scenario: Batch select all

- GIVEN a table with 5 expense rows
- WHEN the header checkbox is clicked
- THEN all row checkboxes toggle on/off

### Requirement: ExpenseCards renders mobile view

The component MUST render cards with checkboxes, expense info, and actions for viewports under 768px.

#### Scenario: Card with selection

- GIVEN a mobile viewport and 3 expenses
- WHEN `ExpenseCards` renders
- THEN each expense shows as a card with checkbox, details, and action links

### Requirement: GastosPagination is a shared component

The component MUST accept `page`, `total`, `totalPages`, and `onPageChange`. It MUST render prev/next buttons and page info.

#### Scenario: Pagination with multiple pages

- GIVEN `totalPages=5` and `page=2`
- WHEN `GastosPagination` renders
- THEN it shows page info and clickable prev/next buttons

## Test Requirements

- `page.test.tsx`: MUST verify that `GastosListClient` receives the expected props (`initialGastos`, `initialPagination`, `userRole`, `pharmacies`)
- `GastosListClient.test.tsx`: MUST test rendering with data, empty state, filter change triggers fetch, pagination triggers fetch, batch selection toggle, admin vs pharmacy role differences, and loading states during AJAX operations

## Out of Scope

- `ExpenseForm`, `nuevo/page.tsx`, `[id]/editar/page.tsx` — untouched
- URL params sync for filters — no state in URL
- `STATUS_CONFIG` extraction to shared file — remains inlined
- `BatchActionToolbar` and `AuditActions` — remain as existing components
- API route behavior — query logic unchanged
