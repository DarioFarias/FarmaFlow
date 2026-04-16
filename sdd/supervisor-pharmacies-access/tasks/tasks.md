# Tasks: supervisor-pharmacies-access

## Phase 1: Middleware
- [x] 1.1 Modificar src/middleware.ts para permitir SUPERVISOR a /dashboard/admin/farmacias
- [x] 1.2 Usar función hasPharmacyAccess() existente o crear filtro

## Phase 2: API
- [x] 2.1 Modificar src/app/api/admin/pharmacies/route.ts para permitir SUPERVISOR
- [x] 2.2 Agregar filtro por assignedPharmacies en la query

## Phase 3: Frontend
- [x] 3.1 Modificar src/app/dashboard/admin/farmacias/page.tsx para obtener sesión
- [x] 3.2 Agregar lógica de filtrado por assignedPharmacies
- [x] 3.3 Mostrar mensaje cuando no hay farmacias asignadas

## Phase 4: Verification
- [ ] 4.1 Test supervisor puede acceder
- [ ] 4.2 Test muestra solo farmacias asignadas
- [ ] 4.3 Test admin ve todas las farmacias