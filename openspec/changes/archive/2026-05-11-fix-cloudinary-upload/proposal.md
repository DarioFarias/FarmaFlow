# Proposal: Fix Cloudinary Upload

## Intent

The expense form uploads images directly to Cloudinary from the client using `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, which is undefined — only server-side Cloudinary env vars exist (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`). The request hits `api.cloudinary.com/v1_1/undefined/...` and fails. The server already has `uploadInvoiceImage()` in `src/lib/cloudinary.ts` that uses server credentials and organizes files by pharmacy. This change routes uploads through a backend endpoint instead.

## Scope

### In Scope
- Create `POST /api/expenses/upload` route that receives the file, uploads via `uploadInvoiceImage()`, returns URL + publicId
- Modify `ExpenseForm.tsx` to POST to `/api/expenses/upload` instead of Cloudinary directly
- Remove dependency on `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

### Out of Scope
- Other image uploads (profile image, etc.)
- Changes to the existing `cloudinary.ts` helpers

## Capabilities

### New Capabilities
None — pure refactor, user-facing behavior unchanged.

### Modified Capabilities
None — no spec-level requirements change.

## Approach

1. **Create `src/app/api/expenses/upload/route.ts`**:
   - Auth: `getServerSession(authOptions)` (same pattern as other `/api/expenses/*` routes)
   - Accept `POST` with `FormData` containing `file` (Blob) and `pharmacyCode` (string)
   - Convert the uploaded file to base64
   - Call `uploadInvoiceImage(base64, pharmacyCode)` from `@/lib/cloudinary`
   - Return `{ url, publicId }`

2. **Modify `src/app/dashboard/gastos/ExpenseForm.tsx`**:
   - Replace `uploadToCloudinary()` with a call to `POST /api/expenses/upload`
   - Pass the compressed Blob via FormData with `pharmacyCode`
   - Remove `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `upload_preset`
   - The `onSubmit` flow stays the same: compress → upload → create expense

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/app/api/expenses/upload/route.ts` | New | Server endpoint proxying upload to Cloudinary SDK |
| `src/app/dashboard/gastos/ExpenseForm.tsx` | Modified | Remove direct client-side Cloudinary upload |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Large files fail base64 conversion | Low | File size validation in route; frontend already compresses to 1000px/0.6 quality |
| Missing session blocks upload | Low | Route returns 401; frontend will show auth error |
| Cloudinary server credentials misconfigured | Low | Same credentials used by existing working endpoints |

## Rollback Plan

Revert `ExpenseForm.tsx` to previous version and delete `src/app/api/expenses/upload/route.ts`. The original code still compiles — it just needs `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` set in `.env.local`.

## Dependencies

- `src/lib/cloudinary.ts` — already exists with `uploadInvoiceImage()`
- `src/lib/auth.ts` — already exists with `authOptions`

## Success Criteria

- [ ] Uploading an expense invoice succeeds without `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- [ ] Cloudinary credentials stay server-side only (no new `NEXT_PUBLIC_*` vars)
- [ ] Images are organized in `farmaflow/expenses/{pharmacyCode}/` folder
- [ ] Existing tests still pass
