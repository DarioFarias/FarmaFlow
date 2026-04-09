## Proposal: Dashboard & Core Features Mockup

**Status**: Proposed
**Driver**: orchestrator

### Intent
Establish the visual foundation and UX layout for the FarmaFlow system. Transition from a flat, single-page dashboard to a proper Web Application structure (Sidebar + Header + Page Content area).

### Scope
- Create a global `DashboardLayout` applied to all routes under `/dashboard`.
- Create a responsive `Sidebar` component with role-based navigation.
- Create a minimal `Header` component.
- Refactor the main `/dashboard/page.tsx` home page to fit inside the new layout.
- Scaffold the mock pages for the key functionalities (Suministros, Gastos) so routing works.

### Out of Scope
- Backend database fetching logic for the mock pages (they will use static/fake data for the mockup phase).
- Complex animation libraries (using Tailwind primitives instead).

### Architecture / Solution
Following Vercel's React Composition Patterns and Next.js best practices:
1. **Layout (`src/app/dashboard/layout.tsx`)**: An RSC (React Server Component) that fetches the session and role, rendering `<Sidebar role={session.user.role} />`.
2. **Sidebar (`src/components/layout/Sidebar.tsx`)**: Client component to manage mobile toggle state, tracking `usePathname()` to highlight the active menu item.
3. **Scaffolded Routes**:
   - `/dashboard`: Main metrics.
   - `/dashboard/suministros`: List of supply requests.
   - `/dashboard/gastos`: List of expenses.
   - `/dashboard/admin/farmacias`: (Admin only) List of users.

### Visual Design Goal
- **Color Palette**: Brand colors (blues, purples, clean whites), mimicking modern SaaS dashboards (Linear, Vercel-like).
- **Typography & Icons**: Lucide-react for iconography.
- **Glassmorphism/Shadows**: Soft shadows (`shadow-sm`, `ring-1 ring-gray-200`) for cards to make the experience feel "Premium" according to our guidelines.

### Rollback Plan
- Revert the addition of `layout.tsx` if the layout breaks authentication rules.
