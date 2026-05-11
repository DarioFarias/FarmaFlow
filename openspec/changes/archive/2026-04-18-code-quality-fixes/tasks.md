# Tasks: code-quality-fixes

**What**: Created task breakdown para code-quality-fixes con 4 fases: Types Foundation, API Security, API Pagination, Testing
**Why**: El design especificó regex sanitization con Zod, pagination con page/pageSize, y eliminación de `as any` en TypeScript
**Learned**: Hay 6 instancias de `as any` en auth.ts que deben corregirse con tipos propios de NextAuth. Ya existe PaginatedResponse en types/index.ts. Falta regex sanitization y schemas de pagination en validations.ts.

## Phase 1: Types Foundation ✅
- [x] 1.1 Corregir `as any` línea 43 — usar LeanUser type
- [x] 1.2 Corregir `as any` línea 50 — usar LeanUser type
- [x] 1.3 Corregir `as any` línea 58 — usar LeanUser type
- [x] 1.4 Corregir `as any` línea 92 — usar AuthorizeUser interface
- [x] 1.5 Corregir `as any` línea 93 — usar AuthorizeUser interface
- [x] 1.6 Corregir `as any` línea 94 — usar AuthorizeUser interface

## Phase 2: API Security ✅
- [x] 2.1 Agregar schema SANITIZE_REGEX en validations.ts
- [x] 2.2 Crear función sanitizeInput() y sanitizeSearchInput()
- [x] 2.3 Agregar mongoObjectIdRegex para pharmacyId (referencia)
- [x] 2.4 Importar y aplicar sanitize en /api/admin/pharmacies route.ts GET
- [x] 2.5 Aplicar sanitize en search query params

## Phase 3: API Pagination ✅
- [x] 3.1 Agregar schema paginationParams en validations.ts
- [x] 3.2 Agregar pageSize a PaginatedResponse en types/index.ts
- [x] 3.3 Implementar pagination en /api/admin/pharmacies/route.ts GET
- [x] 3.4 Implementar pagination en /api/supplies/route.ts GET
- [x] 3.5 Implementar pagination en /api/expenses/route.ts GET
- [x] 3.6 Implementar pagination en /api/admin/users/route.ts GET

## Phase 4: Integration Testing ⚠️ (requires DB)
- [ ] 4.1 Verificar que Auth0 no tenga errores de tipos con tsc
- [ ] 4.2 Testear que pagination funcione
- [ ] 4.3 Testear que sanitización rechace inputs maliciosos
- [ ] 4.4 Verificar que todas las APIs retornen estructura de paginación
