# Design: Fix Cloudinary Upload

## Technical Approach

Replace the client-side direct-to-Cloudinary upload with a backend API route (`POST /api/expenses/upload`) that receives the compressed image as multipart/form-data, converts to base64, and delegates to the existing `uploadInvoiceImage()` server helper. The expense form posts to this new route instead of Cloudinary's public API, keeping credentials server-side only.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Auth strategy | `getServerSession(authOptions)` | API key, no auth | Same pattern as all `/api/expenses/*` routes — consistent RBAC |
| File format in route | Buffer → base64 data URI | Stream directly, save to disk | `uploadInvoiceImage()` already accepts base64; avoids temporary file persistence |
| Form field `pharmacyCode` | Use `selectedPharmacyId` value | Add separate pharmacyCode DB field | MongoDB `_id` works as Cloudinary folder name — no new DB field or query needed |
| Request body format | `multipart/form-data` | JSON with base64 payload | Frontend already compresses to Blob; FormData avoids double encoding/decoding |

## Data Flow

```
ExpenseForm.tsx                    /api/expenses/upload/route.ts       Cloudinary
    │                                     │                              │
    │ 1. compressImage(file, 1000, 0.6)   │                              │
    │ 2. new FormData()                    │                              │
    │    .append('file', blob)             │                              │
    │    .append('pharmacyCode', id)       │                              │
    │ ──────────────────────────────────►  │                              │
    │                                      │ 3. getServerSession()       │
    │                                      │ 4. req.formData()           │
    │                                      │ 5. Buffer → base64 data URI │
    │                                      │ 6. uploadInvoiceImage()     │
    │                                      │ ───────────────────────────►│
    │                                      │ ◄── { url, publicId } ─────│
    │ ◄──────── { url, publicId } ────────│                              │
    │                                      │                              │
    │ 7. POST /api/expenses  ◄──── { invoiceImageUrl, invoicePublicId }  │
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/expenses/upload/route.ts` | Create | POST handler: auth → read FormData → base64 → uploadInvoiceImage → respond |
| `src/app/dashboard/gastos/ExpenseForm.tsx` | Modify | Replace `uploadToCloudinary()` with fetch to `/api/expenses/upload`, remove `upload_preset` and `NEXT_PUBLIC_*` refs |

## Interfaces / Contracts

**Request**: `POST /api/expenses/upload` — `multipart/form-data`
- `file` (Blob): compressed image
- `pharmacyCode` (string): pharmacy identifier (MongoDB `_id`; used as Cloudinary folder name)

**Success** (200):
```json
{ "url": "https://res.cloudinary.com/...", "publicId": "farmaflow/expenses/..." }
```

**Error responses**:
- `401` — `{ "error": "No autorizado" }` (no session)
- `400` — `{ "error": "Archivo no proporcionado" }` (missing file field)
- `500` — `{ "error": "Error al subir la imagen" }` (Cloudinary or server failure)

**Client response adapter** — the new endpoint returns `{ url, publicId }` (camelCase) vs Cloudinary's `{ secure_url, public_id }` (snake_case). The `onSubmit` handler must read `cloudData.url` and `cloudData.publicId` instead of `cloudData.secure_url` / `cloudData.public_id`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Upload route — auth guard | Mock `getServerSession`, assert 401 when null |
| Unit | Upload route — missing file | Assert 400 when FormData has no file |
| Unit | Upload route — success | Mock `uploadInvoiceImage`, assert 200 with expected shape |
| Unit | Upload route — Cloudinary error | Mock rejection from `uploadInvoiceImage`, assert 500 |
| Manual | Full browser flow | Upload a ticket image, verify it appears in Cloudinary under `farmaflow/expenses/{pharmacyCode}/` |

## Migration / Rollout

No migration required. After deployment remove `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` from `.env.local` and CI secrets. Rollback: revert `ExpenseForm.tsx` and delete `upload/route.ts`.

## Open Questions

None.
