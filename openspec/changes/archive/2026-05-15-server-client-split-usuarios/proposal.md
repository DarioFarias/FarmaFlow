# SDD Proposal: server-client-split-usuarios

**What**: SDD Proposal for splitting usuarios page into Server + Client Component architecture
**Why**: Eliminate 'use client' monolith (293 lines), enable SSR/metadata/SEO, follow proven farmacias pattern
**Where**: src/app/dashboard/admin/usuarios/page.tsx, UsuariosListClient.tsx, UsersToolbar.tsx, UsersPagination.tsx, src/lib/services/users.ts, src/lib/services/__tests__/users.test.ts
**Learned**: Usuarios needs pharmacies data for modal dropdowns, so Server Component must also fetch pharmacies via Pharmacy model. Toolbar is simpler than farmacias — only search, no status filter or sort. Shared service must replicate API route logic including getCreatableRoles() and SUPERVISOR assignedPharmacies filtering.
