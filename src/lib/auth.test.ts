import { describe, it, expect } from 'vitest'
import { isAdmin } from './roles'
import { UserRole } from '../types'

describe('Auth Helpers', () => {
  describe('isAdmin', () => {
    it('returns true when role is ADMIN', () => {
      expect(isAdmin(UserRole.ADMIN)).toBe(true)
    })

    it('returns false when role is SUPERVISOR', () => {
      expect(isAdmin(UserRole.SUPERVISOR)).toBe(false)
    })

    it('returns false when role is undefined', () => {
      expect(isAdmin(undefined)).toBe(false)
    })
  })
})