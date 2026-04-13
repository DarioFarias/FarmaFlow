import { describe, it, expect } from 'vitest'
import { isAdmin, isPharmacy } from './roles'
import { UserRole } from '../types'

describe('Auth Helpers', () => {
  describe('isAdmin', () => {
    it('returns true when role is ADMIN', () => {
      expect(isAdmin(UserRole.ADMIN)).toBe(true)
    })

    it('returns false when role is PHARMACY', () => {
      expect(isAdmin(UserRole.PHARMACY)).toBe(false)
    })

    it('returns false when role is undefined', () => {
      expect(isAdmin(undefined)).toBe(false)
    })
  })

  describe('isPharmacy', () => {
    it('returns true when role is PHARMACY', () => {
      expect(isPharmacy(UserRole.PHARMACY)).toBe(true)
    })

    it('returns false when role is ADMIN', () => {
      expect(isPharmacy(UserRole.ADMIN)).toBe(false)
    })

    it('returns false when role is undefined', () => {
      expect(isPharmacy(undefined)).toBe(false)
    })
  })
})
