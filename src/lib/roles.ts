import { UserRole } from '@/types'

// =============================================
// TIPOS PARA ASIGNACIÓN DE FARMACIAS
// =============================================

/**
 * Tipo de asignación de farmacias según el rol del usuario
 * - none: No se puede asignar farmacias (ADMIN, SUPER_ADMIN)
 * - multiple: Puede asignar varias farmacias (SUPERVISOR)
 * - single: Solo puede asignar una farmacia (ENCARGADO, VENDEDOR)
 */
export type PharmacyAssignmentType = 'none' | 'multiple' | 'single'

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
 * Solo SUPER_ADMIN puede crear SUPER_ADMIN
 * @param creatorRole - Rol del usuario que crea
 * @returns Array de roles que puede crear
 */
export function getCreatableRoles(creatorRole?: UserRole): UserRole[] {
  const creatorLevel = getRoleLevel(creatorRole)
  
  if (creatorLevel === Infinity || creatorRole === UserRole.VENDEDOR) {
    return [] // VENDEDOR no puede crear nadie
  }

  // SUPER_ADMIN (nivel 0) puede crear todos los roles, incluyendo SUPER_ADMIN
  if (creatorRole === UserRole.SUPER_ADMIN) {
    return Object.keys(ROLE_HIERARCHY).map(r => r as UserRole)
  }

  // Para otros roles: solo pueden crear roles de nivel superior (número mayor)
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
 * Solo SUPER_ADMIN puede crear SUPER_ADMIN
 * @param creatorRole - Rol del usuario que crea
 * @param targetRole - Rol objetivo a crear
 * @returns true si puede crear
 */
export function canCreateRole(creatorRole?: UserRole, targetRole?: UserRole): boolean {
  if (!creatorRole || !targetRole) return false
  
  // SUPER_ADMIN puede crear cualquier rol, incluyendo SUPER_ADMIN
  if (creatorRole === UserRole.SUPER_ADMIN) {
    return true
  }
  
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
 * Verifica si un rol tiene permisos de administrador para gestión de gastos
 * Incluye ADMIN, SUPER_ADMIN y SUPERVISOR (este último puede aprobar/gastar)
 */
export function isAdmin(role?: UserRole): boolean {
  return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.SUPERVISOR
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

// =============================================
// FUNCIONES DE ASIGNACIÓN DE FARMACIAS
// =============================================

/**
 * Obtiene el tipo de asignación de farmacias según el rol del usuario
 * @param role - Rol del usuario destino
 * @returns Tipo de asignación: 'none', 'multiple', o 'single'
 */
export function getPharmacyAssignmentType(role?: UserRole): PharmacyAssignmentType {
  if (!role) return 'none'
  
  // ADMIN y SUPER_ADMIN no tienen asignación de farmacias
  if (role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN) {
    return 'none'
  }
  
  // SUPERVISOR puede tener múltiples farmacias
  if (role === UserRole.SUPERVISOR) {
    return 'multiple'
  }
  
  // ENCARGADO y VENDEDOR solo pueden tener una farmacia
  return 'single'
}

/**
 * Verifica si un usuario ENCARGADO puede asignar una farmacia a un VENDEDOR
 * El vendedor solo puede recibir la misma farmacia que tiene el encargado
 * @param creatorAssignedPharmacies - Farmacias asignadas al creador (ENCARGADO)
 * @param targetPharmacyId - Farmacia que se quiere asignar al vendedor
 * @returns true si puede asignar
 */
export function canAssignVendorPharmacy(
  creatorAssignedPharmacies: string[], 
  targetPharmacyId: string
): boolean {
  // Si el creador no tiene farmacias asignadas, no puede crear vendedores
  if (!creatorAssignedPharmacies || creatorAssignedPharmacies.length === 0) {
    return false
  }
  
  // El vendedor solo puede recibir la misma farmacia que el encargado
  return creatorAssignedPharmacies.includes(targetPharmacyId)
}

/**
 * Resultado de la validación de asignación de farmacias
 */
export interface PharmacyAssignmentValidation {
  valid: boolean
  error?: string
}

/**
 * Valida la asignación de farmacias según el rol del creador y el rol del destino
 * @param targetRole - Rol del usuario a crear/editar
 * @param assignedPharmacies - Farmacias a asignar
 * @param creatorRole - Rol del usuario que crea/edita
 * @param creatorAssignedPharmacies - Farmacias del creador (para encardos creando vendedores)
 * @returns Resultado de la validación
 */
export function validatePharmacyAssignment(
  targetRole: UserRole,
  assignedPharmacies: string[] | undefined,
  creatorRole: UserRole,
  creatorAssignedPharmacies?: string[]
): PharmacyAssignmentValidation {
  const assignmentType = getPharmacyAssignmentType(targetRole)
  
  // Si el rol no permite farmacias, está ok (se ignoran las asignaciones)
  if (assignmentType === 'none') {
    return { valid: true }
  }
  
  // SUPERVISOR: puede tener 0 a N farmacias
  if (assignmentType === 'multiple') {
    return { valid: true }
  }
  
  // ENCARGADO y VENDEDOR: deben tener exactamente 1 farmacia
  if (assignmentType === 'single') {
    if (!assignedPharmacies || assignedPharmacies.length === 0) {
      return { 
        valid: false, 
        error: `El rol ${targetRole} requiere exactamente una farmacia asignada` 
      }
    }
    
    if (assignedPharmacies.length > 1) {
      return { 
        valid: false, 
        error: `El rol ${targetRole} solo puede tener una farmacia asignada` 
      }
    }
    
    // Validación especial para SUPERVISOR creando usuario
    if (creatorRole === UserRole.SUPERVISOR) {
      if (!creatorAssignedPharmacies || creatorAssignedPharmacies.length === 0) {
        return { 
          valid: false, 
          error: 'Un SUPERVISOR sin farmacia asignada no puede crear usuarios' 
        }
      }
      
      // SUPERVISOR solo puede asignar farmacias de su lista
      const targetPharmacy = assignedPharmacies[0]
      if (!creatorAssignedPharmacies.includes(targetPharmacy)) {
        return { 
          valid: false, 
          error: 'Solo puedes asignar farmacias que te han sido asignadas' 
        }
      }
    }
    
    // Validación especial para VENDEDOR creado por ENCARGADO
    if (targetRole === UserRole.VENDEDOR && creatorRole === UserRole.ENCARGADO) {
      if (!creatorAssignedPharmacies || creatorAssignedPharmacies.length === 0) {
        return { 
          valid: false, 
          error: 'Un ENCARGADO sin farmacia asignada no puede crear vendedores' 
        }
      }
      
      const targetPharmacy = assignedPharmacies[0]
      if (!canAssignVendorPharmacy(creatorAssignedPharmacies, targetPharmacy)) {
        return { 
          valid: false, 
          error: 'Un ENCARGADO solo puede crear vendedores con la misma farmacia que tiene asignada' 
        }
      }
    }
    
    return { valid: true }
  }
  
  return { valid: true }
}