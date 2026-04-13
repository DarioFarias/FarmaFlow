import { describe, it, expect } from 'vitest'
import { isAdmin, isPharmacy, isSuperAdmin } from './roles'
import { UserRole } from '../types'

describe('Roles Helpers', () => {
  describe('isAdmin', () => {
    it('returns true for ADMIN role', () => {
      expect(isAdmin(UserRole.ADMIN)).toBe(true)
    })

    it('returns true for SUPER_ADMIN role', () => {
      expect(isAdmin(UserRole.SUPER_ADMIN)).toBe(true)
    })

    it('returns false for PHARMACY role', () => {
      expect(isAdmin(UserRole.PHARMACY)).toBe(false)
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

    it('returns false for PHARMACY role', () => {
      expect(isSuperAdmin(UserRole.PHARMACY)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isSuperAdmin(undefined)).toBe(false)
    })
  })

  describe('isPharmacy', () => {
    it('returns true for PHARMACY role', () => {
      expect(isPharmacy(UserRole.PHARMACY)).toBe(true)
    })

    it('returns false for ADMIN role', () => {
      expect(isPharmacy(UserRole.ADMIN)).toBe(false)
    })

    it('returns false for SUPER_ADMIN role', () => {
      expect(isPharmacy(UserRole.SUPER_ADMIN)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isPharmacy(undefined)).toBe(false)
    })
  })
})