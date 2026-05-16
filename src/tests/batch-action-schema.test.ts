import { describe, it, expect } from 'vitest'
import { batchActionSchema } from '@/lib/validations'

describe('batchActionSchema - Discriminated Union Validation', () => {
  describe('action: approve', () => {
    it('should accept valid approve action with expenseIds and optional notes', () => {
      const validInput = {
        action: 'approve',
        expenseIds: ['expense-1', 'expense-2'],
        notes: 'Aprobado en lote',
      }

      const result = batchActionSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.action).toBe('approve')
        expect(result.data.expenseIds).toHaveLength(2)
      }
    })

    it('should accept approve without notes', () => {
      const validInput = {
        action: 'approve',
        expenseIds: ['expense-1'],
      }

      const result = batchActionSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should reject approve with empty expenseIds', () => {
      const invalidInput = {
        action: 'approve',
        expenseIds: [],
      }

      const result = batchActionSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject approve with more than 50 expenseIds', () => {
      const invalidInput = {
        action: 'approve',
        expenseIds: Array(51).fill('expense-id'),
      }

      const result = batchActionSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('action: report', () => {
    it('should accept valid report action with expenseIds, period, and optional notes', () => {
      const validInput = {
        action: 'report',
        expenseIds: ['expense-1', 'expense-2'],
        period: '2024-01',
        notes: 'Reporte mensual',
      }

      const result = batchActionSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.action).toBe('report')
        expect(result.data.period).toBe('2024-01')
      }
    })

    it('should reject report without period', () => {
      const invalidInput = {
        action: 'report',
        expenseIds: ['expense-1'],
      }

      const result = batchActionSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject report with invalid period format', () => {
      const invalidInput = {
        action: 'report',
        expenseIds: ['expense-1'],
        period: '2024-1', // Invalid - should be MM format
      }

      const result = batchActionSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })

  describe('action: return', () => {
    it('should accept valid return action with expenseIds and optional notes', () => {
      const validInput = {
        action: 'return',
        expenseIds: ['expense-1', 'expense-2'],
        notes: 'Devuelto para pago',
      }

      const result = batchActionSchema.safeParse(validInput)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.action).toBe('return')
        expect(result.data.expenseIds).toHaveLength(2)
      }
    })

    it('should accept return without notes', () => {
      const validInput = {
        action: 'return',
        expenseIds: ['expense-1'],
      }

      const result = batchActionSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })
  })

  describe('invalid action', () => {
    it('should reject invalid action value', () => {
      const invalidInput = {
        action: 'pay',
        expenseIds: ['expense-1'],
      }

      const result = batchActionSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })

    it('should reject missing action', () => {
      const invalidInput = {
        expenseIds: ['expense-1'],
      }

      const result = batchActionSchema.safeParse(invalidInput)
      expect(result.success).toBe(false)
    })
  })
})