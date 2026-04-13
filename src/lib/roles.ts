import { UserRole } from '@/types'

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
 * Verifica si un rol es de Farmacia
 */
export function isPharmacy(role?: UserRole): boolean {
  return role === UserRole.PHARMACY
}

/**
 * Verifica si un rol es Supervisor (acceso limitado a assignedPharmacies)
 */
export function isSupervisor(role?: UserRole): boolean {
  return role === UserRole.SUPERVISOR
}
