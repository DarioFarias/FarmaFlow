import { describe, it, expect } from 'vitest'
import { isAdmin, isSuperAdmin, isSupervisor } from './roles'
import { UserRole } from '../types'

describe('Roles Helpers', () => {
  describe('isAdmin', () => {
    it('returns true for ADMIN role', () => {
      expect(isAdmin(UserRole.ADMIN)).toBe(true)
    })

    it('returns true for SUPER_ADMIN role', () => {
      expect(isAdmin(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('returns true for SUPERVISOR role (admin for expense management)', () => {
      expect(isAdmin(UserRole.SUPERVISOR)).toBe(true)
    })

    it('returns false for undefined', () => {
      expect(isAdmin(undefined)).toBe(false)
    })
  })

  describe('isSuperAdmin', () => {
    it('returns true for SUPER_ADMIN role', () => {
      expect(isSuperAdmin(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('returns false for ADMIN role', () => {
      expect(isSuperAdmin(UserRole.ADMIN)).toBe(false)
    })

    it('returns false for SUPERVISOR role', () => {
      expect(isSuperAdmin(UserRole.SUPERVISOR)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isSuperAdmin(undefined)).toBe(false)
    })
  })

  describe('isSupervisor', () => {
    it('returns true for SUPERVISOR role', () => {
      expect(isSupervisor(UserRole.SUPERVISOR)).toBe(true)
    })

    it('returns false for ADMIN role', () => {
      expect(isSupervisor(UserRole.ADMIN)).toBe(false)
    })

    it('returns false for SUPER_ADMIN role', () => {
      expect(isSupervisor(UserRole.SUPER_ADMIN)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isSupervisor(undefined)).toBe(false)
    })
  })
})