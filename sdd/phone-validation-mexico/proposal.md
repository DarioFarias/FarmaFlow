# Proposal: phone-validation-mexico

## Intent

Agregar validación específica para números telefónicos móviles de México en los schemas de Zod existentes. Actualmente los campos `phone` en `pharmacyCreateSchema`, `adminCreateUserSchema`, etc. solo tienen `z.string().max(30)` sin validación real — permiten cualquier cadena de hasta 30 caracteres.

## Scope

### In Scope
- Implementar regex de validación para teléfonos mexicanos (10 dígitos, con/sin prefijo internacional +52)
- Agregar función helper `validateMexicanPhone()` reusable
- Actualizar los schemas existentes que tienen campo `phone`:
  - `pharmacyCreateSchema`
  - `pharmacyUpdateSchema`
  - `adminCreateUserSchema`
  - `adminUpdateUserSchema`
- Agregar tests para la nueva validación

### Out of Scope
- Validación de teléfonos fijos (solo móviles)
-其他 países de Latinoamérica
- Integración con servicios de verificación SMS (Twilio, etc.)

## Capabilities

### Modified Capabilities
- `phone-validation`: Actualizar validación de teléfono existente — aceptar solo formatos válidos mexicanos

## Approach

Usar regex que acepte:
- `+52 55 1234 5678` (formato internacional con espacios)
- `+525512345678` (formato internacional sin espacios)
- `55 1234 5678` (formato local con espacios)
- `5512345678` (formato local sin espacios)

El regex base: `/^\+?52[2-9]\d{9}$/` para formato +52, y /^([2-9]\d{2}\s?){3}\d{4}$/` para formato local.

Crear función `validateMexicanPhone(phone: string): boolean` reusable que normalice y valide.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/validations.ts` | Modified | Agregar regex y función de validación, actualizar schemas |
| `src/lib/validations.test.ts` | Modified | Agregar tests para phone validation |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Que usuarios existentes tengan teléfono invalido | Low | Los campos phone son opcionales en la mayoría de schemas |
| Formato con guiones omitido | Medium | Agregar soporte para formatos con guiones (`55-1234-5678`) |

## Rollback Plan

1. Revertir cambios en `validations.ts` manteniendo los `z.string().max(30)` originales
2. Eliminar tests agregados
3. No requiere migración de DB (son solo validaciones input)

## Dependencies

- Ninguna dependencia externa — Zod ya está en el proyecto

## Success Criteria

- [ ] Regex acepta formatos válidos mexicanos: `+525512345678`, `55 1234 5678`, `5512345678`
- [ ] Regex rechaza números invalidos: `1234567890`, `+1 555 123 4567` (EEUU), `1234`
- [ ] Schemas actualizados rechazan números telefónicos invalidos
- [ ]Tests pasan con casos válidos e inválidos