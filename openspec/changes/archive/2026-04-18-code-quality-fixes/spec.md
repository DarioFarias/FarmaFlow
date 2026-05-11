# Delta Specs: code-quality-fixes

## Domain 1: API Security

### Requirement: Regex Input Sanitization

El sistema DEBE sanitizar el input del usuario antes de usarlo en constructores RegExp para prevenir ataques de regex injection.

#### Scenario: Valid Search Term

- GIVEN un usuario busca con término alfanumérico "Sucursal Centro"
- WHEN la API recibe el parámetro de búsqueda
- THEN el sistema DEBE usar el término directamente en RegExp sin problemas de sanitización

#### Scenario: Malicious Regex Pattern

- GIVEN un usuario envía input malicioso como `(.*)+$` como término de búsqueda
- WHEN la API intenta usarlo en RegExp
- THEN el sistema DEBE rechazar o sanitizar el input para prevenir ejecución arbitraria

---

### Requirement: Pharmacy Reference Validation

El sistema DEBE validar que la referencia de pharmacy en las requests coincida con la pharmacy del usuario en sesión.

#### Scenario: Matching Pharmacy Reference

- GIVEN un usuario con pharmacyId "pharmacy-123" en sesión hace una request
- WHEN la request incluye pharmacyId "pharmacy-123"
- THEN el sistema DEBE procesar la request normalmente

#### Scenario: Mismatched Pharmacy Reference

- GIVEN un usuario con pharmacyId "pharmacy-123" en sesión hace una request
- WHEN la request incluye pharmacyId "pharmacy-456"
- THEN el sistema DEBE rechazar la request con 403 Forbidden

---

## Domain 2: API Pagination

### Requirement: Pagination Parameters

El sistema DEBE aceptar parámetros de query `page` y `pageSize` para endpoints de lista.

#### Scenario: Default Pagination

- GIVEN un usuario solicita /api/supplies sin parámetros de paginación
- WHEN la API procesa la request
- THEN el sistema DEBE usar page=1, pageSize=50 por defecto

#### Scenario: Custom Page Size

- GIVEN un usuario solicita /api/supplies?page=2&pageSize=10
- WHEN la API procesa la request
- THEN el sistema DEBE retornar items 11-20 con hasMore=true si existen más

---

### Requirement: Pagination Metadata

El sistema DEBE retornar metadatos de paginación en la respuesta.

#### Scenario: Full Results

- GIVEN una pharmacy tiene exactamente 10 supplies
- WHEN el usuario solicita con pageSize=10
- THEN la respuesta DEBE incluir hasMore=false

#### Scenario: Partial Results

- GIVEN una pharmacy tiene 25 supplies
- WHEN el usuario solicita pageSize=10
- THEN la respuesta DEBE incluir hasMore=true

---

## Domain 3: TypeScript Types

### Requirement: NextAuth Session Types

El sistema DEBE definir tipos TypeScript propios para la sesión de NextAuth que incluyan pharmacyId y role.

#### Scenario: Session Contains Pharmacy ID

- GIVEN un usuario inicia sesión con asociación a pharmacy
- WHEN la sesión se crea
- THEN el tipo de sesión DEBE incluir pharmacyId: string

#### Scenario: Session Contains User Role

- GIVEN un usuario inicia sesión con rol "ADMIN"
- WHEN la sesión se crea
- THEN el tipo de sesión DEBE incluir role: string

---

### Requirement: Elimination of Type Assertions

El sistema NO DEBE usar assertions `as any` para acceder a datos de sesión.

#### Scenario: Proper Session Type Inference

- GIVEN código necesita acceder al email del usuario
- WHEN el código usa session.user.email
- THEN TypeScript DEBE inferir el tipo correcto sin casting

#### Scenario: Invalid Property Rejected at Compile Time

- GIVEN código intenta acceder a propiedad no existente
- WHEN ocurre compilación
- THEN TypeScript DEBE lanzar error de tipo

---

## Summary

| Domain | Type | Requirements | Scenarios |
|--------|------|---------------|-----------|
| API Security | New | 2 | 4 |
| API Pagination | New | 2 | 4 |
| TypeScript Types | New | 2 | 4 |

### Coverage
- Happy paths: 3 covered
- Edge cases: 3 covered
- Error states: 2 covered (rejection scenarios)

### Next Step
Ready for design (sdd-design).
