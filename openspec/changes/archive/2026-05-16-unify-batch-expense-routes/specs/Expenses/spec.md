# Delta para Expenses

## Requisitos MODIFICADOS

### Requisito: Operaciones batch DEBEN usar endpoint unificado

(Todos los requisitos batch fueron reemplazados: antes usaban rutas separadas con un helper compartido)

Los módulos de gastos DEBEN canalizar todas las operaciones batch (approve, report, return) a través de `POST /api/expenses/batch` con `{ action, expenseIds, period?, notes? }`. Las rutas antiguas (`batch-approve`, `batch-report`, `batch-return`) existen como wrappers delgados para compatibilidad. El schema de Expense DEBE definir las transiciones válidas en un solo lugar.

#### Escenario: Approve vía endpoint unificado

- DADO un gasto en estado `PENDIENTE_DE_FACTURAR` con pdfUrl y xmlUrl válidos
- CUANDO se ejecuta la acción approve a través del endpoint unificado
- ENTONCES el gasto transiciona a `FACTURADO`

#### Escenario: Report vía endpoint unificado

- DADO un gasto en estado `FACTURADO`
- CUANDO se ejecuta la acción report a través del endpoint unificado con `period`
- ENTONCES el gasto transiciona a `REPORTED`

#### Escenario: Transición duplicada rechazada

- DADO un gasto que ya está en estado `REPORTED`
- CUANDO se ejecuta una acción batch que intenta approve ese gasto
- ENTONCES el resultado incluye un fallo para ese gasto sin arrojar error global
