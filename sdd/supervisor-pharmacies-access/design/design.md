# Design: Supervisor Pharmacies Access

## Context
El rol SUPERVISOR necesita acceso de solo lectura a `/dashboard/admin/farmacias` para gestionar insumos de las farmacias asignadas. Actualmente:
- **middleware**: solo permite ADMIN/SUPER_ADMIN a rutas admin
- **página**: trae TODAS las farmacias sin filtro
- **API**: permite ADMIN/SUPER_ADMIN

## Technical Approach

### 1. Middleware (`src/middleware.ts`)
Modificar la lógica para permitir SUPERVISOR específico a `/dashboard/admin/farmacias`:
- Mantener restricción original para otras rutas admin
- Agregar excepción específica para `/dashboard/admin/farmacias` donde permitan ADMIN, SUPER_ADMIN y SUPERVISOR

### 2. Página (`src/app/dashboard/admin/farmacias/page.tsx`)
- Obtener sesión actual para acceder a `assignedPharmacies` del token JWT
- Si el rol es SUPERVISOR, filtrar las farmacias por las asignadas
- Si es ADMIN/SUPER_ADMIN, mostrar todas
- Remover el fetch directo a DB y usar cliente de API para mejor control de permisos

### 3. API (`src/app/api/admin/pharmacies/route.ts`)
- Ya permite `isAdmin` (que incluye ADMIN y SUPER_ADMIN)
- Para GET (solo lectura), permitir también SUPERVISOR con filtro por sus assignedPharmacies

## File Changes

| File | Action |
|------|--------|
| src/middleware.ts | Modify - agregar excepción para SUPERVISOR en /dashboard/admin/farmacias |
| src/app/dashboard/admin/farmacias/page.tsx | Modify - agregar sesión y filtro por assignedPharmacies |
| src/app/api/admin/pharmacies/route.ts | Modify - permitir SUPERVISOR en GET con filtro |

## Implementation Details

### Middleware
```typescript
// Rutas que permiten ADMIN/SUPER_ADMIN
const adminRoutes = ['/dashboard/admin/usuarios', '/dashboard/admin/configuracion', '/api/admin']

// Rutas que permiten ADMIN/SUPER_ADMIN + SUPERVISOR
const supervisorAdminRoutes = ['/dashboard/admin/farmacias']

// En middleware:
if (supervisorAdminRoutes.some(r => pathname.startsWith(r))) {
  if (!hasPharmacyAccess(role)) { // isAdmin || isSupervisor
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }
}
```

### Página
```typescript
// Obtener sesión del server component
const session = await getServerSession(authOptions)
const role = session?.user?.role
const assignedPharmacies = session?.user?.assignedPharmacies || []

// Filtrar según rol
const farmacies = role === 'SUPERVISOR' 
  ? allFarmacias.filter(f => assignedPharmacies.includes(f._id.toString()))
  : allFarmacias
```

### API
```typescript
// GET - permitir lectura para SUPERVISOR también
if (!session || (!isSuperAdmin(role) && !hasPharmacyAccess(role))) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
}

// Si es SUPERVISOR, filtrar por sus farmacias
if (role === UserRole.SUPERVISOR) {
  const user = await User.findById(session.user.id)
  query._id = { $in: user.assignedPharmacies }
}
```

## Testing
1. Verificar SUPERVISOR puede acceder a `/dashboard/admin/farmacias`
2. Verificar SUPERVISOR ve solo las farmacias asignadas
3. Verificar ADMIN/SUPER_ADMIN ven todas las farmacias
4. Verificar otros roles no pueden acceder