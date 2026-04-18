// =============================================
// FARMAFLOW - Tipos e Interfaces TypeScript
// /src/types/index.ts
// Fuente única de verdad para todas las interfaces del sistema
// =============================================

// ---- ENUMS DE ROLES ----

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN', // Nivel 0 - Acceso total a todas las farmacias
  ADMIN = 'ADMIN',             // Nivel 1 - Acceso total a todas las farmacias
  SUPERVISOR = 'SUPERVISOR',   // Nivel 2 - Acceso limitado a assignedPharmacies
  ENCARGADO = 'ENCARGADO',     // Nivel 3 - Acceso a assignedPharmacy (una sola)
  VENDEDOR = 'VENDEDOR',       // Nivel 4 - Sin acceso a gestión de farmacias
}

// ---- MÁQUINA DE ESTADOS: REQUERIMIENTOS DE SUMINISTROS ----

export enum SupplyRequestStatus {
  REQUESTED  = 'REQUESTED',   // Farmacia creó el pedido
  VALIDATING = 'VALIDATING',  // Supervisor revisando
  AUTHORIZED = 'AUTHORIZED',  // Supervisor aprobó
  APPROVED   = 'APPROVED',     // Aprobado (sinónimo de AUTHORIZED)
  REJECTED   = 'REJECTED',     // Supervisor rechazó
  SHIPPED    = 'SHIPPED',      // Suministros enviados desde depósito
  DELIVERED  = 'DELIVERED',    // Entregado/recibido
  RECEIVED   = 'RECEIVED',     // Farmacia confirmó recepción
}

// ---- CATEGORÍAS DE SUMINISTROS ----

export enum SupplyCategory {
  OFFICE_SUPPLIES = 'PAPELERIA',    // Papelería / Oficina
  CLEANING = 'LIMPIEZA',            // Artículos de limpieza
  PHARMACY_SUPPLIES = 'INSUMO_FARMACIA', // Insumos de Farmacia
  OTHER = 'OTROS',                  // Otros
}

// ---- ESTADOS DE REPORTE DE GASTOS ----

export enum ExpenseStatus {
  PENDING   = 'PENDING',    // Subido por farmacia, pendiente de revisión
  REVIEWED  = 'REVIEWED',   // Supervisor revisó
  APPROVED  = 'APPROVED',   // Gasto aprobado/auditado
  DISPUTED  = 'DISPUTED',   // Gasto en disputa / requiere aclaración
}

// ---- CATEGORÍAS DE GASTOS ----

export enum ExpenseCategory {
  MAINTENANCE = 'MANTENIMIENTO',  // Reparaciones y Mantenimiento
  UTILITIES = 'SERVICIOS',        // Luz, Agua, Gas, Internet
  RENT = 'ALQUILER',              // Alquiler / Expensas
  SALARIES = 'SUELDOS',          // Sueldos / Comisiones
  TAXES = 'IMPUESTOS',            // Impuestos y Tasas
  OTHER = 'OTROS',                // Otros Gastos
}

// =============================================
// INTERFACES DE DOMINIO
// =============================================

// ---- FARMACIA (Entidad independiente del usuario) ----

export interface IPharmacy {
  _id: string
  pharmacyName: string      // Nombre del establecimiento
  address?: string        // Dirección física
  phone?: string          // Teléfono de contacto
  email?: string          // Email de contacto
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ---- USUARIO ----

export interface IUser {
  _id: string
  name: string
  email?: string          // Opcional - usuario puede registrarse sin email
  username: string           // Identificador único de usuario (min 3, max 30 caracteres)
  password: string          // Almacenado como hash bcrypt
  role: UserRole
  phone?: string
  isActive: boolean
  profileImage?: string     // URL de Cloudinary
  profileImagePublicId?: string // ID de Cloudinary para gestión
  assignedPharmacies?: string[] // Códigos de farmacia asignados (SUPERVISOR, ADMIN, ENCARGADO, etc.)
  // Campos legacy de backwards compatibility - migrados a colección Pharmacy
  pharmacyName?: string
  pharmacyCode?: string
  createdAt: Date
  updatedAt: Date
}

// Vista pública del usuario (sin password)
export type IUserPublic = Omit<IUser, 'password'>

// ---- ÍTEM DE SUMINISTRO DENTRO DE UN PEDIDO ----

export interface ISupplyItem {
  name: string
  category: SupplyCategory
  quantity: number
  unit: string              // 'unidades', 'rollos', 'cajas', etc.
  notes?: string
}

// ---- EVENTO DEL HISTORIAL DE ESTADOS ----

export interface IStatusHistoryEvent {
  status: SupplyRequestStatus
  changedBy: string         // User ID
  changedAt: Date
  comment?: string
}

// ---- REQUERIMIENTO DE SUMINISTROS ----

export interface ISupplyRequest {
  _id: string
  requestNumber: string     // Auto-generado: "REQ-2024-001"
  pharmacy: string          // Pharmacy ID (ref a Pharmacy)
  pharmacyName: string      // Denormalizado para queries rápidas
  items: ISupplyItem[]
  status: SupplyRequestStatus
  statusHistory: IStatusHistoryEvent[]
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  notes?: string            // Notas de la farmacia al crear el pedido
  adminNotes?: string       // Notas internas del supervisor
  rejectionReason?: string  // Motivo si status === REJECTED
  shippingDate?: Date       // Fecha de despacho
  expectedDelivery?: Date   // Fecha estimada de entrega
  receivedAt?: Date         // Fecha de confirmación de recepción
  createdAt: Date
  updatedAt: Date
}

// ---- REPORTE DE GASTO ----

export interface IExpense {
  _id: string
  expenseNumber: string     // Auto-generado: "EXP-2024-001"
  pharmacy: string          // Pharmacy ID (ref a Pharmacy)
  pharmacyName: string      // Denormalizado
  amount: number            // Monto en moneda local
  currency: string          // 'MXN', 'USD', etc.
  category: ExpenseCategory
  description: string       // Descripción del gasto
  vendor?: string           // Proveedor / local donde se realizó
  receiptDate: Date         // Fecha de la factura/ticket
  invoiceImageUrl?: string  // URL de Cloudinary con la foto de la factura
  invoicePublicId?: string  // Public ID en Cloudinary (para eliminación)
  status: ExpenseStatus
  reviewedBy?: string       // User ID del supervisor que revisó
  reviewedAt?: Date
  adminComment?: string     // Comentario del supervisor
  createdAt: Date
  updatedAt: Date
}

// =============================================
// TIPOS PARA API RESPONSES
// =============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  limit: number
  totalPages: number
}

// =============================================
// TIPOS PARA FORMULARIOS (crear/actualizar)
// =============================================

export type CreateSupplyRequestDTO = Pick<
  ISupplyRequest,
  'items' | 'priority' | 'notes'
>

export type UpdateSupplyStatusDTO = {
  status: SupplyRequestStatus
  comment?: string
  rejectionReason?: string
  shippingDate?: Date
  expectedDelivery?: Date
}

export type CreateExpenseDTO = Pick<
  IExpense,
  | 'amount'
  | 'currency'
  | 'category'
  | 'description'
  | 'vendor'
  | 'receiptDate'
  | 'invoiceImageUrl'
  | 'invoicePublicId'
>

export type UpdateExpenseStatusDTO = {
  status: ExpenseStatus
  adminComment?: string
}
