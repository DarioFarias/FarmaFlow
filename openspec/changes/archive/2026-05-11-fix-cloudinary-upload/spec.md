# Delta Spec: fix-cloudinary-upload

**Domain**: Infrastructure (cross-cutting)
**Type**: Delta — internal architecture refactor, no user-facing capability changes.

## ADDED Requirements

### Requirement: Server-Side Upload Endpoint

The system MUST expose `POST /api/expenses/upload` accepting `multipart/form-data` with a `file` field (image Blob) and `pharmacyCode` (string). The endpoint MUST authenticate via `getServerSession(authOptions)` and return 401 on failure. On success, it MUST convert the file to base64, call `uploadInvoiceImage(base64, pharmacyCode)` from `src/lib/cloudinary.ts`, and return `{ url, publicId }`.

#### Scenario: Successful upload

- GIVEN an authenticated user session
- WHEN a POST to `/api/expenses/upload` includes a valid image file and pharmacyCode
- THEN the endpoint returns 200 with `{ url, publicId }`

#### Scenario: Unauthenticated request

- GIVEN no valid session
- WHEN a POST is sent to `/api/expenses/upload`
- THEN the endpoint returns 401

#### Scenario: Missing file field

- GIVEN an authenticated session
- WHEN a POST to `/api/expenses/upload` omits the `file` field
- THEN the endpoint returns 400

### Requirement: Upload File Size Limit

The endpoint MUST reject files over 10MB returning 413.

#### Scenario: Oversized file

- GIVEN an authenticated session
- WHEN a POST to `/api/expenses/upload` includes a file larger than 10MB
- THEN the endpoint returns 413

## MODIFIED Requirements

### Requirement: Expense Form Image Upload

The ExpenseForm component MUST POST image uploads to `/api/expenses/upload` instead of directly to Cloudinary. It MUST pass the compressed Blob and `pharmacyCode` as FormData. It MUST NOT reference `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` or `upload_preset`. The `onSubmit` flow (compress → upload → create expense) MUST remain unchanged.
(Previously: The form uploaded directly to Cloudinary using public env vars and a hardcoded upload preset.)

#### Scenario: Upload via proxy

- GIVEN the user is authenticated and completing the expense form
- WHEN the user selects an invoice image and submits
- THEN the form compresses the image, POSTs it to `/api/expenses/upload`, receives `{ url, publicId }`, and proceeds to create the expense

#### Scenario: Auth failure during upload

- GIVEN the session has expired
- WHEN the user attempts to upload an invoice image
- THEN the proxy returns 401 and the form surfaces an authentication error

## REMOVED Requirements

### Requirement: Public Cloudinary Env Vars

The system MUST NOT require `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` or any `NEXT_PUBLIC_*` Cloudinary variable for expense invoice uploads.
(Reason: Uploads now route through the server-side proxy using existing server-only credentials.)
