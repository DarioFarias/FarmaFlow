# Proposal: Code Quality Round 2

## Intent

Continuar mejorando la calidad del código del proyecto abordando problemas de tipo TypeScript y registros sensibles en API routes. El primer round cubrió aspectos básicos; este round se enfoca en tipos estrictos y eliminación de logs con datos sensibles que podrían filtrarse en producción.

## Scope

### In Scope
- Reemplazar `catch (error: any)` por `catch (error)` con tipado correcto (`unknown` + type guard)
- Eliminar `console.log` que expongan datos sensibles (body, passwords, tokens) en API routes
- Estandarizar el uso de tipos Session existentes en lugar de casts con `as UserRole`
- Documentar patrón de manejo de errores con tipos adecuados

### Out of Scope
- Testing (unit o integration)
- Refactors grandes de lógica de negocio
- Nuevos componentes o features
- Accessibility/aria-labels (fuera del alcance por ahora)
- Cambios en la base de datos o modelos

## Capabilities

> Esta sección es el CONTRATO entre proposal y specs.

### New Capabilities
- Ninguna (refactor puro de código existente)

### Modified Capabilities
- Ninguna (no hay cambio en comportamiento a nivel de specs)

## Approach

1. **Manejo de errores**: Reemplazar `catch (error: any)` por `catch (error: unknown)` y usar type guard para acceder al message:
   ```typescript
   catch (error) {
     const message = error instanceof Error ? error.message : 'Error desconocido'
     // ...
   }
   ```

2. **Console.log sensibles**: Eliminar o sanitizar logs en API routes que impriman:
   - Body completo de requests
   - Datos de usuario (passwords, tokens)
   - Información de sesión

3. **Tipos Session**: Utilizar los tipos ya declarados en `src/types/next-auth.d.ts` y eliminar casts redundantes como `session.user.role as UserRole` donde el tipo ya está declarado.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/users/route.ts` | Modified | `catch (error: any)` → `catch (error: unknown)` |
| `src/app/api/admin/users/route.ts` | Modified | Eliminar console.log con body/validated data |
| `src/types/next-auth.d.ts` | Reference | Tipos Session ya existen, solo usarlos correctamente |
| Todos los API routes con `catch (error)` | Review | Estandarizar tipo `unknown` + type guard |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Romper manejo de errores existente | Low | Revisar cada catch antes de modificar; mantener estructura de respuesta |
| Eliminar logs de debug útiles | Low | Solo eliminar logs sensibles, mantener logs de error estructurados |

## Rollback Plan

Los cambios son refactors locales en API routes. Si algo falla:
1. Revertir archivo específico con `git checkout`
2. Cada archivo puede revertirse independientemente
3. No hay cambios en modelos, DB ni configuración

## Dependencies

- Ninguna dependencia externa
- Requiere conocimiento de tipos existentes en `src/types/next-auth.d.ts`

## Success Criteria

- [ ] Sin occurrences de `catch (error: any)` en API routes
- [ ] Sin `console.log` que expongan datos sensibles en API routes (body, password, token)
- [ ] Patrón de manejo de errores estandarizado: `catch (error: unknown)` + type guard
- [ ] Código compila sin errores TypeScript
- [ ] API routes funcionan igual que antes (verificación manual post-cambio)
