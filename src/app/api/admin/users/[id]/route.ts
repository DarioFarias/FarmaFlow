import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import { isSuperAdmin, canEditUser, canManageUsers, validatePharmacyAssignment } from '@/lib/roles'
import { UserRole } from '@/types'
import { adminUpdateUserSchema } from '@/lib/validations'
import { z } from 'zod'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const editorRole = session?.user?.role as UserRole
    
    // Verificar que el usuario pueda editar usuarios (no es VENDEDOR)
    if (!session || !canManageUsers(editorRole)) {
      return NextResponse.json({ error: 'No autorizado. No tienes permisos para editar usuarios.' }, { status: 403 })
    }

    const body = await req.json()
    const { id } = params

    // Validar con Zod
    const validated = adminUpdateUserSchema.parse(body)

    await connectDB()
    const user = await User.findById(id)

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Si se está intentando cambiar el rol, verificar permisos con canEditUser
    if (validated.role !== undefined) {
      const targetRole = validated.role as UserRole
      if (!canEditUser(editorRole, targetRole)) {
        return NextResponse.json({ error: 'No tienes permisos para asignar este rol' }, { status: 403 })
      }
    }

    // Validar asignación de farmacias según el rol del editor y del destino
    // Usar el rol destino (el actual si no se está cambiando, o el nuevo si se cambia)
    const targetRole = (validated.role as UserRole) || user.role
    if (validated.assignedPharmacies !== undefined) {
      const pharmacyValidation = validatePharmacyAssignment(
        targetRole,
        validated.assignedPharmacies,
        editorRole,
        session.user.assignedPharmacies
      )
      if (!pharmacyValidation.valid) {
        return NextResponse.json({ error: pharmacyValidation.error }, { status: 400 })
      }
    }

    // Actualizar campos
    if (validated.name !== undefined) user.name = validated.name
    if (validated.username !== undefined) {
      // Verificar que el nuevo username no esté en uso por otro usuario (case-sensitive)
      const existingUsername = await User.findOne({ username: validated.username, _id: { $ne: id } })
      if (existingUsername) {
        return NextResponse.json({ error: 'El nombre de usuario ya está en uso por otro usuario' }, { status: 400 })
      }
      user.username = validated.username
    }
    if (validated.email !== undefined) {
      // Tratar string vacío como null (el email es opcional)
      const emailValue = validated.email.trim() === '' ? null : validated.email.toLowerCase().trim()
      
      // Verificar que el nuevo email no esté en uso por otro usuario (solo si hay un email válido)
      if (emailValue) {
        const existingEmail = await User.findOne({ email: emailValue, _id: { $ne: id } })
        if (existingEmail) {
          return NextResponse.json({ error: 'El email ya está en uso por otro usuario' }, { status: 400 })
        }
      }
      user.email = emailValue || undefined
    }
    if (validated.role !== undefined) user.role = validated.role as UserRole
    if (validated.phone !== undefined) user.phone = validated.phone
    if (validated.isActive !== undefined) user.isActive = validated.isActive
    if (validated.assignedPharmacies !== undefined) user.assignedPharmacies = validated.assignedPharmacies

    await user.save()

    return NextResponse.json({ message: 'Usuario actualizado correctamente' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !isSuperAdmin(session.user.role as UserRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const { id } = params
    
    // 1. Prevenir auto-eliminación
    if (session.user.id === id) {
      return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 })
    }

    await connectDB()
    const user = await User.findById(id)

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // 2. Prevenir eliminación del último Super Admin
    if (user.role === UserRole.SUPER_ADMIN) {
      const superAdminCount = await User.countDocuments({ role: UserRole.SUPER_ADMIN, isActive: true })
      if (superAdminCount <= 1) {
        return NextResponse.json({ 
          error: 'No se puede eliminar al último Super Admin activo. El sistema debe tener al menos uno.' 
        }, { status: 400 })
      }
    }

    // Soft delete: marcar como inactivo
    user.isActive = false
    await user.save()

    return NextResponse.json({ message: 'Usuario eliminado correctamente' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 })
  }
}
