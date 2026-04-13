# Proposal: fix-deployment-issues

## Intent

El proyecto FarmaFlow tiene errores de TypeScript que impiden el build y deployment. El objetivo es ejecutar los tests existentes, corregir los errores de compilación, y asegurar que el proyecto buildée correctamente.

## Scope

### In Scope
- Ejecutar todos los tests existentes (`npm test`)
- Corregir errores de TypeScript en el código
- Verificar que el proyecto buildée exitosamente (`npm run build`)
- Agregar tests si son necesarios para cubrir código no testeado

### Out of Scope
- Nuevas funcionalidades
- Refactoring de arquitectura
- Cambios en la base de datos

## Capabilities

### New Capabilities
- Ninguno (este es un change de corrección de errores)

### Modified Capabilities
- Ninguno

## Approach

1. **Ejecutar tests**: Correr `npm test` para ver el estado actual
2. **Analizar errores de TypeScript**: Los errores encontrados son:
   - `SupplyRequestStatus.APPROVED` y `DELIVERED` faltantes
   - `SidebarProps.pharmacyName` faltante
   - Errores en scripts de seed (mongoose imports)
3. **Corregir errores**: Following existing patterns en el codebase
4. **Verificar build**: Correr `npm run build` para confirmar

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/models/SupplyRequest.ts` | Modified | Agregar estados faltantes |
| `src/components/layout/Sidebar.tsx` | Modified | Agregar prop pharmacyName |
| `src/app/dashboard/suministros/page.tsx` | Modified | Usar estados correctos |
| `src/scripts/seed.ts` | Modified | Corregir imports de mongoose |
| `src/scripts/promote-user.ts` | Modified | Corregir tipos possibly undefined |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking existing functionality | Low | Ejecutar tests después de cada fix |
| Build sigue fallando | Low | Verificar incrementalmente |

## Rollback Plan

Si algo sale mal, hacer git checkout de los archivos modificados para revertir cambios.

## Dependencies

- Ninguno

## Success Criteria

- [ ] `npm test` pasa sin errores
- [ ] `npm run type-check` pasa sin errores
- [ ] `npm run build` genera el build correctamente
- [ ] Tests existentes siguen funcionando
