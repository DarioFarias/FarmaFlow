import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/verify-password/route'
import { NextRequest } from 'next/server'

// Mock de dependencias
vi.mock('@/lib/auth', () => ({
  authOptions: { mock: true },
}))

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/mongodb', () => ({
  default: vi.fn(),
}))

vi.mock('@/models/User', () => ({
  default: {
    findById: vi.fn(),
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}))

import { getServerSession } from 'next-auth'
import User from '@/models/User'
import bcrypt from 'bcryptjs'

describe('POST /api/auth/verify-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if no session', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password: 'test123' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe('No autorizado. Se requiere sesión activa.')
  })

  it('returns 400 if no password provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123', role: 'ADMIN' },
    })

    const req = new NextRequest('http://localhost:3000/api/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toBe('La contraseña es requerida')
  })

  it('returns valid: false if password is incorrect', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123', role: 'ADMIN' },
    })

    vi.mocked(User.findById).mockResolvedValue({
      _id: 'user-123',
      password: 'hashed_password',
    })

    vi.mocked(bcrypt.compare).mockResolvedValue(false)

    const req = new NextRequest('http://localhost:3000/api/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong_password' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.valid).toBe(false)
  })

  it('returns valid: true if password is correct', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123', role: 'ADMIN' },
    })

    vi.mocked(User.findById).mockResolvedValue({
      _id: 'user-123',
      password: 'hashed_password',
    })

    vi.mocked(bcrypt.compare).mockResolvedValue(true)

    const req = new NextRequest('http://localhost:3000/api/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password: 'correct_password' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.valid).toBe(true)
  })

  it('returns 404 if user not found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-123', role: 'ADMIN' },
    })

    vi.mocked(User.findById).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/auth/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password: 'test123' }),
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(404)
    expect(json.error).toBe('Usuario no encontrado')
  })
})