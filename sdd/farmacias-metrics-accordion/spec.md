# TDD Specifications: Farmacias Page con Métricas y Accordion

## Overview

This document contains detailed Test-Driven Development specifications for the "Farmacias Page con Métricas y Accordion" feature. Each specification follows the Given/When/Then format and includes test scenarios for verification.

## Prerequisites

- Backend endpoint `GET /api/admin/pharmacies/metrics` returns pharmacy data with:
  - `pharmacyName`, `address`, `phone`, `email`, `isActive`, `createdAt`
  - `pendingSupplyRequests` count (supply requests in REQUESTED/AUTHORIZED/SHIPPED status)
  - `pendingExpenses` count (expenses in PENDING status)
  - `assignedUsers` array with `{ name, email, role }`
  - `monthlySummary` with `{ totalExpenses, deliveredOrders, activeUsers, lastActivity }`

---

## 1. SEARCH

### Specification: Real-time search filtering by pharmacy name with debounce

**Scenario 1.1: Filter pharmacies by name - exact match**

- **Given**: User has pharmacy list loaded with at least "Farmacia Central" and "Farmacia Norte"
- **When**: User types "Central" in search input
- **Then**: Only pharmacy cards containing "Central" in pharmacyName are displayed
- **Then**: "Farmacia Norte" card is hidden from view
- **Then**: Results update after 300ms debounce delay

**Scenario 1.2: Filter pharmacies by name - partial match**

- **Given**: User has pharmacy list loaded with "Farmacia A", "Farmacia B", "Farmacia C"
- **When**: User types "Farmacia" in search input
- **Then**: All three pharmacy cards are displayed
- **Then**: Search is case-insensitive

**Scenario 1.3: Filter pharmacies by name - no results**

- **Given**: User has pharmacy list loaded
- **When**: User types "XYZNonExistent" in search input
- **Then**: Empty state message is displayed: "No se encontraron farmacias"
- **Then**: Clear search button appears

**Scenario 1.4: Clear search**

- **Given**: User has filtered results showing
- **When**: User clicks clear button (X) in search input
- **Then**: Search input is cleared
- **Then**: All pharmacies are displayed
- **Then**: Clear button disappears

---

## 2. STATUS FILTER

### Specification: Tab-based filter by pharmacy status

**Scenario 2.1: Filter by Active status**

- **Given**: User sees pharmacy list with mixed isActive=true and isActive=false
- **When**: User clicks "Activas" tab
- **Then**: Only pharmacies with isActive=true are displayed
- **Then**: Inactive pharmacies are hidden

**Scenario 2.2: Filter by Inactive status**

- **Given**: User sees pharmacy list with mixed isActive=true and isActive=false
- **When**: User clicks "Inactivas" tab
- **Then**: Only pharmacies with isActive=false are displayed
- **Then**: Active pharmacies are hidden

**Scenario 2.3: Show All pharmacies**

- **Given**: User has filtered by Active status
- **When**: User clicks "Todas" tab
- **Then**: All pharmacies (both active and inactive) are displayed

**Scenario 2.4: Combined search and filter**

- **Given**: User has pharmacy list loaded with active "Farmacia Central" and inactive "Farmacia Norte"
- **When**: User types "Central" in search and clicks "Activas" tab
- **Then**: Only "Farmacia Central" is displayed (matches search AND is active)
- **Then**: "Farmacia Norte" is hidden (inactive, doesn't match search)

---

## 3. SORTING

### Specification: Multi-criteria sorting for pharmacy list

**Scenario 3.1: Sort by Name A-Z**

- **Given**: User sees pharmacy list in default order
- **When**: User selects "Nombre A-Z" from sort dropdown
- **Then**: Pharmacies are sorted alphabetically ascending by pharmacyName
- **Then**: Order is: "Farmacia Alpha", "Farmacia Beta", "Farmacia Gamma"

**Scenario 3.2: Sort by Name Z-A**

- **Given**: User sees pharmacy list in default order
- **When**: User selects "Nombre Z-A" from sort dropdown
- **Then**: Pharmacies are sorted alphabetically descending by pharmacyName
- **Then**: Order is: "Farmacia Gamma", "Farmacia Beta", "Farmacia Alpha"

**Scenario 3.3: Sort by Most pending supply requests**

- **Given**: User sees pharmacy list with pendingSupplyRequests counts
- **When**: User selects "Más pedidos pendientes" from sort dropdown
- **Then**: Pharmacies are sorted by pendingSupplyRequests descending
- **Then**: Higher counts appear first

**Scenario 3.4: Sort by Most pending expenses**

- **Given**: User sees pharmacy list with pendingExpenses counts
- **When**: User selects "Más gastos pendientes" from sort dropdown
- **Then**: Pharmacies are sorted by pendingExpenses descending
- **Then**: Higher counts appear first

**Scenario 3.5: Sort by Recently updated**

- **Given**: User sees pharmacy list with createdAt dates
- **When**: User selects "Más recientes" from sort dropdown
- **Then**: Pharmacies are sorted by createdAt descending
- **Then**: Newest pharmacies appear first

**Scenario 3.6: Sort preserves filter and search**

- **Given**: User has filtered by "Activas" and searched "Central"
- **When**: User changes sort option
- **Then**: Filter and search criteria are preserved
- **Then**: Only active pharmacies matching "Central" are reordered

---

## 4. METRICS BADGES

### Specification: Color-coded pending counts on pharmacy cards

**Scenario 4.1: Green badge - zero pending**

- **Given**: Pharmacy has pendingSupplyRequests=0 and pendingExpenses=0
- **When**: Pharmacy card is rendered
- **Then**: Badge background color is green (#22c55e or similar)
- **Then**: Badge displays "0" for each metric
- **Then**: Green indicator appears for both supply requests and expenses

**Scenario 4.2: Yellow badge - 1-2 pending**

- **Given**: Pharmacy has pendingSupplyRequests=1 and pendingExpenses=2
- **When**: Pharmacy card is rendered
- **Then**: Badge background color is yellow (#eab308 or similar)
- **Then**: Badge displays "1" for supply requests, "2" for expenses

**Scenario 4.3: Orange badge - 3-5 pending**

- **Given**: Pharmacy has pendingSupplyRequests=4 and pendingExpenses=3
- **When**: Pharmacy card is rendered
- **Then**: Badge background color is orange (#f97316 or similar)
- **Then**: Badge displays "4" and "3" respectively

**Scenario 4.4: Red badge - 6+ pending**

- **Given**: Pharmacy has pendingSupplyRequests=8 and pendingExpenses=6
- **When**: Pharmacy card is rendered
- **Then**: Badge background color is red (#ef4444 or similar)
- **Then**: Badge displays "8" and "6" respectively

**Scenario 4.5: Mixed badge colors**

- **Given**: Pharmacy has pendingSupplyRequests=0 (green) and pendingExpenses=7 (red)
- **When**: Pharmacy card is rendered
- **Then**: Supply requests badge shows green with "0"
- **Then**: Expenses badge shows red with "7"

**Scenario 4.6: Badge labels**

- **Given**: Pharmacy card is displayed
- **When**: Card is rendered
- **Then**: Each badge has label "Pedidos" for pendingSupplyRequests
- **Then**: Each badge has label "Gastos" for pendingExpenses

---

## 5. ACCORDION EXPAND

### Specification: Expand pharmacy card to show details

**Scenario 5.1: Expand accordion**

- **Given**: User sees pharmacy card with "Ver más" button
- **When**: User clicks "Ver más" button
- **Then**: Accordion expands below the card
- **Then**: Assigned users list is displayed with names, emails, and roles
- **Then**: Monthly summary section is displayed
- **Then**: "Ver más" button changes to "Ocultar"

**Scenario 5.2: Show assigned users**

- **Given**: Pharmacy has 3 assigned users with roles
- **When**: Accordion is expanded
- **Then**: Each user is listed with format: "Name (Role)"
- **Then**: Example: "Juan Pérez (Supervisor)", "María García (Encargado)"

**Scenario 5.3: Show monthly summary**

- **Given**: Pharmacy has monthly summary data
- **When**: Accordion is expanded
- **Then**: Monthly summary displays: "Total Gastos: $X,XXX"
- **Then**: Monthly summary displays: "Pedidos Entregados: X"
- **Then**: Monthly summary displays: "Usuarios Activos: X"
- **Then**: Monthly summary displays: "Última Actividad: DD/MM/YYYY"

**Scenario 5.4: Multiple accordions independent**

- **Given**: User has multiple pharmacy cards
- **When**: User expands accordion on card A
- **Then**: Accordion on card B remains collapsed
- **Then**: Only one accordion is expanded at a time (or multiple can be open)

---

## 6. ACCORDION COLLAPSE

### Specification: Collapse expanded pharmacy card

**Scenario 6.1: Collapse accordion**

- **Given**: Accordion is expanded showing users and summary
- **When**: User clicks "Ocultar" button
- **Then**: Accordion collapses
- **Then**: Assigned users and monthly summary are hidden
- **Then**: "Ocultar" button changes back to "Ver más"

**Scenario 6.2: Collapse preserves state**

- **Given**: User expanded accordion, viewed content, then collapsed
- **When**: User expands same accordion again
- **Then**: All content (users and summary) is displayed again
- **Then**: State is restored correctly

---

## 7. RESPONSIVE GRID

### Specification: Grid adapts to screen width

**Scenario 7.1: Mobile view - single column**

- **Given**: User views page on mobile (< 640px)
- **When**: Screen width is less than 640px
- **Then**: Grid displays 1 column of pharmacy cards
- **Then**: Cards take full width

**Scenario 7.2: Tablet view - two columns**

- **Given**: User views page on tablet (640px - 1024px)
- **When**: Screen width is between 640px and 1024px
- **Then**: Grid displays 2 columns of pharmacy cards

**Scenario 7.3: Desktop view - three columns**

- **Given**: User views page on desktop (> 1024px)
- **When**: Screen width is greater than 1024px
- **Then**: Grid displays 3 columns of pharmacy cards

**Scenario 7.4: Responsive behavior on resize**

- **Given**: User is viewing on desktop with 3 columns
- **When**: User resizes window to tablet width
- **Then**: Grid immediately adjusts to 2 columns
- **Then**: No horizontal scroll appears

---

## 8. EDIT LINK

### Specification: Navigation to pharmacy edit page

**Scenario 8.1: Click Edit link**

- **Given**: User views pharmacy card with "Editar" link
- **When**: User clicks "Editar" link
- **Then**: Page navigates to `/dashboard/admin/farmacias/[id]/editar`
- **Then**: Edit form for that pharmacy is displayed

**Scenario 8.2: Edit page exists**

- **Given**: Pharmacy with ID exists in database
- **When**: User navigates to edit page
- **Then**: Form loads with existing pharmacy data populated
- **Then**: All fields are editable (pharmacyName, address, phone, email, isActive)

**Scenario 8.3: Edit page does not exist**

- **Given**: Edit page does not exist yet
- **When**: User clicks "Editar" link
- **Then**: New edit page is created at `/dashboard/admin/farmacias/[id]/editar`
- **Then**: Page renders with empty form or 404 if pharmacy doesn't exist

---

## API Contract Tests

### Metrics Endpoint

**Scenario API-1: Returns pharmacy with metrics**

- **Given**: Database has pharmacies with supply requests and expenses
- **When**: Client calls `GET /api/admin/pharmacies/metrics`
- **Then**: Response includes array of pharmacies with pendingSupplyRequests count
- **Then**: Response includes array of pharmacies with pendingExpenses count
- **Then**: Response includes assignedUsers array per pharmacy
- **Then**: Response includes monthlySummary object per pharmacy

**Scenario API-2: Supervisor sees only assigned pharmacies**

- **Given**: User is logged in as SUPERVISOR with assignedPharmacies
- **When**: Client calls `GET /api/admin/pharmacies/metrics`
- **Then**: Only pharmacies in assignedPharmacies are returned
- **Then**: Other pharmacies are not visible

**Scenario API-3: Filters apply to metrics**

- **Given**: Query parameters include ?isActive=true
- **When**: Client calls `GET /api/admin/pharmacies/metrics?isActive=true`
- **Then**: Only active pharmacies are returned with metrics
- **Then**: Inactive pharmacies are filtered out

---

## Implementation Checklist

| ID | Specification | Test File | Component |
|----|---------------|-----------|-----------|
| 1.1-1.4 | Search functionality | `pharmacy-search.test.tsx` | `FarmaciasPage` |
| 2.1-2.4 | Status filter | `pharmacy-filter.test.tsx` | `FarmaciasPage` |
| 3.1-3.6 | Sorting | `pharmacy-sort.test.tsx` | `FarmaciasPage` |
| 4.1-4.6 | Metrics badges | `pharmacy-metrics.test.tsx` | `PharmacyCard` |
| 5.1-5.4 | Accordion expand | `pharmacy-accordion.test.tsx` | `PharmacyAccordion` |
| 6.1-6.2 | Accordion collapse | `pharmacy-accordion.test.tsx` | `PharmacyAccordion` |
| 7.1-7.4 | Responsive grid | `responsive-grid.test.tsx` | `FarmaciasPage` |
| 8.1-8.3 | Edit link navigation | `pharmacy-edit.test.tsx` | `PharmacyCard` |
| API-1-3 | Metrics endpoint | `pharmacy-metrics-api.test.ts` | API Route |

---

## Notes

- Debounce time: 300ms for search input
- Color thresholds:
  - Green: 0 pending
  - Yellow: 1-2 pending
  - Orange: 3-5 pending
  - Red: 6+ pending
- Role-based filtering must be applied at API level
- All tests should use mock data for isolated unit testing
- Integration tests should verify actual API responses