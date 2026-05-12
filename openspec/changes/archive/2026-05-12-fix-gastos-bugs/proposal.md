# Proposal: fix-gastos-bugs

## Intent

Corregir 11 bugs en el módulo de gastos que causan fuga de datos entre farmacias, falsos 403, permisos inconsistentes, y validaciones rotas. El detonante fue un reporte de usuario: VENDEDOR ve 3 gastos pero SUPERVISOR ve solo 2.

## Scope

### In Scope
- Bug #1 (CRÍTICO): GET /api/expenses sin filtro pharmacy para roles no-admin
- Bug #2 (CRÍTICO): GET /api/expenses/[id] compara ObjectId de pharmacy vs user — siempre 403
- Bug #3 (CRÍTICO): isAdmin() no incluye SUPERVISOR (bloquea backend)
- Bug #4 (MEDIA): Tests mockean isAdmin con SUPERVISOR — pasan en CI, fallan en prod
- Bug #5 (ALTA): Filtro por fecha rechaza YYYY-MM-DD (z.string().datetime())
- Bug #6 (ALTA): SUPERVISOR elude filtro de pharmacy por query param
- Bug #7 (MEDIA): isModified() propio choca con Document.isModified() de Mongoose
- Bug #8 (ALTA): PATCH sin ownership check — cualquier usuario edita cualquier gasto
- Bug #9 (MEDIA): batch-approve y batch-report comparten lógica duplicada
- Bug #10 (BAJA): Naming inconsistente en expenseNumber hook
- Bug #11 (BAJA): Fechas en expenseNumber hook con desfase

### Out of Scope
- Refactor completo del módulo de gastos
- Migración de base de datos o schema changes
- Nuevas features (reportes, exportación, etc.)

## Capabilities

### New Capabilities
None — no se introducen nuevas capacidades, solo correcciones.

### Modified Capabilities
- `Infrastructure` (spec: `openspec/specs/Infrastructure/spec.md`): Las APIs de expenses cambian reglas de autorización y ownership. Se requiere delta spec.

## Approach

Prioridad por severidad (CRÍTICO → ALTA → MEDIA → BAJA):
1. **#3, #4**: Corregir `isAdmin()` en `src/lib/roles.ts` — incluir `SUPERVISOR`.
2. **#1, #6**: En GET /api/expenses, forzar filtro `pharmacy` según rol (query param ignorado para no-admin).
3. **#2**: En GET /api/expenses/[id], comparar `pharmacy` del expense con `pharmacy` del user.
4. **#8**: En PATCH /api/expenses/[id], agregar ownership check + `isAdmin()`.
5. **#5**: Cambiar validación de fecha a `z.coerce.date()` o regex YYYY-MM-DD.
6. **#7**: Renombrar función `isModified()` en modelo Expense.
7. **#9**: Unificar lógica batch en helper compartido.
8. **#10, #11**: Arreglar naming y desfase horario en hook.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/lib/roles.ts` | Modified | isAdmin() incluye SUPERVISOR |
| `src/models/Expense.ts` | Modified | Renombrar isModified(), corregir validaciones |
| `src/app/api/expenses/route.ts` | Modified | Filtro pharmacy obligatorio + validación fecha |
| `src/app/api/expenses/[id]/route.ts` | Modified | Ownership check en GET y PATCH |
| `src/lib/validations.ts` | Modified | Schema fecha acepta YYYY-MM-DD |
| `src/app/dashboard/gastos/hooks/useExpenseNumber.ts` | Modified | Naming + timezone offset |
| Tests existentes | Modified | Mock isAdmin() sincronizado con prod |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Regression en permisos existentes | Med | Tests existentes + verificación manual de flujos ADMIN |
| Filtro pharmacy rompe consultas legítimas de admin | Baja | Admin NO recibe filtro forzado — solo no-admin |
| Cambio en isModified() rompe hooks Mongoose | Med | Review manual de todos los `pre('save')` en Expense |

## Rollback Plan

1. `git revert HEAD~N` sobre los commits de este cambio, o `git reset --hard main` si no hay otros cambios en la rama.
2. Verificar que isAdmin() vuelve al estado anterior (sin SUPERVISOR).
3. Verificar que GET /api/expenses no filtra por pharmacy.

## Dependencies

- Ninguna externa. Todo el cambio es sobre código existente.

## Success Criteria

- [ ] VENDEDOR ve solo gastos de SU farmacia
- [ ] SUPERVISOR ve gastos de TODAS las farmacias
- [ ] GET /api/expenses/[id] no devuelve 403 para dueño del gasto
- [ ] PATCH /api/expenses/[id] rechaza edición de gastos ajenos
- [ ] Filtro por fecha acepta YYYY-MM-DD
- [ ] Tests existentes + nuevos pasan verdes
- [ ] isAdmin() en backend coincide con frontend
