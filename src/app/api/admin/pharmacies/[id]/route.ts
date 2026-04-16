import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Pharmacy from '@/models/Pharmacy'
import { isSuperAdmin, isAdmin } from '@/lib/roles'
import { UserRole } from '@/types'
import { pharmacyUpdateSchema } from '@/lib/validations'
import { z } from 'zod'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (!isSuperAdmin(session.user.role as UserRole) && !isAdmin(session.user.role as UserRole))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await connectDB()
    const pharmacy = await Pharmacy.findById(params.id)

    if (!pharmacy) {
      return NextResponse.json({ error: 'Farmacia no encontrada' }, { status: 404 })
    }

    return NextResponse.json(pharmacy)
  } catch (error) {
    console.error('Error fetching pharmacy:', error)
    return NextResponse.json({ error: 'Error al obtener farmacia' }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (!isSuperAdmin(session.user.role as UserRole) && !isAdmin(session.user.role as UserRole))) {
      return NextResponse.json({ error: 'No授权' }, { status: 403 })
    }

    const body = await req.json()
    const validated = pharmacyUpdateSchema.parse(body)

    await connectDB()
    const pharmacy = await Pharmacy.findById(params.id)

    if (!pharmacy) {
      return NextResponse.json({ error: 'Farmacia no encontrada' }, { status: 404 })
    }

    // Validar pharmacyCode único (si se cambia)
    if (validated.pharmacyCode) {
      const existingCode = await Pharmacy.findOne({ 
        pharmacyCode: validated.pharmacyCode.toUpperCase(), 
        _id: { $ne: params.id } 
      })
      if (existingCode) {
        return NextResponse.json({ error: 'El código de farmacia ya está en uso' }, { status: 400 })
      }
      pharmacy.pharmacyCode = validated.pharmacyCode.toUpperCase()
    }

    // Validar pharmacyName único (si se cambia)
    if (validated.pharmacyName) {
      const existingName = await Pharmacy.findOne({ 
        pharmacyName: { $regex: new RegExp(`^${validated.pharmacyName}$`, 'i') },
        _id: { $ne: params.id }
      })
      if (existingName) {
        return NextResponse.json({ error: 'Ya existe una farmacia con ese nombre' }, { status: 400 })
      }
      pharmacy.pharmacyName = validated.pharmacyName
    }

    if (validated.address !== undefined) pharmacy.address = validated.address || undefined
    if (validated.phone !== undefined) pharmacy.phone = validated.phone || undefined
    if (validated.email !== undefined) pharmacy.email = validated.email || undefined
    if (validated.isActive !== undefined) pharmacy.isActive = validated.isActive

    await pharmacy.save()

    return NextResponse.json({
      message: 'Farmacia actualizada correctamente',
      pharmacy: {
        _id: pharmacy._id,
        pharmacyCode: pharmacy.pharmacyCode,
        pharmacyName: pharmacy.pharmacyName,
        address: pharmacy.address,
        phone: pharmacy.phone,
        email: pharmacy.email,
        isActive: pharmacy.isActive,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
      return NextResponse.json({ error: errorMessages }, { status: 400 })
    }
    console.error('Error updating pharmacy:', error)
    return NextResponse.json({ error: 'Error al actualizar farmacia' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (!isSuperAdmin(session.user.role as UserRole) && !isAdmin(session.user.role as UserRole))) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    await connectDB()
    const pharmacy = await Pharmacy.findById(params.id)

    if (!pharmacy) {
      return NextResponse.json({ error: 'Farmacia no encontrada' }, { status: 404 })
    }

    // Soft delete: marcar como inactiva
    pharmacy.isActive = false
    await pharmacy.save()

    return NextResponse.json({ message: 'Farmacia eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting pharmacy:', error)
    return NextResponse.json({ error: 'Error al eliminar farmacia' }, { status: 500 })
  }
}