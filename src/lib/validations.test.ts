import { describe, it, expect } from 'vitest'
import {
  loginSchema,
  adminCreateUserSchema,
  createExpenseSchema,
  createSupplyRequestSchema,
  updateSupplyStatusSchema,
  updateExpenseStatusSchema,
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
      email: 'admin@farmaflow.com',
      password: 'password123',
      role: 'ADMIN',
    })
    expect(result.success).toBe(true)
  })

  it('validates valid supervisor with assigned pharmacies', () => {
    const result = adminCreateUserSchema.safeParse({
      name: 'Supervisor Test',
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
      email: 'test@example.com',
      password: 'short',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid role', () => {
    const result = adminCreateUserSchema.safeParse({
      name: 'Test',
      email: 'test@example.com',
      password: 'password123',
      role: 'INVALID_ROLE',
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional phone field', () => {
    const result = adminCreateUserSchema.safeParse({
      name: 'Admin User',
      email: 'admin@farmaflow.com',
      password: 'password123',
      role: 'ADMIN',
      phone: '+54 11 1234 5678',
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