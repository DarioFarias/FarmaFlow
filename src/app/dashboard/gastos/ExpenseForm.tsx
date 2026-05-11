'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { createExpenseSchema, type CreateExpenseInput } from '@/lib/validations'
import { ExpenseCategory } from '@/types'
import { toast } from 'react-hot-toast'
import { Loader2, ArrowLeft, Camera, Send } from 'lucide-react'
import Link from 'next/link'
import { compressImage } from '@/lib/image-utils'
import { useMyPharmacies } from '@/lib/hooks/use-my-pharmacies'

interface MyPharmacy {
  pharmacyId: string
  pharmacyName: string
}

const CATEGORIES = [
  { value: ExpenseCategory.UTILITIES, label: 'Luz, Agua, Gas, Internet' },
  { value: ExpenseCategory.MAINTENANCE, label: 'Reparaciones y Mantenimiento' },
  { value: ExpenseCategory.RENT, label: 'Alquiler / Expensas' },
  { value: ExpenseCategory.SALARIES, label: 'Sueldos / Comisiones' },
  { value: ExpenseCategory.TAXES, label: 'Impuestos y Tasas' },
  { value: ExpenseCategory.OTHER, label: 'Otros Gastos' },
]

// Helper para verificar si es rol admin
const isAdminRole = (role?: string) => role === 'ADMIN' || role === 'SUPER_ADMIN'

export function ExpenseForm() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('')

  const userRole = session?.user?.role
  const isAdmin = isAdminRole(userRole)

  // Use React Query hook for caching pharmacy data
  const { pharmacies: myPharmacies, isLoading: isLoadingPharmacies } = useMyPharmacies()

  // ADMIN siempre ve el selector (aunque tenga 1 pharmacy)
  // Otros roles ven el selector solo si tienen múltiples pharmacies
  const showPharmacySelector = isAdmin || myPharmacies.length > 1
  const currentPharmacy = myPharmacies.find(p => p.pharmacyId === selectedPharmacyId)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      currency: 'ARS',
      receiptDate: new Date().toISOString(),
    },
  })

  // Auto-select if only one pharmacy
  if (myPharmacies.length === 1 && !selectedPharmacyId) {
    setSelectedPharmacyId(myPharmacies[0].pharmacyId)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  // Upload to server API which proxies to Cloudinary
  const uploadInvoiceImage = async (file: Blob, pharmacyCode: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('pharmacyCode', pharmacyCode)

    const response = await fetch('/api/expenses/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al subir la imagen')
    }
    return response.json()
  }

  const onSubmit = async (data: CreateExpenseInput) => {
    if (!selectedFile) {
      toast.error('Debes subir una foto de la factura o ticket')
      return
    }

    // Determine pharmacy code for upload
    const uploadPharmacyCode = selectedPharmacyId || myPharmacies[0]?.pharmacyId
    if (!uploadPharmacyCode) {
      toast.error('Debes seleccionar una farmacia')
      return
    }

    setIsLoading(true)
    try {
      // 1. Comprimir imagen
      toast.loading('Comprimiendo imagen...', { id: 'expense-load' })
      const compressedBlob = await compressImage(selectedFile, 1000, 0.6)

      // 2. Subir al servidor (que proxya a Cloudinary)
      toast.loading('Subiendo comprobante...', { id: 'expense-load' })
      const cloudData = await uploadInvoiceImage(compressedBlob, uploadPharmacyCode)

      // 3. Guardar en la API
      toast.loading('Guardando registro...', { id: 'expense-load' })
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          invoiceImageUrl: cloudData.url,
          invoicePublicId: cloudData.publicId,
          // Incluir pharmacyId si el usuario tiene farmacias asignadas
          ...(myPharmacies.length > 0 && selectedPharmacyId
            ? { pharmacyId: selectedPharmacyId }
            : {}),
        }),
      })

      if (!response.ok) throw new Error('Error al guardar el gasto')

      toast.success('¡Gasto rendido con éxito!', { id: 'expense-load' })
      router.push('/dashboard/gastos')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message, { id: 'expense-load' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link 
          href="/dashboard/gastos"
          className="inline-flex items-center text-sm text-gray-500 hover:text-brand-600 transition-colors"
        >
          <ArrowLeft size={16} className="mr-1" />
          Volver a mis gastos
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="label">Monto del Gasto</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    {...register('amount', { valueAsNumber: true })}
                    className="input pl-8 text-lg font-bold text-brand-600"
                    placeholder="0.00"
                  />
                </div>
                {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
              </div>

              {/* Selector de Farmacia - mostrar para ADMIN o si tiene 2+ */}
              {showPharmacySelector && myPharmacies.length > 0 && (
                <div className="space-y-2">
                  <label className="label">
                    {isLoadingPharmacies ? (
                      <span className="flex items-center gap-1">
                        <Loader2 size={14} className="animate-spin" />
                        Cargando farmacias...
                      </span>
                    ) : (
                      'Farmacia'
                    )}
                  </label>
                  <select
                    value={selectedPharmacyId}
                    onChange={(e) => setSelectedPharmacyId(e.target.value)}
                    className="input"
                    required={isAdmin}
                    disabled={isLoadingPharmacies}
                  >
                    <option value="">Seleccionar farmacia...</option>
                    {myPharmacies.map(p => (
                      <option key={p.pharmacyId} value={p.pharmacyId}>
                        {p.pharmacyName}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
                </div>
              )}

              <div className="space-y-2">
                <label className="label">Categoría</label>
                <select {...register('category')} className="input">
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-full space-y-2">
                <label className="label">Descripción / Motivo</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="input resize-none"
                  placeholder="Ej: Pago de factura Edesur del mes de Mayo"
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="label">Proveedor / Comercio</label>
                <input {...register('vendor')} className="input" placeholder="Ej: Edesur, Carrefour, etc." />
              </div>

              <div className="space-y-2">
                <label className="label">Fecha del Comprobante</label>
                <input
                  type="date"
                  onChange={(e) => {
                    const date = new Date(e.target.value)
                    setValue('receiptDate', date.toISOString())
                  }}
                  className="input"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Comprobante (Foto/Ticket)</h3>
            <div className="relative aspect-[3/4] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden group hover:border-brand-300 transition-colors">
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-lg text-xs font-bold shadow-xl">
                      Cambiar Foto
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2 p-6 text-center">
                  <div className="h-12 w-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mb-2">
                    <Camera size={24} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Subir Factura</span>
                  <span className="text-xs text-gray-400">Sacá una foto clara del ticket</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center gap-2 py-4 shadow-xl shadow-brand-100"
          >
            {isLoading ? (
              <Loader2 size={24} className="animate-spin" />
            ) : (
              <>
                <Send size={20} />
                Rendir Gasto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}