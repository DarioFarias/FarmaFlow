# Design: Server-Client Split — Farmacias Page

**What**: Diseño técnico completo para server-client-split de farmacias: Server Component page.tsx + FarmaciasListClient + shared service pharmacies.ts + subcomponentes PharmaciesToolbar/PharmaciesPagination

**Why**: El monolito `'use client'` (441 líneas) en `src/app/dashboard/admin/farmacias/page.tsx` mezcla fetching, estado interactivo y UI inline. Bloquea metadata dinámica y contradice el patrón Server/Client Component ya probado en gastos.

**Where**: 
- `src/app/dashboard/admin/farmacias/page.tsx` — rewrite a Server Component
- `src/app/dashboard/admin/farmacias/FarmaciasListClient.tsx` — new, interactividad + AJAX
- `src/app/dashboard/admin/farmacias/PharmaciesToolbar.tsx` — new, search + filter tabs + sort
- `src/app/dashboard/admin/farmacias/PharmaciesPagination.tsx` — new, prev/next + page info
- `src/lib/services/pharmacies.ts` — new, getFilteredPharmacies() con $facet aggregation
- Modales existentes y API routes — sin cambios

**Learned**: 
1. Diferencia clave con gastos: el shared service debe replicar la aggregation $facet del endpoint /metrics (SupplyRequest + Expense + User con ObjectIds) porque el Server Component necesita IPharmacyMetrics completo. No alcanza con un Pharmacy.find simple.
2. El filtro SUPERVISOR client-side (líneas 164-171 del monólito) es REDUNDANTE — las API routes ya filtran server-side. Se elimina del Client Component.
3. El sort client-side persiste para AJAX porque /metrics no acepta sortBy. Modificarlo es out of scope según proposal.
4. PharmaciesToolbar y PharmaciesPagination siguen el patrón exacto de GastosFilters/GastosPagination.
5. Cache compartido: la shared service reusa metricsCache (TTLCache 30s) de @/lib/metrics-cache.ts para evitar duplicación con el endpoint /metrics.
