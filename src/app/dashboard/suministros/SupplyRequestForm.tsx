'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { createSupplyRequestSchema, type CreateSupplyRequestInput } from '@/lib/validations'
import { SupplyCategory } from '@/types'
import { toast } from 'react-hot-toast'
import { Loader2, ArrowLeft, Plus, Trash2, Send } from 'lucide-react'
import Link from 'next/link'

interface MyPharmacy {
  pharmacyId: string
  pharmacyName: string
}

const CATEGORIES = [
  { value: SupplyCategory.OFFICE_SUPPLIES, label: 'Papelería / Oficina' },
  { value: SupplyCategory.CLEANING, label: 'Limpieza' },
  { value: SupplyCategory.PHARMACY_SUPPLIES, label: 'Insumos de Farmacia' },
  { value: SupplyCategory.OTHER, label: 'Otros' },
]

const UNITS = ['Unidades', 'Cajas', 'Packs', 'Litros', 'Kilos', 'Bolsas']

// Helper para verificar si es rol admin
const isAdminRole = (role?: string) => role === 'ADMIN' || role === 'SUPER_ADMIN'

export function SupplyRequestForm() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [myPharmacies, setMyPharmacies] = useState<MyPharmacy[]>([])
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('')

  const userRole = session?.user?.role
  const isAdmin = isAdminRole(userRole)

  // Cargar las pharmacies asignadas al usuario
  // ADMIN/SUPER_ADMIN siempre cargan (reciben todas las pharmacies)
  // Otros roles solo cargan si tienen assignedPharmacies
  useEffect(() => {
    const fetchMyPharmacies = async () => {
      try {
        const res = await fetch('/api/my-pharmacies')
        if (res.ok) {
          const data = await res.json()
          setMyPharmacies(data.data || [])

          // Auto-seleccionar si solo tiene una pharmacy
          if (data.data?.length === 1) {
            setSelectedPharmacyId(data.data[0].pharmacyId)
          }
        }
      } catch (error) {
        console.error('Error fetching my pharmacies:', error)
      }
    }

    // Cargar siempre para ADMIN, o si tiene assignedPharmacies para otros roles
    const hasAssignedPharmacies = (session?.user?.assignedPharmacies?.length ?? 0) > 0
    if (isAdmin || hasAssignedPharmacies) {
      fetchMyPharmacies()
    }
  }, [session, isAdmin])

  // ADMIN siempre ve el selector (aunque tenga 1 pharmacy)
  // Otros roles ven el selector solo si tienen múltiples pharmacies
  const showPharmacySelector = isAdmin || myPharmacies.length > 1

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSupplyRequestInput>({
    resolver: zodResolver(createSupplyRequestSchema),
    defaultValues: {
      items: [{ name: '', category: SupplyCategory.PHARMACY_SUPPLIES, quantity: 1, unit: 'Unidades' }],
      priority: 'NORMAL',
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  })

  const onSubmit = async (data: CreateSupplyRequestInput) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/supplies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          // Incluir pharmacyId si el usuario tiene farmacias asignadas
          ...(myPharmacies.length > 0 && selectedPharmacyId
            ? { pharmacyId: selectedPharmacyId }
            : {}),
        }),
      })

      if (!response.ok) {
        throw new Error('Error al enviar el pedido')
      }

      toast.success('¡Pedido enviado correctamente!')
      router.push('/dashboard/suministros')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6">
        <Link 
          href="/dashboard/suministros"
          className="inline-flex items-center text-sm text-gray-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Volver a mis pedidos
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Selector de Farmacia - mostrar para ADMIN o si tiene 2+ */}
        {showPharmacySelector && myPharmacies.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-2">
              <label className="label">Farmacia</label>
              <select
                value={selectedPharmacyId}
                onChange={(e) => setSelectedPharmacyId(e.target.value)}
                className="input"
                required={isAdmin}
              >
                <option value="">Seleccionar farmacia...</option>
                {myPharmacies.map(p => (
                  <option key={p.pharmacyId} value={p.pharmacyId}>
                    {p.pharmacyName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Items del Pedido</h3>
              <p className="text-sm text-gray-500 text-pretty">Agregá todos los insumos que necesitás en este pedido.</p>
            </div>
            <button
              type="button"
              onClick={() => append({ name: '', category: SupplyCategory.PHARMACY_SUPPLIES, quantity: 1, unit: 'Unidades' })}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-xl hover:bg-brand-100 transition-colors"
            >
              <Plus size={16} />
              Agregar Ítem
            </button>
          </div>

          <div className="p-6 space-y-4">
            {fields.map((field, index) => (
              <div 
                key={field.id} 
                className="group relative grid grid-cols-1 md:grid-cols-12 gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-brand-100 hover:shadow-sm transition-all duration-300"
              >
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nombre del Insumo</label>
                  <input
                    {...register(`items.${index}.name`)}
                    placeholder="Ej: Resma A4"
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-gray-900 placeholder:text-gray-300"
                  />
                  {errors.items?.[index]?.name && (
                    <p className="text-[10px] text-red-500">{errors.items[index]?.name?.message}</p>
                  )}
                </div>

                <div className="md:col-span-3 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Categoría</label>
                  <select
                    {...register(`items.${index}.category`)}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-gray-600"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cantidad</label>
                  <input
                    type="number"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-brand-600"
                  />
                </div>

                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unidad</label>
                  <select
                    {...register(`items.${index}.unit`)}
                    className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-gray-600"
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-1 flex items-center justify-end">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Notas Adicionales</h3>
            <textarea
              {...register('notes')}
              placeholder="Escribí aquí cualquier aclaración importante sobre el pedido..."
              rows={4}
              className="input resize-none"
            />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Prioridad del Pedido</h3>
            <div className="grid grid-cols-2 gap-2">
              {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map((p) => (
                <label key={p} className="relative">
                  <input
                    type="radio"
                    value={p}
                    {...register('priority')}
                    className="peer sr-only"
                  />
                  <div className="flex items-center justify-center p-2 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer peer-checked:bg-brand-50 peer-checked:text-brand-700 peer-checked:border-brand-200 transition-all">
                    {p === 'URGENT' ? '🔥 URGENTE' : p}
                  </div>
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-6 btn-primary flex items-center justify-center gap-2 py-3"
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  Enviar Pedido
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
