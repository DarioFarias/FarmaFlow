## Exploration: Dashboard Mockup & Features

### Current State
Currently, the `/dashboard` route is a single `page.tsx` file that conditionally renders a few stat cards and Quick Action buttons depending on whether the session user `isAdmin` or a Pharmacy. There is no structural shell (Sidebar, Header) wrapping the sub-routes, and the navigation URLs (`/dashboard/suministros/nuevo`, `/dashboard/gastos/nuevo`) do not yet exist.

### Affected Areas
- `src/app/dashboard/layout.tsx` (To be created) — Will provide the persistent Sidebar and Header for the dashboard area.
- `src/components/Sidebar.tsx` (To be created) — The navigation menu, stateful on mobile (open/close).
- `src/components/Header.tsx` (To be created) — Top bar with User Profile dropdown and context.
- `src/app/dashboard/page.tsx` — Will be refactored to just contain the metrics, as the layout wraps it.
- Routing directories to be scaffolded according to `UserRole` capabilities.

### Requirements Breakdown
Based on `src/types/index.ts`, we need two distinct UX flows:
**1. Pharmacy Flow:**
- "Mis Pedidos": View status (`REQUESTED` -> `SHIPPED` -> `RECEIVED`), Request new.
- "Mis Gastos": View previous (`PENDING` -> `APPROVED`), Upload new ticket.

**2. Admin (Supervisor) Flow:**
- "Dashboard": Global view of metrics.
- "Auditoría de Gastos": Approve/Dispute expenses uploaded by pharmacies.
- "Despacho de Pedidos": Approve/Ship supply requests from pharmacies.
- "Farmacias": Manage pharmacy user accounts.

### Approaches
1. **Unified Dashboard Shell with Role-based Links**
   - Pros: Simple architecture, one layout file (`src/app/dashboard/layout.tsx`).
   - Cons: Need to heavily use conditionals (`isAdmin`) on sidebar links.
   - Effort: Low.

2. **Parallel Routes or Route Groups `(admin)` and `(pharmacy)`**
   - Pros: Better separation of concerns (e.g. `src/app/dashboard/(admin)/layout.tsx`).
   - Cons: Can lead to path collision or duplicate layout code if not structured perfectly.
   - Effort: Medium.

### Recommendation
**Unified Dashboard Shell (Approach 1)**. Given the MVP nature of FarmaFlow, a single `dashboard/layout.tsx` rendering a `<Sidebar role={session.user.role} />` is sufficient and avoids over-engineering route groups. We will use Next.js active route styles and Lucide icons for aesthetics.

### Risks
- Next.js RSC boundaries: The Sidebar needs to be a Client component (`'use client'`) if we want mobile-responsive toggling, but we want to fetch the session on the Server. We must pass down the `role` as a prop from the Server-rendered `layout.tsx` to the Client-rendered `Sidebar.tsx`. (Following `next-best-practices`).
