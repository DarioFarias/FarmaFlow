import { z } from 'zod'
import {
  SupplyCategory,
  ExpenseCategory,
  SupplyRequestStatus,
  ExpenseStatus,
} from '@/types'

// =============================================
// FARMAFLOW - Schemas de validación con Zod
// Fuente única para validación de API y formularios (client + server)
// =============================================

// ---- USUARIOS ----

export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export const createUserSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['ADMIN', 'PHARMACY']).default('PHARMACY'),
  pharmacyName: z.string().min(1, 'El nombre de sucursal es requerido').max(100).trim().optional(),
  pharmacyCode: z.string().max(20).trim().optional(),
  phone: z.string().max(30).trim().optional(),
})

// Schema para Super Admin - puede crear usuarios ADMIN o PHARMACY
export const adminCreateUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100).trim(),
  email: z.string().email('Email inválido').toLowerCase().trim(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['ADMIN', 'PHARMACY'], {
    errorMap: () => ({ message: 'El rol debe ser ADMIN o PHARMACY' }),
  }),
  pharmacyName: z.string().max(100).trim().optional(),
  pharmacyCode: z.string().max(20).trim().optional(),
  phone: z.string().max(30).trim().optional(),
}).refine((data) => {
  // Si es PHARMACY, pharmacyName es requerido
  if (data.role === 'PHARMACY') {
    return !!data.pharmacyName && data.pharmacyName.length > 0
  }
  return true
}, {
  message: 'El nombre de sucursal es requerido para rol PHARMACY',
  path: ['pharmacyName'],
})

// Schema para actualizar usuario por Super Admin
export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  role: z.enum(['ADMIN', 'PHARMACY']).optional(),
  pharmacyName: z.string().max(100).trim().optional(),
  pharmacyCode: z.string().max(20).trim().optional(),
  phone: z.string().max(30).trim().optional(),
  isActive: z.boolean().optional(),
})

// Schema para cambiar contraseña por Super Admin
export const adminChangePasswordSchema = z.object({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

// ---- SUMINISTROS ----

export const supplyItemSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(200).trim(),
  category: z.nativeEnum(SupplyCategory),
  quantity: z.number().int().min(1, 'La cantidad mínima es 1'),
  unit: z.string().min(1, 'La unidad es requerida').trim(),
  notes: z.string().max(500).optional(),
})

export const createSupplyRequestSchema = z.object({
  items: z
    .array(supplyItemSchema)
    .min(1, 'Debes agregar al menos un insumo'),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).default('NORMAL'),
  notes: z.string().max(1000).optional(),
})

export const updateSupplyStatusSchema = z.object({
  status: z.nativeEnum(SupplyRequestStatus),
  comment: z.string().max(500).optional(),
  rejectionReason: z.string().max(500).optional(),
  shippingDate: z.string().datetime().optional(),
  expectedDelivery: z.string().datetime().optional(),
})

// ---- GASTOS ----

export const createExpenseSchema = z.object({
  amount: z.number().positive('El monto debe ser positivo'),
  currency: z.string().default('ARS'),
  category: z.nativeEnum(ExpenseCategory),
  description: z.string().min(1).max(500).trim(),
  vendor: z.string().max(200).optional(),
  receiptDate: z.string().datetime(),
  invoiceImageUrl: z.string().url().optional(),
  invoicePublicId: z.string().optional(),
})

export const updateExpenseStatusSchema = z.object({
  status: z.nativeEnum(ExpenseStatus),
  adminComment: z.string().max(1000).optional(),
})

// ---- Tipos inferidos desde Zod ----
export type LoginInput = z.infer<typeof loginSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>
export type AdminChangePasswordInput = z.infer<typeof adminChangePasswordSchema>
export type CreateSupplyRequestInput = z.infer<typeof createSupplyRequestSchema>
export type UpdateSupplyStatusInput = z.infer<typeof updateSupplyStatusSchema>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseStatusInput = z.infer<typeof updateExpenseStatusSchema>
