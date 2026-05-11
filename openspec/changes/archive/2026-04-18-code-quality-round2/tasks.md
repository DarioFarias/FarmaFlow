# Tasks: Code Quality Round 2

## Phase 1: Error Handling Fixes

- [x] 1.1 Modificar `src/app/api/users/route.ts` línea 89: cambiar `catch (error: any)` por `catch (error)` y agregar type guard inline `error instanceof Error ? error.message : 'Error desconocido'`
- [x] 1.2 Modificar `src/scripts/remove-email-unique-index.ts` línea 81: cambiar `catch (error: any)` por `catch (error)` y agregar type guard inline

## Phase 2: Remove Sensitive Logs

- [x] 2.1 Eliminar línea 74 en `src/app/api/admin/users/route.ts`: `console.log('POST /api/admin/users - body:', JSON.stringify(body))`
- [x] 2.2 Eliminar línea 78 en `src/app/api/admin/users/route.ts`: `console.log('POST /api/admin/users - validated:', JSON.stringify(validated))`

## Phase 3: Remove session.user as any Casts

- [x] 3.1 Modificar `src/app/api/supplies/route.ts` línea 35: cambiar `(session.user as any).pharmacyName` por `session.user.name`
- [x] 3.2 Modificar `src/app/api/supplies/route.ts` línea 89: cambiar `(session.user as any).assignedPharmacies` por `session.user.assignedPharmacies`
- [x] 3.3 Modificar `src/app/api/admin/pharmacies/route.ts` línea 50: cambiar `(session.user as any).assignedPharmacies` por `session.user.assignedPharmacies`
- [x] 3.4 Modificar `src/app/api/expenses/route.ts` línea 36: cambiar `(session.user as any).assignedPharmacies` por `session.user.assignedPharmacies`
- [x] 3.5 Modificar `src/app/api/expenses/route.ts` línea 92: cambiar `(session.user as any).assignedPharmacies` por `session.user.assignedPharmacies`
- [x] 3.6 (Additional) Modificar `src/app/dashboard/suministros/page.tsx` línea 35: (session.user as any).assignedPharmacies → session.user.assignedPharmacies
- [x] 3.7 (Additional) Modificar `src/app/dashboard/gastos/page.tsx` línea 34: (session.user as any).assignedPharmacies → session.user.assignedPharmacies

## Phase 4: Verification

- [x] 4.1 Ejecutar `npm run build` para verificar que compila sin errores de tipo
- [x] 4.2 Verificar que no quedan `as any` en archivos modificados con grep
