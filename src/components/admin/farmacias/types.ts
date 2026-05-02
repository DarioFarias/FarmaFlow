/**
 * @fileoverview Type definitions for Pharmacy Admin Modals
 * Follows the pattern from UserModals (CreateUserModal, EditUserModal)
 */

import type { IPharmacyMetrics } from '@/types/api-responses'

// =============================================
// Form Data Types
// =============================================

/**
 * Form data structure for creating/updating a pharmacy
 */
export interface PharmacyFormData {
  pharmacyName: string
  address?: string
  phone?: string
  email?: string
  schedule?: string
  latitude?: number
  longitude?: number
}

// =============================================
// Modal Props Types
// =============================================

/**
 * Props for CreatePharmacyModal
 */
export interface CreatePharmacyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

/**
 * Props for EditPharmacyModal
 */
export interface EditPharmacyModalProps {
  isOpen: boolean
  pharmacy: IPharmacyMetrics | null
  onClose: () => void
  onSuccess: () => void
}

/**
 * Props for PharmacyDetailsModal
 */
export interface PharmacyDetailsModalProps {
  isOpen: boolean
  pharmacy: IPharmacyMetrics | null
  onClose: () => void
  onEdit: (pharmacy: IPharmacyMetrics) => void
}

// =============================================
// Utility Types
// =============================================

/**
 * Type for pharmacy status filter options
 */
export type PharmacyStatusFilter = 'all' | 'active' | 'inactive'

/**
 * Type for sort options
 */
export type PharmacySortOption = 'name-asc' | 'name-desc' | 'pending-orders' | 'pending-expenses' | 'recent'