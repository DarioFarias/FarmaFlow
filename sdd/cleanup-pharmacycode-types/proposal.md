# Proposal: Cleanup pharmacyCode from IUser

## Intent

Remover el campo `pharmacyCode` de la interfaz `IUser` y del modelo Mongoose `User`, ya que este dato fue migrado a la colección independiente `Pharmacy`. El campo actualmente está marcado como "legacy" y no se usa más para crear ni actualizar usuarios.

## Scope

### In Scope
- Eliminar `pharmacyCode` de `IUser` en `src/types/index.ts` (línea 93)
- Eliminar el campo `pharmacyCode` del schema Mongoose en `src/models/User.ts` (líneas 56-61)
- Eliminar referencias comentadas que mencionan pharmacyCode en APIs de users

### Out of Scope
- No tocar `IPharmacy.pharmacyCode` - ese sigue siendo válido
- No modificar scripts de migración históricos
- No crear delta specs - es un cleanup simple

## Capabilities

> Esta es una limpieza de código legacy. No hay cambios en capabilities del sistema.
> No se requiere spec - es refactor puro de tipos.

- Ninguna capability cambia a nivel de negocio

## Approach

1. Remover `pharmacyCode?: string` de la interface `IUser` en `src/types/index.ts`
2. Remover el campo `pharmacyCode` del schema de Mongoose en `src/models/User.ts`
3. Limpiar comentarios de código que referencian pharmacyCode en:
   - `src/app/api/users/route.ts`
   - `src/app/api/admin/users/[id]/route.ts`
4. Verificar que el build compile sin errores

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/types/index.ts` | Modified | Remover línea 93: `pharmacyCode?: string` de IUser |
| `src/models/User.ts` | Modified | Remover líneas 56-61: campo pharmacyCode del schema |
| `src/app/api/users/route.ts` | Modified | Limpiar comentario legacy en línea 50 |
| `src/app/api/admin/users/[id]/route.ts` | Modified | Limpiar comentarios legacy en líneas 84-92 |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Código existente dependa de IUser.pharmacyCode | Low |grep previo no mostró usos activos en usuarios - solo comments |
| Build falle por tipos faltantes | Low | Verificar con `npm run build` después de cambios |

## Rollback Plan

El cambio es revertible haciendo git restore de los archivos moduestos. No hay migración de datos - solo limpieza de tipos.

## Dependencies

- Ninguna - es cleanup standalone

## Success Criteria

- [ ] `npm run build` pasa sin errores
- [ ] grep "pharmacyCode" en src/types/index.ts no muestra resultados en IUser
- [ ] grep "pharmacyCode" en src/models/User.ts no muestra resultados