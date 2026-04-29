// =============================================
// FARMAFLOW - Tipos para respuestas API
// /src/types/api-responses.ts
// Tipos específicos para datos que vienen de las APIs (usan strings en vez de enums)
// =============================================

// ---- ÍTEM DE SUMINISTRO (respuesta API) ----
export interface ISupplyItemResponse {
  name: string
  category: string        // String en vez de SupplyCategory enum
  quantity: number
  unit: string
  notes?: string
}

// ---- EVENTO DEL HISTORIAL DE ESTADOS (respuesta API) ----
export interface IStatusHistoryEventResponse {
  status: string        // String en vez de SupplyRequestStatus
  changedBy: string
  changedAt: string | Date
  comment?: string
}

// ---- REQUERIMIENTO DE SUMINISTROS (respuesta API) ----
export interface ISupplyRequestResponse {
  _id: string
  requestNumber: string
  pharmacy: string          // Pharmacy ID como string
  pharmacyName: string
  items: ISupplyItemResponse[]
  status: string          // String en vez de SupplyRequestStatus
  statusHistory: IStatusHistoryEventResponse[]
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'  // Los enums de strings sí funcionan
  notes?: string
  adminNotes?: string
  rejectionReason?: string
  shippingDate?: string | Date
  expectedDelivery?: string | Date
  receivedAt?: string | Date
  createdAt: string | Date
  updatedAt: string | Date
}

// ---- REPORTE DE GASTO (respuesta API) ----
export interface IExpenseResponse {
  _id: string
  expenseNumber: string
  pharmacy: string          // Pharmacy ID como string
  pharmacyName: string
  amount: number
  currency: string          // 'MXN', 'USD', etc.
  category: string        // String en vez de ExpenseCategory enum
  description: string
  vendor?: string
  receiptDate: string | Date
  invoiceImageUrl?: string
  status: string          // String en vez de ExpenseStatus enum
  reviewedBy?: string
  reviewedAt?: string | Date
  adminComment?: string
  createdAt: string | Date
  updatedAt: string | Date
}

// ---- FARMACIA (respuesta API) ----
export interface IPharmacyResponse {
  _id: string
  pharmacyName: string
  address?: string
  phone?: string
  email?: string
  isActive: boolean
  createdAt: string | Date
  updatedAt: string | Date
}

// ---- USUARIO ASIGNADO A FARMACIA (para métricas) ----
export interface IAssignedUser {
  name: string
  email?: string
  role: string
  isActive: boolean
}

// ---- RESUMEN MENSUAL DE FARMACIA ----
export interface IMonthlySummary {
  totalExpensesThisMonth: number
  deliveredOrders: number
  activeUsers: number
  lastActivity: string | Date
}

// ---- FARMACIA CON MÉTRICAS (respuesta API) ----
export interface IPharmacyMetrics extends Omit<IPharmacyResponse, 'createdAt' | 'updatedAt'> {
  pendingSupplyRequests: number
  pendingExpenses: number
  assignedUsers: IAssignedUser[]
  monthlySummary: IMonthlySummary
  createdAt: string | Date
  updatedAt: string | Date
}

// ---- USUARIO (respuesta API) ----
export interface IUserResponse {
  _id: string
  name: string
  email?: string
  username: string
  role: string          // String en vez de UserRole enum
  phone?: string
  isActive: boolean
  profileImage?: string
  assignedPharmacies?: string[]
  createdAt: string | Date
  updatedAt: string | Date
}

// =============================================
// TIPOS PARA PAGINACIÓN API
// =============================================

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pageSize: number
  totalPages: number
}