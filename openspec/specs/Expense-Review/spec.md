# Expense-Review Specification

## Purpose

Enable supervisors to review `PENDIENTE_DE_FACTURAR` expenses: approve transitions to `FACTURADO`, reject adds an `adminComment` without changing status.

## Requirements

### Requirement: Approve MUST transition expense to FACTURADO

Supervisors MUST be able to approve a `PENDIENTE_DE_FACTURAR` expense, transitioning it to `FACTURADO`. Only `PENDIENTE_DE_FACTURAR` expenses SHALL be eligible for approval. The approval action SHALL store `approvedAt` and `approvedBy` on the expense document.

#### Scenario: Approve PENDIENTE_DE_FACTURAR expense

- GIVEN a SUPERVISOR user and an expense with status `PENDIENTE_DE_FACTURAR`
- WHEN the supervisor calls the approve action
- THEN the expense transitions to `FACTURADO` (200)
- AND `approvedBy` and `approvedAt` are set on the expense

#### Scenario: Approve on FACTURADO returns 400

- GIVEN a SUPERVISOR user and an expense with status `FACTURADO`
- WHEN the supervisor calls the approve action
- THEN the endpoint returns 400

### Requirement: Reject MUST add adminComment without status change

Supervisors MUST be able to reject a `PENDIENTE_DE_FACTURAR` expense by providing an `adminComment`. The expense status MUST remain `PENDIENTE_DE_FACTURAR`. The `adminComment` and `rejectedAt` timestamp SHALL be stored on the expense document.

#### Scenario: Reject with comment

- GIVEN a SUPERVISOR user and an expense with status `PENDIENTE_DE_FACTURAR`
- WHEN the supervisor rejects with adminComment "Falta comprobante"
- THEN the expense stays `PENDIENTE_DE_FACTURAR`
- AND `adminComment` equals "Falta comprobante"
- AND `rejectedAt` is set

#### Scenario: Reject without comment returns 400

- GIVEN a SUPERVISOR user and an expense with status `PENDIENTE_DE_FACTURAR`
- WHEN the supervisor rejects without an adminComment
- THEN the endpoint returns 400

### Requirement: AuditActions MUST show Approve/Reject for PENDIENTE_DE_FACTURAR

The `AuditActions` component MUST render Approve and Reject buttons only for expenses with status `PENDIENTE_DE_FACTURAR`. For `FACTURADO` or beyond, AuditActions SHALL show a badge without action buttons. Reject SHALL include an inline comment input field.

#### Scenario: Approve/Reject visible for PENDIENTE_DE_FACTURAR

- GIVEN an expense detail page for a `PENDIENTE_DE_FACTURAR` expense
- WHEN a SUPERVISOR views the page
- THEN AuditActions shows Approve and Reject buttons

#### Scenario: Only badge for FACTURADO

- GIVEN an expense detail for a `FACTURADO` expense
- WHEN a SUPERVISOR views the page
- THEN AuditActions shows a "Facturado" badge
- AND no action buttons are rendered

#### Scenario: VENDEDOR sees no review actions

- GIVEN an expense detail for a `PENDIENTE_DE_FACTURAR` expense
- WHEN a VENDEDOR views the page
- THEN AuditActions shows no Approve/Reject buttons

### Requirement: Rejected expense MUST surface adminComment in detail

The expense detail view MUST display `adminComment` and `rejectedAt` when present, with clear visual distinction indicating the expense was reviewed and rejected.

#### Scenario: Rejected expense shows comment and date

- GIVEN an expense with `adminComment` = "Falta comprobante" and a `rejectedAt` date
- WHEN viewing the expense detail
- THEN the comment and rejection date are visible in the UI
