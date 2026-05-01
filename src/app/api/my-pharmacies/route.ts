import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Pharmacy from '@/models/Pharmacy'
import { UserRole } from '@/types'

// =============================================
// API Route: /api/my-pharmacies
// Devuelve las pharmacies asignadas al usuario actual
// ADMIN/SUPER_ADMIN reciben TODAS las pharmacies activas
// Solo devuelve _id y pharmacyName (para dropdowns)
// =============================================

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    await connectDB()

    const userRole = session.user.role as UserRole
    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN

    let pharmacies

    if (isAdmin) {
      // ADMIN/SUPER_ADMIN: retornar TODAS las pharmacies activas
      pharmacies = await Pharmacy.find({ isActive: true })
        .select('_id pharmacyName')
        .sort({ pharmacyName: 1 })
    } else {
      // Otros roles: solo las pharmacies asignadas
      const assignedPharmacies = session.user.assignedPharmacies || []

      // Si no tiene farmacias asignadas, devolver array vacío
      if (assignedPharmacies.length === 0) {
        return NextResponse.json({ data: [] })
      }

      // Buscar las farmacias asignadas al usuario por _id
      pharmacies = await Pharmacy.find({
        _id: { $in: assignedPharmacies },
        isActive: true,
      })
        .select('_id pharmacyName')
        .sort({ pharmacyName: 1 })
    }

    // Mapear para devolver solo los campos necesarios
    const result = pharmacies.map(p => ({
      pharmacyId: p._id.toString(),
      pharmacyName: p.pharmacyName,
    }))

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('API_MY_PHARMACIES_ERROR:', error)
    return NextResponse.json(
      { error: 'Error al obtener las farmacias asignadas' },
      { status: 500 }
    )
  }
}