import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}))

// Mock cloudinary upload
vi.mock('@/lib/cloudinary', () => ({
  uploadInvoiceImage: vi.fn(),
}))

// Mock Buffer
vi.mock('buffer', () => ({
  Buffer: {
    from: vi.fn((array: Uint8Array) => Buffer.from(array)),
  },
}))

import { POST } from './route'
import { getServerSession } from 'next-auth'
import { uploadInvoiceImage } from '@/lib/cloudinary'

const mockGetServerSession = getServerSession as ReturnType<typeof vi.fn>
const mockUploadInvoiceImage = uploadInvoiceImage as ReturnType<typeof vi.fn>

// Helper to create NextRequest with mocked formData
function createMockRequest(formDataEntries: Record<string, any>) {
  const mockFormData = new Map<string, any>()
  
  for (const [key, value] of Object.entries(formDataEntries)) {
    mockFormData.set(key, value)
  }
  
  // Override formData to return our mock
  const req = new NextRequest('http://localhost:3000/api/expenses/upload', {
    method: 'POST',
  }) as NextRequest & { formData: () => Promise<FormData> }
  
  req.formData = async () => {
    const fd = new FormData()
    mockFormData.forEach((value, key) => {
      fd.append(key, value)
    })
    return fd
  }
  
  return req
}

describe('POST /api/expenses/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('REQ-001: Authorization', () => {
    it('should return 401 when no session exists', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const req = createMockRequest({
        file: new Blob(['test'], { type: 'image/jpeg' }),
        pharmacyCode: 'pharm-001',
      })

      const response = await POST(req)
      expect(response.status).toBe(401)
      
      const json = await response.json()
      expect(json.error).toBe('No autorizado')
    })
  })

  describe('REQ-002: Missing file validation', () => {
    it('should return 400 when file field is missing', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      const req = createMockRequest({
        pharmacyCode: 'pharm-001',
      })

      const response = await POST(req)
      expect(response.status).toBe(400)
      
      const json = await response.json()
      expect(json.error).toBe('Archivo no proporcionado')
    })

    it('should return 400 when pharmacyCode is missing', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      const req = createMockRequest({
        file: new Blob(['test'], { type: 'image/jpeg' }),
      })

      const response = await POST(req)
      expect(response.status).toBe(400)
      
      const json = await response.json()
      expect(json.error).toBe('Código de farmacia requerido')
    })
  })

  describe('REQ-003: Successful upload', () => {
    it('should return 200 with { url, publicId } on successful upload', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      mockUploadInvoiceImage.mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        publicId: 'farmaflow/expenses/pharm-001/image123',
      })

      const req = createMockRequest({
        file: new Blob(['test-image-data'], { type: 'image/jpeg' }),
        pharmacyCode: 'pharm-001',
      })

      const response = await POST(req)
      expect(response.status).toBe(200)
      
      const json = await response.json()
      expect(json.url).toBe('https://res.cloudinary.com/demo/image/upload/sample.jpg')
      expect(json.publicId).toBe('farmaflow/expenses/pharm-001/image123')
    })

    it('should call uploadInvoiceImage with correct parameters', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      mockUploadInvoiceImage.mockResolvedValue({
        url: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        publicId: 'farmaflow/expenses/pharm-001/image123',
      })

      const req = createMockRequest({
        file: new Blob(['test-image-data'], { type: 'image/jpeg' }),
        pharmacyCode: 'pharm-001',
      })

      await POST(req)

      expect(mockUploadInvoiceImage).toHaveBeenCalled()
      const callArg = mockUploadInvoiceImage.mock.calls[0]
      // Verify base64 data URI format
      expect(callArg[0]).toContain('data:image/jpeg;base64,')
      expect(callArg[1]).toBe('pharm-001')
    })
  })

  describe('Error handling', () => {
    it('should return 500 when uploadInvoiceImage throws', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-123', role: 'ADMIN' },
      })

      mockUploadInvoiceImage.mockRejectedValue(new Error('Cloudinary error'))

      const req = createMockRequest({
        file: new Blob(['test'], { type: 'image/jpeg' }),
        pharmacyCode: 'pharm-001',
      })

      const response = await POST(req)
      expect(response.status).toBe(500)
      
      const json = await response.json()
      expect(json.error).toBe('Error al subir la imagen')
    })
  })
})