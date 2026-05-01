# Proposal: React Component Refactor

## Intent

El archivo `src/app/dashboard/admin/usuarios/page.tsx` tiene **927 líneas** haciendo TODO dentro de un solo componente: tabla de usuarios + 4 modals (Create, Edit, Password, Delete) + lógica CRUD completa. Esto viola el principio de Responsabilidad Única (SRP) y dificulta mantenimiento, testing y colaboración. Además, el componente `PharmacyCheckboxGroup` está **duplicado** en las líneas 609-631 y 777-798 con lógica idéntica.

En `src/app/dashboard/page.tsx` (101 líneas), el array de `statCards` (líneas 44-52) se recrea en cada render, lo cual es ineficiente.

## Scope

### In Scope
- Extraer `src/app/dashboard/admin/usuarios/page.tsx` en **6 componentes separados**:
  - `UserTable.tsx`: tabla con paginación, búsqueda, acciones
  - `CreateUserModal.tsx`: modal de creación (~190 líneas)
  - `EditUserModal.tsx`: modal de edición (~165 líneas)
  - `PasswordModal.tsx`: modal de cambio de contraseña
  - `DeleteUserModal.tsx`: modal de confirmación de eliminación
  - `PharmacyCheckboxGroup.tsx`: componente reusable para seleccionar farmacias (elimina duplicación)
- Crear `useUsers.ts` hook para lógica de CRUD (fetchUsers, handleUpdateRole, etc.)
- Fix `src/app/dashboard/page.tsx`: mover statCards array fuera del componente

### Out of Scope
- Otros archivos de la app con issues menores
- Cambios en la API o modelo de datos
- Nuevas funcionalidades

## Capabilities

> Este es un refactor puro — no cambia requisitos ni comportamiento existente.

### New Capabilities
Ninguno — es refactor arquitectural.

### Modified Capabilities
Ninguno — solo reorganización de código existente.

## Approach

1. **Crear директорию** `src/components/admin/users/` para los nuevos componentes
2. **Extraer PharmacyCheckboxGroup** primero (menor acoplamiento) — crear componente reusable que reciba `pharmacies[]`, `selected[]`, `onChange`
3. **Crear hook `useUsers.ts`** con toda la lógica de estado y API calls
4. **Dividir página principal**:
   - `UserTable.tsx`: recibe users[], handlers como props
   - Cada modal como componente separado
5. **Fix dashboard/page.tsx**: declarar statCards antes del return o usar useMemo
6. **Verificar** que la UI funcione igual que antes

### Estructura objetivo
```
src/
├── app/dashboard/admin/usuarios/
│   └── page.tsx          # ~100 líneas, solo composición
├── components/admin/users/
│   ├── UserTable.tsx
│   ├── CreateUserModal.tsx
│   ├── EditUserModal.tsx
│   ├── PasswordModal.tsx
│   ├── DeleteUserModal.tsx
│   └── PharmacyCheckboxGroup.tsx
└── hooks/
    └── useUsers.ts
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/dashboard/admin/usuarios/page.tsx` | Modified | Reduce from 927 to ~100 lines |
| `src/components/admin/users/*.tsx` | New | 6 new components |
| `src/hooks/useUsers.ts` | New | Custom hook for CRUD logic |
| `src/app/dashboard/page.tsx` | Modified | Fix array recreation |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Romper funcionalidad existente al mover código | Medium | Tests manuales exhaustivos, compar visuales antes/después |
| Perdida de props/context al extraeer | Medium | Mantener API unchanged, pasar todo via props |
| Conflictos de merge si hay trabajo paralelo | Low | Hacer refactor atomic, commit por componente |

## Rollback Plan

1. git checkout -- src/app/dashboard/admin/usuarios/page.tsx (restore original)
2. rm -rf src/components/admin/users/
3. rm -rf src/hooks/useUsers.ts
4. git checkout -- src/app/dashboard/page.tsx

**Total rollback**: 1 commit.

## Dependencies

- Ninguna dependencia externa
- Solo reorder del código existente

## Success Criteria

- [ ] admin/usuarios/page.tsx reduce de 927 a ~100 líneas
- [ ] 6 nuevos componentes en `src/components/admin/users/`
- [ ] PharmacyCheckboxGroup usa en CreateUserModal y EditUserModal (elimina duplicación)
- [ ] `useUsers.ts` contiene toda la lógica de estado y API
- [ ] dashboard/page.tsx no recrea array en cada render
- [ ] Funcionalidad idéntica verificada manualmente
- [ ] Tests pasan si existen