# Proposal: code-quality-fixes

## Intent

El proyecto presenta vulnerabilidades de seguridad críticas y deuda técnica significativa que requieren atención inmediata. El código tiene una regex injection en la API de admin/pharmacies y un error de lógica donde las APIs de supplies/expenses usan el ID del usuario en lugar del ID de la pharmacy, causando que los datos se guarden con referencias incorrectas. Adicionalmente, el uso de `as any` en el manejo de sesiones NextAuth elimina la seguridad de tipos en una parte crítica del sistema.

## Scope

### In Scope
- Corregir regex injection en `src/app/api/admin/pharmacies/route.ts` sanitizando input del usuario antes de usarlo en RegExp
- Corregir pharmacy reference mismatch en supplies/expenses APIs usando Pharmacy._id en lugar de session.user.id
- Eliminar `as any` de manejo de sesión NextAuth creando tipos propios para la sesión
- Implementar paginación básica en APIs que usan `limit(50)` hardcodeado

### Out of Scope
- Configuración de ESLint personalizada
- Limpieza de console.log en APIs
- Implementación de next/image para avatars
- Extracción de currency hardcodeado "MXN"
- Loading skeletons o Error boundaries
- Agregar más tests

## Capabilities

### New Capabilities
- `code-quality-security`: Corrección de vulnerabilidades de seguridad (regex injection, tipo seguro en auth)
- `code-quality-pagination`: Paginación básica en endpoints de lista

### Modified Capabilities
- Ninguna - cambios son a nivel de implementación, no afectan comportamiento de especificación

## Approach

1. **Regex Injection**: Sanitizar el parámetro de búsqueda usando `escapeRegExp()` antes de pasarlo al constructor RegExp. Implementar validación de entrada rechazando caracteres especiales de regex.

2. **Pharmacy Reference Mismatch**: Modificar las APIs de supplies y expenses para obtener el Pharmacy._id desde la sesión del usuario. La sesión debe contener el pharmacyId del usuario actual.

3. **NextAuth Types**: Crear extensión de tipos para `next-auth` en un archivo de types declarations que extienda la interfaz Session y JWT callback para incluir pharmacyId y role.

4. **Paginación**: Reemplazar `limit(50)` hardcodeado con parámetros query `page` y `pageSize`, retornando metadatos de paginación (total, hasMore).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/admin/pharmacies/route.ts` | Modified | Sanitizar regex input en línea 71 |
| `src/app/api/supplies/route.ts` | Modified | Usar pharmacyId desde sesión |
| `src/app/api/expenses/route.ts` | Modified | Usar pharmacyId desde sesión |
| `src/types/next-auth.d.ts` | New | Tipos personalizados para NextAuth |
| `src/lib/auth.ts` | Modified | Incluir pharmacyId en sesión y JWT |
| APIs de lista (supplies, expenses, pharmacies) | Modified | Implementar paginación con page/pageSize |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Breaking change en paginación para clientes existentes | Low | Mantener backward compatible con params opcionales |
| Sesión sin pharmacyId para usuarios existentes | Med | Verificar y manejar caso gracefully, fallback a búsqueda por userId |
| Regex sanitización muy agresiva rompe búsqueda legítima | Low | Solo sanitizar caracteres especiales de regex, no toda la cadena |

## Rollback Plan

1. Revertir sanitización de regex en admin/pharmacies/route.ts
2. Restaurar uso de session.user.id en supplies/expenses routes
3. Eliminar archivo de tipos custom de next-auth
4. Remover parámetros de paginación de queries y restaurar limit(50)

## Dependencies

- Dependencias existentes de NextAuth y Mongoose no requieren cambios

## Success Criteria

- [ ] Regex injection corregida - input malicioso no ejecuta regex arbitraria
- [ ] Supplies/Expenses guardan referencia correcta a Pharmacy._id
- [ ] Sesión de NextAuth tiene tipos propios sin uso de `as any`
- [ ] APIs de lista aceptan page y pageSize, retornan paginación
- [ ] Tests de seguridad pasan (regex injection attempt rejected)
