# Design: expense-responsive

## Technical Approach

Cambios puramente de presentación (CSS + JSX condicional) en 4 componentes, sin tocar lógica de negocio ni API. Estrategia: dual-render (tabla desktop + cards mobile) con toggle via `useState` para filtros. Tests se reescribe de cero mockeando `fetch`.

## Architecture Decisions

### Decision: Table → Cards via dual-render blocks

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| `block md:table-row` en cada `<tr>` | Barajar display modes de table pelea con browsers | ❌ |
| **Dual-render: tabla envuelta + sección de cards separada** | Más markup duplicado, pero limpio y testeable | ✅ |
| CSS `display: contents` | Soporte inconsistente en mobile | ❌ |

**Rationale**: La tabla desktop se envuelve en `hidden md:block`. Los cards van en `block md:hidden`. Evita bugs de CSS table display en mobile y permite estructurar cada card con labels semánticos.

### Decision: Collapsible filters via useState

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| **useState + clases condicionales** | Simple, estado se mantiene al togglear | ✅ |
| CSS `peer` + `hidden` con checkbox oculto | Más boilerplate, menos mantenible | ❌ |
| `details`/`summary` HTML nativo | Estilo inconsistente entre browsers | ❌ |

**Rationale**: useState es el patrón existente en el componente (`selectedIds`, `filters`, `pagination`). Consistente con la codebase.

### Decision: Rewrite test page.test.tsx from scratch

| Opción | Tradeoff | Decisión |
|--------|----------|----------|
| **Reescribir mock para usar fetch + useSession** | Tests reflejan la implementación real | ✅ |
| Deprecar archivo | Se pierde cobertura de regresión | ❌ |
| Parchear mock existente | El mismatch conceptual (useExpenses vs fetch) es grande | ❌ |

**Rationale**: El test mockea `useExpenses` que la página real no importa desde hace varias iteraciones. Cambiar a `fetch` mock da cobertura real. Aprox 200 líneas nuevas.

## Data Flow

Sin cambios en el data flow. El fetch, estado local, y handlers son idénticos. Solo cambia la presentación condicional (mobile vs desktop).

```
page.tsx (fetchGastos + useState) ──→ tabla desktop (hidden md:block)
                                    ──→ cards mobile (block md:hidden)
                                       └── toggleSelectOne / selectedIds ← mismo estado
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/dashboard/gastos/page.tsx` | Modify | +cards section, +filters toggle, +responsive containers |
| `src/components/gastos/BatchActionToolbar.tsx` | Modify | +responsive widths/gaps/truncation |
| `src/app/dashboard/gastos/ExpenseForm.tsx` | Modify | aspect-ratio cambio en upload imagen |
| `src/app/dashboard/gastos/__tests__/page.test.tsx` | Rewrite | Reemplazar mock useExpenses → mock fetch |

## 1. Responsive List (page.tsx) — líneas 362-494

### Estrategia

Dual-render: tabla desktop existente + nueva sección de cards. Mismo array `gastos`, mismos handlers `toggleSelectOne`, `selectedIds`, `toggleSelectAll`. La paginación se comparte abajo de todo.

### Cambios concretos

**A. Envolver tabla desktop** (line 363):
```
// Antes:
<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
  <table ...>

// Después:
<div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
  <table ...>
```

**B. Agregar sección de cards** (entre línea 460 — cierre `</tbody></table></div>` — y la paginación en línea 462):

```tsx
{/* Mobile: Cards view */}
<div className="block md:hidden space-y-3">
  {gastos.length === 0 ? (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
      <Receipt size={32} className="mx-auto mb-3 text-gray-300" />
      <p className="text-gray-400 text-sm italic">No hay gastos registrados todavía.</p>
    </div>
  ) : (
    gastos.map((g) => {
      const statusInfo = STATUS_CONFIG[g.status] || { label: g.status, classes: 'bg-gray-50' }
      const isSelected = selectedIds.includes(g._id)
      return (
        <div key={g._id} className={`bg-white rounded-xl shadow-sm border p-4 space-y-2 ${isSelected ? 'border-brand-500 ring-2 ring-brand-100' : 'border-gray-100'}`}>
          {/* Header row: checkbox + expenseNumber + status */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <input type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelectOne(g._id)}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500 shrink-0 mt-0.5"
              />
              <span className="font-bold text-sm text-gray-900 truncate">{g.expenseNumber}</span>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold ring-1 ring-inset shrink-0 ${statusInfo.classes}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Detail rows */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <div>
              <span className="text-gray-400 text-xs block">Fecha</span>
              <span className="text-gray-700">
                {g.receiptDate ? format(new Date(g.receiptDate), 'dd MMM, yyyy', { locale: es }) : '-'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-xs block">Monto</span>
              <span className="text-gray-900 font-medium">{g.currency} {g.amount.toLocaleString('es-MX')}</span>
            </div>
            {isUserAdmin && (
              <div className="col-span-2">
                <span className="text-gray-400 text-xs block">Sucursal</span>
                <span className="text-gray-600">{g.pharmacyName}</span>
              </div>
            )}
            <div className="col-span-2">
              <span className="text-gray-400 text-xs block">Descripción</span>
              <span className="text-gray-900">{g.description}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-50">
            {g.status === ExpenseStatus.PENDIENTE_DE_FACTURAR ? (
              <Link href={`/dashboard/gastos/${g._id}/editar`}
                className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                Editar
              </Link>
            ) : <div />}
            {isUserAdmin && (
              <AuditActions id={g._id} type="expense" currentStatus={g.status} />
            )}
          </div>
        </div>
      )
    })
  )}
</div>
```

**C. Selected count badge** (líneas 497-501): se mantiene igual. Funciona en ambos viewports. El `fixed top-20 right-4` ya está bien posicionado.

**D. Paginación** (líneas 462-493): se queda exactamente igual, fuera del wrapper de tabla y fuera del wrapper de cards. Visible en ambos viewports.

### Archivos

- `src/app/dashboard/gastos/page.tsx` — modificar desde línea 362 a 501

---

## 2. Collapsible Filters (page.tsx) — líneas 264-353

### Estrategia

Agregar `showFilters` state + toggle button visible solo en mobile. Los filtros se renderizan siempre (no se desmontan) para preservar estado interno de los `<select>` e `<input>`.

### Cambios concretos

**A. Agregar estado** (junto a los otros useState, después de línea 96):
```tsx
const [showFilters, setShowFilters] = useState(true)
```

**B. Toggle button** (justo después de abrir el `<div>` de filters section, entre líneas 264-265):
```tsx
<button
  onClick={() => setShowFilters(prev => !prev)}
  className="md:hidden flex items-center gap-2 text-sm font-medium text-gray-700 mb-3"
>
  {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
  Filtros
</button>
```

Importar `ChevronUp`, `ChevronDown` de `lucide-react` (line 7).

**C. Envolver filtros actuales** (el `flex flex-wrap gap-4 items-end` de línea 265):
```tsx
<div className={`${showFilters ? 'block' : 'hidden'} md:flex md:flex-wrap md:gap-4 md:items-end`}>
  {/* same filter content as now, sin cambios */}
</div>
```

El `useState` default `true` significa que en desktop arranca visible (y el `md:flex` fuerza display flex independientemente del state). En mobile, la clase `hidden`/`block` controla visibilidad.

### Alternativa considerada

CSS puro con `group` + `has()`: funcionaría pero pierde la capacidad de animar la transición. useState permite agregar `transition-all` después si se desea.

### Archivos

- `src/app/dashboard/gastos/page.tsx` — agregar import `ChevronUp, ChevronDown`, agregar useState, modificar section de filtros (líneas 264-265)

---

## 3. Responsive BatchActionToolbar (BatchActionToolbar.tsx) — línea 87

### Estrategia

Ajustar padding, gap, y width del toolbar para que no desborde en mobile. Truncar labels largos con `truncate`.

### Cambios concretos

**A. Container** (línea 87):
```tsx
// Antes:
<div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 flex items-center gap-4 z-50">

// Después:
<div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 p-3 md:p-4 flex items-center gap-2 md:gap-4 z-50">
```

**B. Label de acción** (línea 104): envolver en un span con truncate:
```tsx
// Antes:
{getActionLabel()}

// Después:
<span className="truncate">{getActionLabel()}</span>
```

**C. Botón de acción** (líneas 94-105): agregar `min-w-0 flex-1 md:flex-none` para que el botón ocupe todo el ancho disponible en mobile:
```tsx
// Antes:
<button onClick={handleBatchAction} disabled={isLoading}
  className="btn-primary flex items-center gap-2">

// Después:
<button onClick={handleBatchAction} disabled={isLoading}
  className="btn-primary flex items-center gap-2 min-w-0 flex-1 md:flex-none">
```

**D. Label "X seleccionados"** (línea 88): agregar `whitespace-nowrap`:
```tsx
<span className="text-sm font-medium text-gray-700 whitespace-nowrap">
  {selectedIds.length} seleccionados
</span>
```

### Archivos

- `src/components/gastos/BatchActionToolbar.tsx` — modificar línea 87 y 88-105

---

## 4. Responsive Upload Area (ExpenseForm.tsx) — línea 360

### Estrategia

Cambiar aspect-ratio del upload de imagen de 3:4 (vertical, tipo retrato) a 16:9 (video) en mobile. Desktop mantiene 3:4.

### Cambio concreto

**Línea 360:**
```tsx
// Antes:
<div className="relative aspect-[3/4] rounded-xl border-2 ...">

// Después:
<div className="relative aspect-video md:aspect-[3/4] rounded-xl border-2 ...">
```

No tocar los uploads de PDF (líneas 412-421) ni XML (líneas 446-455) — no tienen `aspect-*` classes.

### Archivos

- `src/app/dashboard/gastos/ExpenseForm.tsx` — cambiar línea 360

---

## 5. Test Fix (page.test.tsx)

### Problema

El test importa y mockea `useExpenses` de `@/lib/hooks/use-expenses` pero `page.tsx` NO usa ese hook — usa `fetch()` directo + `useSession`. Todos los tests de datos fallan. También mockea `AuditActions` (que sí se usa) y `next-auth/react` (que sí se usa).

### Estrategia

**Solución**: Reescribir el archivo completo. Los tests existentes cubren 9 escenarios pero contra una implementación que no es la real. El archivo nuevo ~200 líneas con:

- Mock `fetch` global (via `vi.fn()`) devolviendo datos mock en `/api/expenses?...`
- Mock `next-auth/react` con `useSession` (se mantiene igual)
- Mock `AuditActions` (se mantiene igual)
- Tests clave:
  1. Loading state: spinner visible al mount
  2. Render list: expenseNumber, description, amount se renderizan
  3. Status badge visible
  4. Pharmacy column para admin
  5. AuditActions renderizados para admin
  6. Empty state: "No hay gastos registrados"
  7. Edit button para PENDIENTE_DE_FACTURAR
  8. No edit button para PAID
  9. Pagination controls visibles cuando hay datos
  10. Filter section visible por defecto en desktop

```tsx
// Estructura del nuevo mock de fetch:
const mockFetch = vi.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
  mockFetch.mockResolvedValue({
    json: () => Promise.resolve({
      data: [/* mock expenses */],
      total: 4,
      totalPages: 1,
      page: 1,
    })
  })
})
```

**No** wrapper de `QueryClientProvider` — la página real no lo necesita.

### Archivos

- `src/app/dashboard/gastos/__tests__/page.test.tsx` — reemplazar contenido completo

---

## Interfaces / Contracts

No se introducen nuevas interfaces. Las existentes (`IExpenseResponse`, `ExpenseFilters`, `PaginationInfo`) no cambian. El componente `BatchActionToolbar` mantiene su interfaz actual.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | page.tsx render condicional (tabla vs cards) | Mock fetch + useSession, verificar elementos visibles por breakpoint |
| Unit | Filters toggle en mobile | Mock fetch, click en botón "Filtros", verificar visibilidad de selects |
| Unit | BatchActionToolbar overflow | Renderizar con selectedIds largos, verificar que no desborda horizontalmente en viewport 360px |
| Unit | ExpenseForm upload aspect-ratio | Renderizar en mobile vs desktop, verificar classNames |

## Migration / Rollout

No migration required. Cambios puramente de presentación, sin feature flags ni datos que migrar.

## Open Questions

- [ ] ¿El badge de selección `fixed top-20 right-4` interfiere con el header en mobile? Verificar en viewport 360px. Potencialmente mover a `top-4 right-4` en mobile.
- [ ] ¿La paginación (Mostrando X-Y de Z) se ve bien en mobile? Considerar ocultar "Mostrando" text o hacerlo más compacto via `hidden sm:inline`.
