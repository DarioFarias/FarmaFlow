# Especificación: Batch Action

## Propósito

Operaciones por lote sobre gastos mediante un único endpoint unificado. Reemplaza 3 rutas separadas (`batch-approve`, `batch-report`, `batch-return`) por `POST /api/expenses/batch` con despacho por `action`.

## Requisitos

### R1: Endpoint unificado con despacho por action

El sistema DEBE exponer `POST /api/expenses/batch` que acepte `{ action, expenseIds, period?, notes? }`. El campo `action` DEBE ser `"approve"`, `"report"` o `"return"`. El endpoint DEBE despachar a la lógica de transición correcta según `action`.

#### Escenario: Approve en endpoint unificado

- DADO gastos en estado `PENDIENTE_DE_FACTURAR` con pdfUrl y xmlUrl válidos
- CUANDO se llama `POST /api/expenses/batch` con `{ action: "approve", expenseIds: [...] }`
- ENTONCES los gastos válidos transicionan a `FACTURADO`

#### Escenario: Report en endpoint unificado

- DADO gastos en estado `FACTURADO`
- CUANDO se llama `POST /api/expenses/batch` con `{ action: "report", expenseIds: [...], period: "2026-05", notes?: "..." }`
- ENTONCES los gastos válidos transicionan a `REPORTED` con `period` seteado

#### Escenario: Return en endpoint unificado

- DADO gastos en estado `REPORTED`
- CUANDO se llama `POST /api/expenses/batch` con `{ action: "return", expenseIds: [...] }`
- ENTONCES los gastos válidos transicionan a `PENDIENTE_DE_PAGO` con nota "Devuelto para pago"

### R2: Respuesta estandarizada para todas las acciones

Todas las acciones DEBEN devolver `{ processed, failed, total, results }` dentro de `data`. El arreglo `results` DEBE contener objetos `{ id, success, error? }` por cada gasto procesado.

#### Escenario: Resultado mixto devuelve conteos correctos

- DADO 3 gastos donde 2 son válidos y 1 tiene estado inválido
- CUANDO se ejecuta una acción batch sobre los 3
- ENTONCES la respuesta contiene `{ processed: 2, failed: 1, total: 3, results: [...] }`

### R3: Validación mediante batchActionSchema

El cuerpo de la solicitud DEBE validarse contra `batchActionSchema`. El schema DEBE definir:
- `action`: enum `["approve", "report", "return"]`
- `expenseIds`: arreglo de strings, mínimo 1, máximo 50
- `period`: string regex `^\d{4}-\d{2}$`, REQUERIDO cuando action es `"report"`
- `notes`: string opcional, máximo 500 caracteres

#### Escenario: Period faltante en report devuelve 400

- DADO una solicitud con `{ action: "report", expenseIds: ["..."] }` sin `period`
- CUANDO se llama `POST /api/expenses/batch`
- ENTONCES el endpoint devuelve 400 con error de validación

#### Escenario: Action inválido devuelve 400

- DADO una solicitud con `{ action: "pay", expenseIds: ["..."] }`
- CUANDO se llama `POST /api/expenses/batch`
- ENTONCES el endpoint devuelve 400 con error de validación

### R4: Autenticación y autorización

El endpoint DEBE requerir sesión autenticada y rol admin (`ADMIN` o `SUPERVISOR`). Solicitudes no autenticadas DEBEN recibir 401; solicitudes de no-admin DEBEN recibir 403.

#### Escenario: Sin sesión devuelve 401

- DADO que no hay sesión activa
- CUANDO se llama `POST /api/expenses/batch`
- ENTONCES el endpoint devuelve 401

#### Escenario: VENDEDOR recibe 403

- DADO una sesión con rol `VENDEDOR`
- CUANDO se llama `POST /api/expenses/batch`
- ENTONCES el endpoint devuelve 403

### R5: Transición approve valida pdfUrl/xmlUrl

El action `"approve"` DEBE validar que cada gasto tenga `pdfUrl` y `xmlUrl` definidos antes de transicionar a `FACTURADO`. Si faltan, el gasto DEBE registrarse como fallido sin abortar el lote completo.

#### Escenario: Gasto sin pdfUrl se omite

- DADO un gasto en `PENDIENTE_DE_FACTURAR` sin `pdfUrl`
- CUANDO se ejecuta action `"approve"` incluyendo ese gasto
- ENTONCES el resultado para ese gasto es `{ success: false, error: "Falta pdfUrl o xmlUrl" }`
- Y los demás gastos se procesan normalmente

### R6: Report es todo-o-nada

El action `"report"` DEBE validar TODOS los gastos primero (que estén en `FACTURADO`). Si alguno falla la validación, el endpoint DEBE devolver 400 SIN actualizar ningún gasto.

#### Escenario: Report con gasto no FACTURADO falla todo

- DADO 2 gastos, uno en `FACTURADO` y otro en `PENDIENTE_DE_FACTURAR`
- CUANDO se ejecuta action `"report"` incluyendo ambos
- ENTONCES el endpoint devuelve 400
- Y ningún gasto cambia de estado

### R7: Return es por-item (éxito parcial permitido)

El action `"return"` DEBE procesar cada gasto individualmente. Si un gasto no está en `REPORTED`, DEBE fallar ese ítem sin abortar los demás.

#### Escenario: Return mixto procesa los válidos

- DADO 2 gastos, uno en `REPORTED` y otro en `FACTURADO`
- CUANDO se ejecuta action `"return"` incluyendo ambos
- ENTONCES el gasto en `REPORTED` transiciona a `PENDIENTE_DE_PAGO`
- Y el gasto en `FACTURADO` aparece como fallido en `results`
- Y la respuesta muestra `processed: 1, failed: 1`

### R8: Rutas antiguas redirigen al endpoint unificado

Las rutas `POST /api/expenses/batch-approve`, `POST /api/expenses/batch-report` y `POST /api/expenses/batch-return` DEBEN mantenerse como wrappers delgados que redirigen al nuevo endpoint unificado con el `action` correspondiente. Esto garantiza compatibilidad hacia atrás.

#### Escenario: batch-approve legacy funciona

- DADO un caller externo que usa `POST /api/expenses/batch-approve`
- CUANDO se envía `{ expenseIds: [...], notes: "..." }`
- ENTONCES la respuesta es idéntica a llamar `POST /api/expenses/batch` con `action: "approve"`

#### Escenario: batch-report legacy funciona

- DADO un caller externo que usa `POST /api/expenses/batch-report`
- CUANDO se envía `{ expenseIds: [...], period: "2026-05" }`
- ENTONCES la respuesta es idéntica a llamar `POST /api/expenses/batch` con `action: "report"`
