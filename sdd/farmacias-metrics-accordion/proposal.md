# Proposal: Farmacias Page con Métricas y Accordion

## Intent

Enhance the Farmacias admin page with search, filtering, sorting, and metric cards. Currently the page shows basic pharmacy cards (name, address, phone, email, active status) with a broken edit link. Users cannot search, filter by status, or view any operational metrics. This change adds full search/filter/sort capabilities plus inline expandable accordions showing assigned users and monthly summaries with color-coded pending items indicators.

## Scope

### In Scope
- Search bar filtering pharmacies by name (client-side after initial load)
- Status filter tabs: All, Active, Inactive
- Sorting dropdown: Name A-Z, Name Z-A, Most pending supply requests, Most pending expenses, Recently updated
- Metrics badges on each card: pending supply requests count, pending expenses count
- Color-coded metrics: green (0), yellow (1-2), orange (3-5), red (6+)
- Expandable accordion per pharmacy showing assigned users with roles, monthly summary (total expenses, delivered orders, active users, last activity)
- Responsive grid: 1 column mobile, 2 columns tablet, 3 columns desktop
- Fix broken edit pharmacy link

### Out of Scope
- Pagination (deferred to future iteration)
- Export functionality
- Bulk actions
- Dashboard analytics page (separate change)

## Capabilities

### New Capabilities
- `pharmacy-search`: Real-time search filtering by pharmacy name
- `pharmacy-status-filter`: Tab-based filter by active/inactive status
- `pharmacy-sorting`: Multi-criteria sorting (name, pending orders, pending expenses, recency)
- `pharmacy-metrics-badge`: Color-coded pending counts on pharmacy cards
- `pharmacy-accordion`: Inline expandable section with users and monthly summary
- `pharmacy-list-metrics-api`: New backend endpoint aggregating metrics per pharmacy

### Modified Capabilities
- `pharmacy-list-page`: Enhanced from basic card grid to full-featured list with search/filter/sort/accordion

## Approach

1. **Backend**: Create new `GET /api/admin/pharmacies/metrics` endpoint that returns pharmacy list with aggregated pending counts (supply requests in REQUESTED/AUTHORIZED/SHIPPED status, expenses in PENDING status), assigned users with roles, and monthly summary data.
2. **Frontend**: Update FarmsitePage to include search input, filter tabs, sort dropdown, and accordion component. Use existing grid layout with responsive columns.
3. **Metrics Calculation**: Aggregate at query time using MongoDB aggregation pipeline with `$lookup` for supply requests and expenses, `$lookup` for users.
4. **Colors**: Apply CSS classes based on count thresholds (green/yellow/orange/red).
5. **Fix Broken Link**: Point edit link to `/dashboard/admin/farmacias/[id]/editar` (create page if missing).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/dashboard/admin/farmacias/page.tsx` | Modified | Add search, filter, sort, accordion, metrics |
| `src/app/api/admin/pharmacies/metrics/route.ts` | New | New endpoint for metrics aggregation |
| `src/types/api-responses.ts` | Modified | Add pharmacy metrics response types |
| `src/components/admin/pharmacies/PharmacyCard.tsx` | New | New card component with metrics |
| `src/components/admin/pharmacies/PharmacyAccordion.tsx` | New | New accordion component |
| `src/app/api/admin/pharmacies/[id]/editar/page.tsx` | New | Fix broken edit link target |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Metrics query performance (N+1) | Medium | Use single aggregation with `$lookup`, add indices on status fields |
| Large pharmacy list impacts search | Medium | Implement client-side filtering after initial fetch (acceptable for <500 pharmacies) |
| Role-based data leakage | Low | Ensure SUPERVISOR/ENCARGADO filters applied in API |

## Rollback Plan

1. Revert `src/app/dashboard/admin/farmacias/page.tsx` to previous version
2. Delete `src/app/api/admin/pharmacies/metrics/route.ts`
3. Delete new components (`PharmacyCard.tsx`, `PharmacyAccordion.tsx`)
4. Rollback types if no other changes depend on them

## Dependencies

- Existing `GET /api/admin/pharmacies` endpoint (already has search/filter)
- User model with assignedPharmacies field
- SupplyRequest model with pharmacy reference and status
- Expense model with pharmacy reference and status

## Success Criteria

- [ ] Search bar filters pharmacies by name in real-time
- [ ] Filter tabs correctly show All/Active/Inactive pharmacies
- [ ] Sort dropdown reorders cards by selected criteria
- [ ] Each card displays pending supply requests and expenses with correct colors
- [ ] Accordion expands to show assigned users and monthly summary
- [ ] Responsive: 1 col mobile, 2 cols tablet, 3 cols desktop
- [ ] Edit link navigates to valid page
- [ ] Role-based filtering works (SUPERVISOR sees assigned only)
- [ ] All tests pass with TDD approach