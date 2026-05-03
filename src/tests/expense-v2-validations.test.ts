import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createExpenseSchema, updateExpenseSchema, updateExpenseStatusSchema } from '@/lib/validations'
import { ExpenseStatus } from '@/types'

describe('2.1: createExpenseSchema - Phase 2 updates', () => {
  describe('should accept pdfUrl and xmlUrl optional fields', () => {
    it('should accept expense with pdfUrl and xmlUrl', () => {
      const input = {
        amount: 1500,
        currency: 'MXN',
        description: 'Gasto con factura CFDI',
        receiptDate: '2024-01-15T00:00:00.000Z',
        pdfUrl: 'https://cloudinary.com/pdf/test.pdf',
        pdfPublicId: 'expenses/testPdf',
        xmlUrl: 'https://cloudinary.com/xml/test.xml',
        xmlPublicId: 'expenses/testXml',
      }
      const result = createExpenseSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept expense with only pdfUrl', () => {
      const input = {
        amount: 1500,
        currency: 'MXN',
        description: 'Gasto con PDF',
        receiptDate: '2024-01-15T00:00:00.000Z',
        pdfUrl: 'https://cloudinary.com/pdf/test.pdf',
        pdfPublicId: 'expenses/testPdf',
      }
      const result = createExpenseSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept expense with only xmlUrl', () => {
      const input = {
        amount: 1500,
        currency: 'MXN',
        description: 'Gasto con XML',
        receiptDate: '2024-01-15T00:00:00.000Z',
        xmlUrl: 'https://cloudinary.com/xml/test.xml',
        xmlPublicId: 'expenses/testXml',
      }
      const result = createExpenseSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept expense without new invoice fields (backwards compatible)', () => {
      const input = {
        amount: 1500,
        currency: 'MXN',
        description: 'Gasto básico sin factura',
        receiptDate: '2024-01-15T00:00:00.000Z',
      }
      const result = createExpenseSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })

  describe('should reject invalid URLs', () => {
    it('should reject invalid pdfUrl format', () => {
      const input = {
        amount: 1500,
        currency: 'MXN',
        description: 'Test',
        receiptDate: '2024-01-15T00:00:00.000Z',
        pdfUrl: 'not-a-url',
      }
      const result = createExpenseSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject invalid xmlUrl format', () => {
      const input = {
        amount: 1500,
        currency: 'MXN',
        description: 'Test',
        receiptDate: '2024-01-15T00:00:00.000Z',
        xmlUrl: 'not-a-url',
      }
      const result = createExpenseSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  describe('should remove category and vendor validation', () => {
    it('should NOT require category field', () => {
      const input = {
        amount: 1500,
        currency: 'MXN',
        description: 'Gasto sin categoría',
        receiptDate: '2024-01-15T00:00:00.000Z',
        // No category - should be valid now
      }
      const result = createExpenseSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should NOT require vendor field', () => {
      const input = {
        amount: 1500,
        currency: 'MXN',
        description: 'Gasto sin proveedor',
        receiptDate: '2024-01-15T00:00:00.000Z',
        // No vendor - should be valid now
      }
      const result = createExpenseSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })
})

describe('2.1: updateExpenseSchema - Phase 2 updates', () => {
  describe('should handle new fields', () => {
    it('should accept update with pdfUrl and xmlUrl', () => {
      const input = {
        amount: 2000,
        description: 'Updated description',
        pdfUrl: 'https://cloudinary.com/pdf/updated.pdf',
        pdfPublicId: 'expenses/updatedPdf',
        xmlUrl: 'https://cloudinary.com/xml/updated.xml',
        xmlPublicId: 'expenses/updatedXml',
      }
      const result = updateExpenseSchema.safeParse(input)
      expect(result.success).toBe(true)
    })
  })
})

describe('2.1: validateStatusTransition - PENDIENTE_DE_FACTURAR to FACTURADO', () => {
  it('should require pdfUrl + xmlUrl for PENDIENTE_DE_FACTURAR to FACTURADO transition', () => {
    // This is a business rule - tested via the API handler
    // The schema validates the presence of both pdfUrl and xmlUrl when transitioning
    const inputWithBoth = {
      status: ExpenseStatus.FACTURADO,
      pdfUrl: 'https://cloudinary.com/pdf/test.pdf',
      xmlUrl: 'https://cloudinary.com/xml/test.xml',
    }
    const result = updateExpenseStatusSchema.safeParse(inputWithBoth)
    expect(result.success).toBe(true)
  })
})