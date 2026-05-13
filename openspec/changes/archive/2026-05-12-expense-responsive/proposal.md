# Proposal: expense-responsive

## Intent

Hacer responsive el módulo de gastos para mobile (360px+). La tabla de gastos es ilegible a partir de ~900px, el BatchActionToolbar desborda en <360px, los uploads ocupan espacio excesivo, y los filtros no colapsan. Todo esto hace imposible usar el módulo desde un celular.

## Scope

### In Scope
- **Tabla gastos** (`page.tsx`): cards en mobile con `hidden md:table-cell` / `block md:hidden`, manteniendo tabla en desktop
- **BatchActionToolbar**: contenedor con `max-w-lg w-[calc(100vw-2rem)]`, gap responsive, botón full-width en mobile
- **Upload aspect-ratio** (`ExpenseForm.tsx`): cambiar `aspect-[3/4]` a `aspect-video md:aspect-[3/4]` para reducir altura en mobile
- **Filtros collapsibles** (`page.tsx`): toggle "Filtros" en mobile, expandible inline, manteniendo `flex-wrap` en desktop
- **Test page.test.tsx**: corregir mock (usa `useExpenses` que la página real no importa) o deprecar test roto

### Out of Scope
- Sidebar/DashboardShell (ya responsive)
- API routes, modelos de datos, lógica de negocio
- ExpenseReview/AuditActions (no reportados como problema)
- Nuevas funcionalidades o cambios de comportamiento

## Capabilities

### New Capabilities
None — cambio puramente de presentación, sin nuevas capacidades a nivel spec.

### Modified Capabilities
None — ningún spec existente cambia sus requerimientos.

## Approach

**Tabla → cards**: Envolver cada `<tr>` con `className="block md:table-row"`. Cada celda con `className="block md:table-cell"` y pseudo-label via `::before` en mobile. `thead` oculto en mobile (`hidden md:table-header-group`).

**BatchActionToolbar**: Agregar `className="w-[calc(100vw-2rem)] max-w-lg"` al contenedor fijo, cambiar gap a `gap-2 md:gap-4`, botón con `className="flex-1 md:flex-none"`.

**Upload**: Cambiar `aspect-[3/4]` → `aspect-video md:aspect-[3/4]` en el contenedor de imagen.

**Filtros**: Botón "Filtros" que togglea visibilidad del filter row. Los filtros se renderizan siempre (manteniendo estado), solo se ocultan/muestran con CSS classes condicionales.

**Test**: Reemplazar mock de `useExpenses` por mocking de `fetch` + `useSession`. O deprecar el archivo si los tests existentes no agregan valor.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/dashboard/gastos/page.tsx` | Modified | +responsive cards, +filters toggle |
| `src/app/dashboard/gastos/ExpenseForm.tsx` | Modified | aspect-ratio change in upload |
| `src/components/gastos/BatchActionToolbar.tsx` | Modified | max-width, responsive layout |
| `src/app/dashboard/gastos/__tests__/page.test.tsx` | Modified | fix mock or deprecate |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Cards en mobile pierden info vs tabla desktop | Low | Usar pseudo-labels con `::before` data attributes |
| BatchActionToolbar overlap con otros elementos fixed | Low | Verificar z-index y posición en viewports reales |
| Test page.test.tsx roto tras cambios | Med | Reescribir mock antes de modificar página |

## Rollback Plan

Revertir commits individuales por archivo. Los cambios son puramente CSS/JSX sin tocar lógica de negocio ni API — revertir es seguro y sin side effects.

## Dependencies

Ninguna.

## Success Criteria

- [ ] Tabla de gastos legible y operable en viewports 360px, 768px, 1024px, 1440px
- [ ] BatchActionToolbar no desborda horizontalmente en ningún viewport
- [ ] Upload de imagen no ocupa >50% del viewport height en mobile
- [ ] Filtros colapsables funcionan en mobile sin perder estado
- [ ] Tests pasan (`vitest run`)
