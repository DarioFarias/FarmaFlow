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

// ---- FARMACIAS ----

export const pharmacyCreateSchema = z.object({
  pharmacyName: z.string()
    .min(2, 'El nombre es requerido')
    .max(100, 'Máximo 100 caracteres')
    .trim(),
  address: z.string().max(200).trim().optional(),
  phone: z.string().max(30).trim().optional(),
  email: z.string().email('Email inválido').toLowerCase().trim().optional().or(z.literal('')),
})

export const pharmacyUpdateSchema = z.object({
  pharmacyName: z.string()
    .min(2)
    .max(100)
    .trim()
    .optional(),
  address: z.string().max(200).trim().optional(),
  phone: z.string().max(30).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  isActive: z.boolean().optional(),
})

export type PharmacyCreateInput = z.infer<typeof pharmacyCreateSchema>
export type PharmacyUpdateInput = z.infer<typeof pharmacyUpdateSchema>

// ---- USUARIOS ----

export const loginSchema = z.object({
  email: z.string().email('Email inválido').toLowerCase(),
  password: z.string().min(1, 'La contraseña es requerida'),
})

// Schema para crear usuarios - los roles válidos se validan en la API según permisos del creador
// NOTA: El schema acepta todos los roles, la validación de permisos se hace en la API
export const adminCreateUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100).trim(),
  username: z.string().min(3, 'El nombre de usuario debe tener al menos 3 caracteres').max(30).trim(),
  email: z.string().email('Email inválido').toLowerCase().trim().optional().or(z.literal('')),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'SUPER_ADMIN', 'ENCARGADO', 'VENDEDOR'], {
    errorMap: () => ({ message: 'Rol inválido' }),
  }),
  phone: z.string().max(30).trim().optional(),
  assignedPharmacies: z.array(z.string()).max(50).default([]),
})

// Schema para actualizar usuario - los roles válidos se validan según permisos del editor
export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  username: z.string().min(3).max(30).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'SUPER_ADMIN', 'ENCARGADO', 'VENDEDOR']).optional(),
  phone: z.string().max(30).trim().optional(),
  assignedPharmacies: z.array(z.string()).optional(),
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
export type CreateUserInput = z.infer<typeof adminCreateUserSchema>
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>
export type AdminChangePasswordInput = z.infer<typeof adminChangePasswordSchema>
export type CreateSupplyRequestInput = z.infer<typeof createSupplyRequestSchema>
export type UpdateSupplyStatusInput = z.infer<typeof updateSupplyStatusSchema>
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseStatusInput = z.infer<typeof updateExpenseStatusSchema>
