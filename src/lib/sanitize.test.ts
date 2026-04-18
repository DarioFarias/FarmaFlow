import { describe, it, expect } from 'vitest'
import { sanitizeInput, sanitizeSearchInput, SANITIZE_REGEX } from './validations'

describe('Validations - Sanitization', () => {
  describe('sanitizeInput', () => {
    it('returns clean string unchanged', () => {
      const result = sanitizeInput('clean text')
      expect(result).toBe('clean text')
    })

    it('removes HTML tags', () => {
      const result = sanitizeInput('<script>alert("xss")</script>text')
      expect(result).not.toContain('<script>')
      expect(result).toContain('text')
    })

    it('removes SQL injection quotes', () => {
      const result = sanitizeInput("test' OR '1'='1")
      expect(result).not.toContain("'")
    })

    it('removes special characters', () => {
      const result = sanitizeInput('test@#$%^&*()input')
      expect(result).toBe('testinput')
    })

    it('preserves alphanumeric and spaces', () => {
      const result = sanitizeInput('Farmacia San Juan 123')
      expect(result).toBe('Farmacia San Juan 123')
    })

    it('trims whitespace', () => {
      const result = sanitizeInput('  test  ')
      expect(result).toBe('test')
    })
  })

  describe('sanitizeSearchInput', () => {
    it('allows normal search terms', () => {
      const result = sanitizeSearchInput('aspirina')
      expect(result).toBe('aspirina')
    })

    it('sanitizes malicious search by removing quotes', () => {
      const result = sanitizeSearchInput("test' DROP TABLE users--")
      expect(result).not.toContain("'")
      expect(result).not.toContain('--')
    })

    it('truncates very long input', () => {
      const longInput = 'a'.repeat(200)
      const result = sanitizeSearchInput(longInput)
      expect(result.length).toBeLessThanOrEqual(100)
    })
  })
})