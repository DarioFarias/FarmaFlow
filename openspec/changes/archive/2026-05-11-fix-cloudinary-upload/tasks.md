# Tasks: Fix Cloudinary Upload

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~120 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: API Route

- [x] 1.1 Create `src/app/api/expenses/upload/route.ts` with `getServerSession` auth guard returning 401
- [x] 1.2 Parse `multipart/form-data` extracting `file` (Blob) and `pharmacyCode`, validate file presence (400) and size limit (413)
- [x] 1.3 Convert file Buffer to base64 data URI, call `uploadInvoiceImage()`, return 200 `{ url, publicId }`
- [x] 1.4 Add catch-all error handler returning 500

## Phase 2: ExpenseForm Component

- [x] 2.1 Replace `uploadToCloudinary()` body with `fetch('/api/expenses/upload')` using FormData with `file` and `pharmacyCode`
- [x] 2.2 Update `onSubmit` to read `cloudData.url` / `cloudData.publicId` instead of `cloudData.secure_url` / `cloudData.public_id`
- [x] 2.3 Remove `upload_preset` string and `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` reference

## Phase 3: Testing

- [x] 3.1 Write test: route returns 401 when `getServerSession` returns null
- [x] 3.2 Write test: route returns 400 when FormData has no `file` field
- [x] 3.3 Write test: route returns 200 with `{ url, publicId }` when upload succeeds
- [x] 3.4 Write test: route returns 500 when `uploadInvoiceImage` throws
