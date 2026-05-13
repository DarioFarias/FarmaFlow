# Delta for Expenses

## ADDED Requirements

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
