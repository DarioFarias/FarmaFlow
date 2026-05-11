# Specs: Code Quality Round 2

## ADDED Requirements

### Requirement: Error Handling with Proper Typing

Todo bloques catch en API routes y scripts DEBEN usar tipo `unknown` acompañado de type guard para extraer el mensaje de error.

- GIVEN una función async que lanza una excepción
- WHEN el bloque catch captura el error
- THEN el parámetro DEBE ser tipado como `unknown`
- AND DEBE usar type guard para acceder al message: `error instanceof Error ? error.message : 'Error desconocido'`

#### Scenario: Catch with known error type
```typescript
try {
  await db.user.update(...)
} catch (error) {
  const message = error instanceof Error ? error.message : 'Error desconocido'
  return Response.json({ error: message }, { status: 500 })
}
```
- GIVEN una operación que lanza `Error` nativo
- WHEN se captura el error
- THEN el message es el mensaje original del Error

#### Scenario: Catch with unknown error object
- GIVEN una operación que lanza un objeto no-Error (ej: thrown from library)
- WHEN se captura el error
- THEN el message es 'Error desconocido' por fallback

---

### Requirement: No Sensitive Data in Console Logs

Los console.log en API routes NO DEBEN exponer datos sensibles.

- GIVEN un endpoint `POST /api/admin/users`
- WHEN se ejecuta `console.log('POST /api/admin/users - body:', JSON.stringify(body))`
- THEN el log DEBE ser eliminado o sanitizado

#### Scenario: Remove full request body logging
- GIVEN el body de un request contiene `{ password: 'secret123', ... }`
- WHEN se ejecutan logs con el body completo
- THEN NINGÚN log DEBE imprimir el body parsed o stringified

#### Scenario: Remove validated data logging
- GIVEN datos validados que incluyen password hasheado
- WHEN se ejecuta `console.log(validated)`
- THEN NINGÚN log DEBE contener password, token, o datos de sesión

---

### Requirement: Use Existing Session Types

Todo acceso a `session.user` DEBE utilizar los tipos declarados en `src/types/next-auth.d.ts` en lugar de casts con `as any`.

- GIVEN una API route que extrae datos del Session
- WHEN se accede a `session.user.role` o `session.user.assignedPharmacies`
- THEN NO DEBE usar casts como `session.user as any`
- AND DEBE confiar en los tipos declarados en el módulo `next-auth`

#### Scenario: Access assignedPharmacies from typed session
- GIVEN un usuario con sesión válida con `assignedPharmacies: ['pharma-1']`
- WHEN se accede a `session.user.assignedPharmacies`
- THEN el tipo DEBE ser `string[] | undefined` (sin cast)

#### Scenario: Access pharmacyName from typed session
- GIVEN un usuario con sesión que tiene `name: 'Farmacia Central'`
- WHEN se accede a `session.user.name`
- THEN el tipo DEBE ser `string | null` (sin cast)

---

## MODIFIED Requirements

### Requirement: Remove any-casts in API routes

(Previously: código usaba `(session.user as any).field`)

Los campos `role`, `assignedPharmacies`, `username` YA están definidos en el módulo `next-auth` extension. NO se requiere cast.

#### Scenario: Remove as any cast from supplies route
- GIVEN `src/app/api/supplies/route.ts`
- WHEN se cambia `(session.user as any).assignedPharmacies` por `session.user.assignedPharmacies`
- THEN el código compila exitosamente

#### Scenario: Remove as any cast from expenses route
- GIVEN `src/app/api/expenses/route.ts` líneas 36 y 92
- WHEN se elimina `as any`
- THEN el código compila exitosamente

---

## Targets

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `src/app/api/users/route.ts` | 89 | `catch (error: any)` | `catch (error)` + type guard |
| `src/scripts/remove-email-unique-index.ts` | 81 | `catch (error: any)` | `catch (error)` + type guard |
| `src/app/api/supplies/route.ts` | 35 | `session.user as any` | Remove cast |
| `src/app/api/supplies/route.ts` | 89 | `session.user as any` | Remove cast |
| `src/app/api/admin/pharmacies/route.ts` | 50 | `session.user as any` | Remove cast |
| `src/app/api/expenses/route.ts` | 36, 92 | `session.user as any` | Remove cast |
| `src/app/api/admin/users/route.ts` | 74 | console.log con body | Eliminar log |
| `src/app/api/admin/users/route.ts` | 78 | console.log con validated | Eliminar log |

---

## Type Guard Pattern Reference

```typescript
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Error desconocido'
}
```

---

## Session Type Reference (from next-auth.d.ts)

```typescript
interface Session {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role: UserRole
    profileImage?: string
    assignedPharmacies?: string[]
    username?: string | null
  }
}
```
