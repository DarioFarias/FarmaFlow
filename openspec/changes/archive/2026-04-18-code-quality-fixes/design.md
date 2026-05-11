# Design: code-quality-fixes

## Technical Approach

**What**: Technical design creado para code-quality-fixes
**Why**: Documentar approach, arquitectura y decisiones técnicas para los 3 dominios (security, pagination, types)
**Learned**: El archivo next-auth.d.ts YA tiene los tipos extendidos, el problema es que auth.ts no los usa correctamente y hace casts innecesarios con `as any`

## Architecture Decisions

- **Types Foundation**: Corregir 6 instancias de `as any` en auth.ts usando LeanUser type y AuthorizeUser interface ya definidos en next-auth.d.ts
- **API Security**: Crear SANITIZE_REGEX schema en validations.ts con función sanitizeInput() y sanitizeSearchInput()
- **API Pagination**: Crear paginationParams schema en validations.ts, agregar pageSize a PaginatedResponse en types/index.ts

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/lib/auth.ts` | Modified | Type corrections (6 `as any` removed) |
| `src/lib/validations.ts` | Modified | sanitizeInput() + paginationParams |
| `src/lib/sanitize.test.ts` | NEW | 9 tests |
| `src/types/index.ts` | Modified | pageSize in PaginatedResponse |
| `src/app/api/admin/pharmacies/route.ts` | Modified | Sanitization + pagination |
| `src/app/api/supplies/route.ts` | Modified | Pagination |
| `src/app/api/expenses/route.ts` | Modified | Pagination |
| `src/app/api/admin/users/route.ts` | Modified | Pagination |
