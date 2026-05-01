import { describe, it, expect } from 'vitest'
import { createExpenseSchema, createSupplyRequestSchema } from '@/lib/validations'

describe('Validation Schemas - pharmacyId field', () => {
  describe('createExpenseSchema', () => {
    it('should accept expense data WITHOUT pharmacyId (backwards compatible)', () => {
      const validData = {
        amount: 1500,
        currency: 'ARS',
        category: 'SERVICIOS',
        description: 'Pago de luz mensual',
        vendor: 'Edesur',
        receiptDate: '2024-01-15T00:00:00.000Z',
      }
      
      const result = createExpenseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept expense data WITH valid pharmacyId', () => {
      const validData = {
        amount: 1500,
        currency: 'ARS',
        category: 'SERVICIOS',
        description: 'Pago de luz mensual',
        vendor: 'Edesur',
        receiptDate: '2024-01-15T00:00:00.000Z',
        pharmacyId: '507f1f77bcf86cd799439011',
      }
      
      const result = createExpenseSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject expense with invalid pharmacyId type (number)', () => {
      const invalidData = {
        amount: 1500,
        currency: 'ARS',
        category: 'SERVICIOS',
        description: 'Pago de luz mensual',
        receiptDate: '2024-01-15T00:00:00.000Z',
        pharmacyId: 123, // Should be string
      }
      
      const result = createExpenseSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('createSupplyRequestSchema', () => {
    it('should accept supply request WITHOUT pharmacyId (backwards compatible)', () => {
      const validData = {
        items: [
          {
            name: 'Resma A4',
            category: 'PAPELERIA',
            quantity: 5,
            unit: 'Cajas',
          },
        ],
        priority: 'NORMAL',
        notes: 'Urgente para inventario',
      }
      
      const result = createSupplyRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept supply request WITH valid pharmacyId', () => {
      const validData = {
        items: [
          {
            name: 'Resma A4',
            category: 'PAPELERIA',
            quantity: 5,
            unit: 'Cajas',
          },
        ],
        priority: 'NORMAL',
        notes: 'Urgente para inventario',
        pharmacyId: '507f1f77bcf86cd799439011',
      }
      
      const result = createSupplyRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject supply request with invalid pharmacyId type', () => {
      const invalidData = {
        items: [
          {
            name: 'Resma A4',
            category: 'PAPELERIA',
            quantity: 5,
            unit: 'Cajas',
          },
        ],
        priority: 'NORMAL',
        pharmacyId: true, // Should be string
      }
      
      const result = createSupplyRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})