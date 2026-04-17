import { UserRole } from '@/types'

// =============================================
// JERARQUÍA DE ROLES (constante centralizada)
// =============================================
// Nivel más bajo = número mayor (VENDEDOR = 4)
// Un usuario puede crear usuarios de nivel superior (número mayor)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 0,
  [UserRole.ADMIN]: 1,
  [UserRole.SUPERVISOR]: 2,
  [UserRole.ENCARGADO]: 3,
  [UserRole.VENDEDOR]: 4,
}

/**
 * Obtiene el nivel jerárquico de un rol
 * @param role - Rol del usuario
 * @returns Número de nivel (0 = SUPER_ADMIN, 4 = VENDEDOR)
 */
export function getRoleLevel(role?: UserRole): number {
  if (role === undefined) return Infinity
  return ROLE_HIERARCHY[role] ?? Infinity
}

/**
 * Obtiene los roles que un usuario puede crear, basados en su rol
 * @param creatorRole - Rol del usuario que crea
 * @returns Array de roles que puede crear
 */
export function getCreatableRoles(creatorRole?: UserRole): UserRole[] {
  const creatorLevel = getRoleLevel(creatorRole)
  
  if (creatorLevel === Infinity || creatorRole === UserRole.VENDEDOR) {
    return [] // VENDEDOR no puede crear nadie
  }

  // Filtrar roles de nivel superior (número mayor)
  const creatable = Object.keys(ROLE_HIERARCHY)
    .filter(r => {
      const roleLevel = ROLE_HIERARCHY[r as UserRole]
      return roleLevel > creatorLevel
    })
    .map(r => r as UserRole)

  return creatable
}

/**
 * Verifica si un rol puede crear otro rol
 * @param creatorRole - Rol del usuario que crea
 * @param targetRole - Rol objetivo a crear
 * @returns true si puede crear
 */
export function canCreateRole(creatorRole?: UserRole, targetRole?: UserRole): boolean {
  if (!creatorRole || !targetRole) return false
  
  const creatorLevel = getRoleLevel(creatorRole)
  const targetLevel = getRoleLevel(targetRole)
  
  // Solo puede crear roles de nivel superior (número mayor)
  return targetLevel > creatorLevel
}

/**
 * Verifica si un usuario puede editar a otro usuario
 * Un usuario solo puede editar usuarios de nivel inferior
 * @param editorRole - Rol del usuario que edita
 * @param targetRole - Rol del usuario a editar
 * @returns true si puede editar
 */
export function canEditUser(editorRole?: UserRole, targetRole?: UserRole): boolean {
  if (!editorRole || !targetRole) return false
  
  const editorLevel = getRoleLevel(editorRole)
  const targetLevel = getRoleLevel(targetRole)
  
  // Solo puede editar roles de nivel inferior (número mayor)
  return targetLevel > editorLevel
}

// =============================================
// FUNCIONES LEGACY (para backward compatibility)
// =============================================

/**
 * Verifica si un rol tiene permisos de administrador (Admin o Super Admin)
 */
export function isAdmin(role?: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN
}

/**
 * Verifica si un rol es Super Admin
 */
export function isSuperAdmin(role?: UserRole): boolean {
  return role === UserRole.SUPER_ADMIN
}

/**
 * Verifica si un rol es Supervisor (acceso limitado a assignedPharmacies)
 */
export function isSupervisor(role?: UserRole): boolean {
  return role === UserRole.SUPERVISOR
}

/**
 * Verifica si un rol tiene acceso a farmacias (Admin, Super Admin o Supervisor)
 */
export function hasPharmacyAccess(role?: UserRole): boolean {
  return isAdmin(role) || isSupervisor(role)
}

/**
 * Verifica si un rol es ENCARGADO (acceso a una sola pharmacy)
 */
export function isEncargado(role?: UserRole): boolean {
  return role === UserRole.ENCARGADO
}

/**
 * Verifica si un rol puede gestionar usuarios (no es VENDEDOR)
 */
export function canManageUsers(role?: UserRole): boolean {
  return role !== undefined && role !== UserRole.VENDEDOR
}