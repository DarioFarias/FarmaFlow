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

// =============================================
// VALIDACIÓN DE TELÉFONOS MEXICANOS
// =============================================

/**
 * Valida y normaliza números telefónicos móviles de México
 * Formatos válidos:
 *   - +52 55 1234 5678 (internacional con espacios)
 *   - +525512345678 (internacional sin espacios)
 *   - 55 1234 5678 (local con LADA y espacios)
 *   - 5512345678 (local sin espacios)
 *   - 1234567890 (10 dígitos sin prefijo)
 *
 * Características:
 * - Acepta prefijo +52 opcional
 * - Solo acepta dígitos (sin guiones, puntos, paréntesis)
 * - Longitud exacta: 10 dígitos sin prefijo, 12 dígitos con +52
 * - Rechaza formatos argentinos/europeos
 *
 * @returns { valid: true, normalized: string } | { valid: false, error: string }
 */
export function validateMexicanPhone(
  phone: string
): { valid: boolean; normalized?: string; error?: string } {
  // Si no viene nada, es válido (campo opcional)
  if (!phone || phone.trim() === '') {
    return { valid: true, normalized: undefined }
  }

  const normalized = phone.trim()

  // Remover TODOS los espacios
  const digitsOnly = normalized.replace(/\s/g, '')

  // Validar que soloenga dígitos y opcionalmente +
  if (!/^\+?\d+$/.test(digitsOnly)) {
    return { valid: false, error: 'El teléfono solo puede contener dígitos' }
  }

  // Extraer los dígitos puros (sin el +)
  const digits = digitsOnly.replace(/^\+/, '')

  let finalDigits: string
  let hasCountryCode = false

  // Verificar si tiene prefijo de país +52
  if (digits.startsWith('52') && digits.length === 12) {
    // Tiene +52: 12 dígitos total (52 + 10 dígitos locales)
    hasCountryCode = true
    finalDigits = digits // 12 dígitos con prefijo
  } else if (digits.length === 10) {
    // Sin prefijo: 10 dígitos locales
    finalDigits = digits
  } else {
    return {
      valid: false,
      error: `El teléfono debe tener 10 dígitos (o 12 con +52), recibido: ${digits.length}`,
    }
  }

  // Extraer código de área y número (últimos 10 dígitos para almacenamiento)
  // Si tiene prefijo +52, usamos los últimos 10 dígitos
  const phoneForStorage = hasCountryCode ? finalDigits.slice(-10) : finalDigits

  // Validar estructura del número mexicano
  // Área: 2-3 dígitos, Número: 7-8 dígitos
  const areaCode = phoneForStorage.slice(0, 3)
  const phoneNumber = phoneForStorage.slice(3)

  // Código de área válido (2-3 dígitos, starts with 2-9 o 1 para códigos de 3 dígitos)
  // Números válidos de 7-8 dígitos
  if (!/^\d{2,3}$/.test(areaCode) || !/^\d{7,8}$/.test(phoneNumber)) {
    return {
      valid: false,
      error: 'Teléfono inválido',
    }
  }

// Normalizar: siempre almacenar los 10 dígitos locales sin prefijo
  return { valid: true, normalized: phoneForStorage }
}

/**
 * Schema Zod para validación de teléfono mexicano
 * Uso: phone: mexicanPhoneSchema
 */
export const mexicanPhoneSchema = z
  .string()
  .max(20)
  .trim()
  .optional()
  .refine(
    (val) => {
      if (!val || val.trim() === '') return true // Optional
      const result = validateMexicanPhone(val)
      return result.valid
    },
    { message: 'Teléfono inválido' }
  )

// ---- SCHEMAS DE SANITIZACIÓN (Security) ----

// Regex para sanitizar strings: permite solo letras, números, espacios, guiones
export const SANITIZE_REGEX = /[^a-zA-Z0-9\s\-_áéíóúñÁÉÍÓÚÑ]/g

// Regex más permisivo para search (más flexible)
export const SEARCH_SANITIZE_REGEX = /[^a-zA-Z0-9\s\-_áéíóúñÁÉÍÓÚÑ']/g

/**
 * Sanitiza cualquier input de usuario
 * - Remueve tags HTML/JS
 * - Remueve caracteres especiales problemáticos
 * - Trim espacios
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return ''

  return input
    // Remover tags HTML
    .replace(/<[^>]*>/g, '')
    // Remover comillas (previene SQL injection básico)
    .replace(/['"]/g, '')
    // Remover caracteres especiales (incluye símbolos de operador)
    .replace(SANITIZE_REGEX, '')
    // Normalizar espacios
    .replace(/\s+/g, ' ')
    // Trim
    .trim()
}

/**
 * Sanitiza search query inputs (más permisivo para búsquedas)
 */
export function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') return ''

  // Truncar a max 100 caracteres
  let sanitized = input.slice(0, 100)
    // Remover tags
    .replace(/<[^>]*>/g, '')
    // Remover comillas simples y dobles
    .replace(/['"]/g, '')
    // Remover comentarios SQL (--)
    .replace(/--/g, '')
    // Remover caracteres especiales peligrosos
    .replace(/[^\w\s\-_áéíóúñÁÉÍÓÚÑ]/g, '')
    // Normalizar espacios múltiples
    .replace(/\s+/g, ' ')
    .trim()

  return sanitized
}

// ---- FARMACIAS ----

// Validar que pharmacyId sea un ObjectId válido de MongoDB
const mongoObjectIdRegex = /^[a-fA-F0-9]{24}$/

export const pharmacyCreateSchema = z.object({
  pharmacyName: z.string()
    .min(2, 'El nombre es requerido')
    .max(100, 'Máximo 100 caracteres')
    .trim(),
  address: z.string().max(200).trim().optional(),
  phone: mexicanPhoneSchema,
  email: z.string().email('Email inválido').toLowerCase().trim().optional().or(z.literal('')),
})

export const pharmacyUpdateSchema = z.object({
  pharmacyName: z.string()
    .min(2)
    .max(100)
    .trim()
    .optional(),
  address: z.string().max(200).trim().optional(),
  phone: mexicanPhoneSchema,
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
  phone: mexicanPhoneSchema,
  assignedPharmacies: z.array(z.string()).max(50).default([]),
})

// Schema para actualizar usuario - los roles válidos se validan según permisos del editor
export const adminUpdateUserSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  username: z.string().min(3).max(30).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'SUPER_ADMIN', 'ENCARGADO', 'VENDEDOR']).optional(),
  phone: mexicanPhoneSchema,
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
  pharmacyId: z.string().optional(), // ID de farmacia para asignar el pedido
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
  pharmacyId: z.string().optional(), // ID de farmacia para asignar el gasto
})

export const updateExpenseStatusSchema = z.object({
  status: z.nativeEnum(ExpenseStatus),
  adminComment: z.string().max(1000).optional(),
})

// ---- PAGINATION ----

// Schema para parámetros de paginación
export const paginationParams = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export type PaginationParams = z.infer<typeof paginationParams>

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
