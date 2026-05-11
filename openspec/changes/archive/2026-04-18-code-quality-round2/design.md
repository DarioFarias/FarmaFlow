# Design: Code Quality Round 2

## Technical Approach

Implementar tres mejoras de code quality siguiendo las specs definidas: (1) tipo unknown + type guard en catches, (2) eliminar console.logs con datos sensibles, (3) remover casts `as any` de session.user aprovechando los tipos existentes en `src/types/next-auth.d.ts`.

## Architecture Decisions

### Decision: Error Handling Type Guard Pattern

**Choice**: Usar type guard inline `error instanceof Error ? error.message : 'Error desconocido'`
**Alternatives considered**: Función helper separada en utils
**Rationale**: Mantiene el código simple y DRY en los archivos afectados. La función helper es overkill para solo 2 occurrences.

### Decision: Session Types without Cast

**Choice**: Eliminar `as any` y confiar en los tipos declarados en `next-auth.d.ts`
**Alternatives considered**: Crear interfaces locales en cada route
**Rationale**: Los tipos YA existen en el módulo extendido de next-auth. Solo hace falta remover el cast para que TypeScript los use.

### Decision: Console Logs Sensitive Data

**Choice**: Eliminar completamente los logs en `admin/users/route.ts` líneas 74 y 78
**Alternatives considered**: Sanitizar antes de loggear
**Rationale**: No hay razón de negocio para loggear request body/validated en producción. Eliminar es más seguro y simple.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/users/route.ts` | Modify | Línea 89: `catch (error: any)` → `catch (error)` + type guard inline |
| `src/scripts/remove-email-unique-index.ts` | Modify | Línea 81: `catch (error: any)` → `catch (error)` + type guard inline |
| `src/app/api/admin/users/route.ts` | Modify | Líneas 74, 78: Eliminar console.logs con body/validated |
| `src/app/api/supplies/route.ts` | Modify | Líneas 35, 89: Remover `as any` de session.user |
| `src/app/api/admin/pharmacies/route.ts` | Modify | Línea 50: Remover `as any` de session.user |
| `src/app/api/expenses/route.ts` | Modify | Líneas 36, 92: Remover `as any` de session.user |

## Interfaces / Contracts

### Type Guard Pattern (inline)
```typescript
try {
  await db.user.update(...)
} catch (error) {
  const message = error instanceof Error ? error.message : 'Error desconocido'
  return Response.json({ error: message }, { status: 500 })
}
```

### Session Type (already exists in next-auth.d.ts)
```typescript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: UserRole
      assignedPharmacies?: string[]
      username?: string | null
    }
  }
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Compile | Tipos Session sin any | `npm run build` debe compilar sin errores |
| Manual | Logs sensibles eliminados | Revisar que no aparezcan en terminal al hacer POST |

## Migration / Rollout

No migration required. Solo cambios de code quality local.

## Targets Confirmados

| File | Línea | Issue | Fix |
|------|-------|-------|-----|
| `src/app/api/users/route.ts` | 89 | catch (error: any) | catch (error) + type guard |
| `src/scripts/remove-email-unique-index.ts` | 81 | catch (error: any) | catch (error) + type guard |
| `src/app/api/admin/users/route.ts` | 74 | console.log(body) | Eliminar |
| `src/app/api/admin/users/route.ts` | 78 | console.log(validated) | Eliminar |
| `src/app/api/supplies/route.ts` | 35 | (session.user as any).pharmacyName | session.user.name |
| `src/app/api/supplies/route.ts` | 89 | (session.user as any).assignedPharmacies | session.user.assignedPharmacies |
| `src/app/api/admin/pharmacies/route.ts` | 50 | (session.user as any).assignedPharmacies | session.user.assignedPharmacies |
| `src/app/api/expenses/route.ts` | 36 | (session.user as any).assignedPharmacies | session.user.assignedPharmacies |
| `src/app/api/expenses/route.ts` | 92 | (session.user as any).assignedPharmacies | session.user.assignedPharmacies |
