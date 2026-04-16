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