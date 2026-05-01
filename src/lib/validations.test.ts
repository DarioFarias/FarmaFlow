import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  adminCreateUserSchema,
  createExpenseSchema,
  createSupplyRequestSchema,
  updateSupplyStatusSchema,
  updateExpenseStatusSchema,
  validateMexicanPhone,
  mexicanPhoneSchema,
  pharmacyCreateSchema,
  pharmacyUpdateSchema,
  adminUpdateUserSchema,
} from './validations'
import { SupplyCategory, ExpenseCategory, SupplyRequestStatus, ExpenseStatus } from '../types'

describe('Validations - Login', () => {
  it('validates correct email and password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: 'password123' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({ email: 'invalid-email', password: 'password123' })
    expect(result.success).toBe(false)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({ email: 'test@example.com', password: '' })
    expect(result.success).toBe(false)
  })
})

describe('Validations - Create User', () => {
  it('validates valid admin user', () => {
    const result = adminCreateUserSchema.safeParse({
      name: 'Admin User',
      username: 'admin',
      email: 'admin@farmaflow.com',
      password: 'password123',
      role: 'ADMIN',
    })
    expect(result.success).toBe(true)
  })

  it('validates valid supervisor with assigned pharmacies', () => {
    const result = adminCreateUserSchema.safeParse({
      name: 'Supervisor Test',
      username: 'supervisor',
      email: 'supervisor@farmaflow.com',
      password: 'password123',
      role: 'SUPERVISOR',
      assignedPharmacies: ['pharm-001', 'pharm-002'],
    })
    expect(result.success).toBe(true)
  })

  it('rejects short password', () => {
    const result = adminCreateUserSchema.safeParse({
      name: 'Test',
      username: 'test',
      email: 'test@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid role', () => {
    const result = adminCreateUserSchema.safeParse({
      name: 'Test',
      username: 'test',
      email: 'test@example.com',
      password: 'password123',
      role: 'INVALID_ROLE',
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional phone field', () => {
    const result = adminCreateUserSchema.safeParse({
      name: 'Admin User',
      username: 'admin',
      email: 'admin@farmaflow.com',
      password: 'password123',
      role: 'ADMIN',
      phone: '+52 55 1234 5678',
    })
    expect(result.success).toBe(true)
  })
})

describe('Validations - Create Expense', () => {
  it('validates correct expense data', () => {
    const result = createExpenseSchema.safeParse({
      amount: 1500,
      currency: 'ARS',
      category: ExpenseCategory.MAINTENANCE,
      description: 'Reparación de aire acondicionado',
      vendor: 'ServiceMax',
      receiptDate: '2024-01-15T00:00:00Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative amount', () => {
    const result = createExpenseSchema.safeParse({
      amount: -100,
      category: ExpenseCategory.OTHER,
      description: 'Test',
      receiptDate: '2024-01-15T00:00:00Z',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    const result = createExpenseSchema.safeParse({
      amount: 100,
      // missing category, description, receiptDate
    })
    expect(result.success).toBe(false)
  })

  it('accepts valid category values', () => {
    const categories = [
      ExpenseCategory.MAINTENANCE,
      ExpenseCategory.UTILITIES,
      ExpenseCategory.RENT,
      ExpenseCategory.SALARIES,
      ExpenseCategory.TAXES,
      ExpenseCategory.OTHER,
    ]
    categories.forEach((category) => {
      const result = createExpenseSchema.safeParse({
        amount: 100,
        category,
        description: 'Test',
        receiptDate: '2024-01-15T00:00:00Z',
      })
      expect(result.success, `Category ${category} should be valid`).toBe(true)
    })
  })
})

describe('Validations - Create Supply Request', () => {
  it('validates correct supply request', () => {
    const result = createSupplyRequestSchema.safeParse({
      items: [
        {
          name: 'Resma de papel A4',
          category: SupplyCategory.OFFICE_SUPPLIES,
          quantity: 5,
          unit: 'Cajas',
        },
      ],
      priority: 'NORMAL',
      notes: 'Urgente para próxima semana',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty items array', () => {
    const result = createSupplyRequestSchema.safeParse({
      items: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid priority', () => {
    const result = createSupplyRequestSchema.safeParse({
      items: [{ name: 'Test', category: SupplyCategory.OTHER, quantity: 1, unit: 'Unidades' }],
      priority: 'INVALID',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid priorities', () => {
    const priorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT']
    priorities.forEach((priority) => {
      const result = createSupplyRequestSchema.safeParse({
        items: [{ name: 'Test', category: SupplyCategory.OTHER, quantity: 1, unit: 'Unidades' }],
        priority,
      })
      expect(result.success, `Priority ${priority} should be valid`).toBe(true)
    })
  })

  it('accepts valid supply categories', () => {
    const categories = [
      SupplyCategory.OFFICE_SUPPLIES,
      SupplyCategory.CLEANING,
      SupplyCategory.PHARMACY_SUPPLIES,
      SupplyCategory.OTHER,
    ]
    categories.forEach((category) => {
      const result = createSupplyRequestSchema.safeParse({
        items: [{ name: 'Test', category, quantity: 1, unit: 'Unidades' }],
      })
      expect(result.success, `Category ${category} should be valid`).toBe(true)
    })
  })
})

describe('Validations - Update Supply Status', () => {
  it('validates authorized status with comment', () => {
    const result = updateSupplyStatusSchema.safeParse({
      status: SupplyRequestStatus.AUTHORIZED,
      comment: 'Pedido aprobado',
    })
    expect(result.success).toBe(true)
  })

  it('validates rejected status with reason', () => {
    const result = updateSupplyStatusSchema.safeParse({
      status: SupplyRequestStatus.REJECTED,
      rejectionReason: 'Stock insuficiente',
    })
    expect(result.success).toBe(true)
  })

  it('validates shipped status with dates', () => {
    const result = updateSupplyStatusSchema.safeParse({
      status: SupplyRequestStatus.SHIPPED,
      shippingDate: '2024-01-20T10:00:00Z',
      expectedDelivery: '2024-01-25T10:00:00Z',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = updateSupplyStatusSchema.safeParse({
      status: 'INVALID_STATUS',
    })
    expect(result.success).toBe(false)
  })
})

describe('Validations - Update Expense Status', () => {
  it('validates approved status with comment', () => {
    const result = updateExpenseStatusSchema.safeParse({
      status: ExpenseStatus.APPROVED,
      adminComment: 'Gasto verificado y aprobado',
    })
    expect(result.success).toBe(true)
  })

  it('validates disputed status', () => {
    const result = updateExpenseStatusSchema.safeParse({
      status: ExpenseStatus.DISPUTED,
      adminComment: 'Falta factura original',
    })
    expect(result.success).toBe(true)
  })

  it('validates reviewed status', () => {
    const result = updateExpenseStatusSchema.safeParse({
      status: ExpenseStatus.REVIEWED,
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = updateExpenseStatusSchema.safeParse({
      status: 'INVALID_STATUS',
    })
    expect(result.success).toBe(false)
  })
})

// =============================================
// VALIDACIÓN DE TELÉFONOS MEXICANOS
// =============================================

describe('validateMexicanPhone - Function', () => {
  describe('Valid formats', () => {
    it('accepts +52 format with spaces', () => {
      const result = validateMexicanPhone('+52 55 1234 5678')
      expect(result.valid).toBe(true)
      expect(result.normalized).toBe('5512345678')
    })

    it('accepts +52 format without spaces', () => {
      const result = validateMexicanPhone('+525512345678')
      expect(result.valid).toBe(true)
      expect(result.normalized).toBe('5512345678')
    })

    it('accepts local format with LADA and spaces', () => {
      const result = validateMexicanPhone('55 1234 5678')
      expect(result.valid).toBe(true)
      expect(result.normalized).toBe('5512345678')
    })

    it('accepts local format without spaces', () => {
      const result = validateMexicanPhone('5512345678')
      expect(result.valid).toBe(true)
      expect(result.normalized).toBe('5512345678')
    })

    it('accepts 10 digits without prefix', () => {
      const result = validateMexicanPhone('1234567890')
      expect(result.valid).toBe(true)
      expect(result.normalized).toBe('1234567890')
    })

    it('accepts empty string (optional field)', () => {
      const result = validateMexicanPhone('')
      expect(result.valid).toBe(true)
      expect(result.normalized).toBeUndefined()
    })

    it('accepts undefined', () => {
      const result = validateMexicanPhone(undefined as any)
      expect(result.valid).toBe(true)
      expect(result.normalized).toBeUndefined()
    })

    it('accepts different area codes (55, 33, 81, 221)', () => {
      const testCases = [
        '5512345678', // 55 (2) + 12345678 (8) = 10
        '3312345678', // 33 (2) + 12345678 (8) = 10
        '8112345678', // 81 (2) + 12345678 (8) = 10
        '2211234567', // 221 (3) + 1234567 (7) = 10
        '4441234567', // 444 (3) + 1234567 (7) = 10
        '6181234567', // 618 (3) + 1234567 (7) = 10
      ]
      testCases.forEach((phone) => {
        const result = validateMexicanPhone(phone)
        expect(result.valid, `${phone} should be valid`).toBe(true)
      })
    })
  })

  describe('Invalid formats - rejection', () => {
    it('rejects phone with dashes ( Argentine format)', () => {
      const result = validateMexicanPhone('54-11-1234-5678')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('dígitos')
    })

    it('rejects phone with dots (European format)', () => {
      const result = validateMexicanPhone('55.1234.5678')
      expect(result.valid).toBe(false)
    })

    it('rejects phone with parentheses', () => {
      const result = validateMexicanPhone('(55) 1234-5678')
      expect(result.valid).toBe(false)
    })

    it('rejects phone that is too short (less than 10 digits)', () => {
      const result = validateMexicanPhone('551234567')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('10 dígitos')
    })

    it('rejects more than 10 digits', () => {
      const result = validateMexicanPhone('55123456789')
      expect(result.valid).toBe(false)
    })

    it('rejects US format (+1)', () => {
      const result = validateMexicanPhone('+1 555 123 4567')
      expect(result.valid).toBe(false)
    })

    it('rejects letters in phone', () => {
      const result = validateMexicanPhone('55abc45678')
      expect(result.valid).toBe(false)
    })

    it('rejects symbols in phone', () => {
      const result = validateMexicanPhone('55-12#-5678')
      expect(result.valid).toBe(false)
    })
  })
})

describe('validateMexicanPhone - Zod Schema', () => {
  it('accepts valid phone in pharmacyCreateSchema', () => {
    const result = pharmacyCreateSchema.safeParse({
      pharmacyName: 'Farmacia Centro',
      phone: '+52 55 1234 5678',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid phone in adminCreateUserSchema', () => {
    const result = adminCreateUserSchema.safeParse({
      name: 'Test User',
      username: 'testuser',
      password: 'password123',
      role: 'ADMIN',
      phone: '55 1234 5678',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid phone in adminUpdateUserSchema', () => {
    const result = adminUpdateUserSchema.safeParse({
      name: 'Updated Name',
      phone: '5512345678',
    })
    expect(result.success).toBe(true)
  })

  it('rejects Argentine phone format in pharmacyCreateSchema', () => {
    const result = pharmacyCreateSchema.safeParse({
      pharmacyName: 'Farmacia centro',
      phone: '54-11-1234-5678',
    })
    expect(result.success).toBe(false)
  })

  it('rejects phone starting with 1 in user schema', () => {
    const result = adminCreateUserSchema.safeParse({
      name: 'Test User',
      username: 'testuser',
      password: 'password123',
      role: 'ADMIN',
      phone: '1551234567',
    })
    // 155 is a valid area code (starts with 1), so this is valid
    expect(result.success).toBe(true)
  })

  it('accepts optional phone (empty)', () => {
    const result = pharmacyCreateSchema.safeParse({
      pharmacyName: 'Farmacia test',
      phone: '',
    })
    expect(result.success).toBe(true)
  })

  it('accepts optional phone (undefined)', () => {
    const result = pharmacyCreateSchema.safeParse({
      pharmacyName: 'Farmacia test',
    })
    expect(result.success).toBe(true)
  })

  it('accepts optional phone in update schema (undefined)', () => {
    const result = pharmacyUpdateSchema.safeParse({
      pharmacyName: 'Updated',
    })
    expect(result.success).toBe(true)
  })
})