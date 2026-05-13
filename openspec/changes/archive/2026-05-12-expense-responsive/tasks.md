# Tasks: expense-responsive

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~420-490 new + 343 deleted |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

## Phase 1: Foundation — Test Mock Correction (Task 1)

- [ ] 1.1 Rewrite `__tests__/page.test.tsx`: mock `fetch()` + `useSession` + `AuditActions`. Drop `useExpenses` mock. Cover loading, list render, status badges, admin columns, empty state, edit buttons. Add responsive tests: cards render in mobile viewport, filters toggle button shows/hides filters.

## Phase 2: Core — Responsive List (Task 2)

- [ ] 2.1 `page.tsx`: wrap table in `hidden md:block overflow-x-auto`. Add cards section `block md:hidden space-y-3` between table close and pagination. Each card: checkbox header, detail grid (expenseNumber, date, description, amount, status), actions footer. Share `selectedIds`, `toggleSelectOne`, `toggleSelectAll`. Replicate empty state for cards.

## Phase 3: Core — Collapsible Filters (Task 3)

- [ ] 3.1 `page.tsx`: add `const [showFilters, setShowFilters] = useState(true)`. Add toggle button `className="md:hidden flex items-center gap-2"` with ChevronUp/Down. Wrap filters div in conditional `showFilters ? 'block' : 'hidden' md:flex md:flex-wrap md:gap-4 md:items-end`. Import ChevronUp/Down from lucide-react.

## Phase 4: Standalone Components

- [ ] 4.1 `BatchActionToolbar.tsx`: container → `w-[calc(100vw-2rem)] max-w-lg`, padding/gap → `p-3 md:p-4 gap-2 md:gap-4`. Button → `min-w-0 flex-1 md:flex-none`. Label with `truncate`, count with `whitespace-nowrap`. (Task 4)
- [ ] 4.2 `ExpenseForm.tsx` line 360: `aspect-[3/4]` → `aspect-video md:aspect-[3/4]`. (Task 5)

## Phase 5: Verification

- [ ] 5.1 `vitest run` — all existing + new responsive tests pass
- [ ] 5.2 Manual responsive check: 375px viewport → cards render, filters toggle, toolbar ≤ viewport width, upload area is `aspect-video`

### Testing per task

| Task | What validates |
|------|---------------|
| 1.1 | `vitest` — tests use `fetch` mock, not `useExpenses`. New cards/filters tests pass. |
| 2.1 | Cards render test: cards visible at mobile breakpoint. Table hidden at mobile. Checkbox selection works in cards. |
| 3.1 | Filters toggle test: click "Filtros" button toggles filter visibility. Desktop viewport shows filters without toggle. |
| 4.1 | Toolbar overflow test: render with long label at 375px, verify no overflow. |
| 4.2 | Aspect-ratio test: verify `aspect-video` class present in mobile, `aspect-[3/4]` in desktop. |
