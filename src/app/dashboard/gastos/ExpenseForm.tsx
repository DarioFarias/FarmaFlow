'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useSession } from 'next-auth/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { createExpenseSchema, type CreateExpenseInput } from '@/lib/validations'
import { ExpenseStatus, IExpense } from '@/types'
import { toast } from 'react-hot-toast'
import { Loader2, ArrowLeft, Camera, Send, FileText, File, X, FileUp, FileDigit } from 'lucide-react'
import Link from 'next/link'
import { compressImage } from '@/lib/image-utils'
import { useMyPharmacies } from '@/lib/hooks/use-my-pharmacies'

interface MyPharmacy {
  pharmacyId: string
  pharmacyName: string
}

// Props para modo edición
interface ExpenseFormProps {
  expense?: IExpense
}

const isAdminRole = (role?: string) => role === 'ADMIN' || role === 'SUPER_ADMIN'

// Config de badges de estado
const STATUS_CONFIG: Record<string, { label: string, classes: string }> = {
  [ExpenseStatus.PENDIENTE_DE_FACTURAR]: {
    label: 'PENDIENTE DE FACTURAR',
    classes: 'bg-amber-50 text-amber-700 ring-amber-600/20'
  },
  [ExpenseStatus.FACTURADO]: {
    label: 'FACTURADO',
    classes: 'bg-blue-50 text-blue-700 ring-blue-600/20'
  },
  [ExpenseStatus.REPORTED]: {
    label: 'REPORTED',
    classes: 'bg-purple-50 text-purple-700 ring-purple-600/20'
  },
  [ExpenseStatus.PENDIENTE_DE_PAGO]: {
    label: 'PENDIENTE DE PAGO',
    classes: 'bg-orange-50 text-orange-700 ring-orange-600/20'
  },
  [ExpenseStatus.PAID]: {
    label: 'PAID',
    classes: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
  },
}

export function ExpenseForm({ expense }: ExpenseFormProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>('')

  // Phase 2: PDF and XML files
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [xmlFile, setXmlFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string | undefined>(expense?.pdfUrl)
  const [xmlUrl, setXmlUrl] = useState<string | undefined>(expense?.xmlUrl)

  const userRole = session?.user?.role
  const isAdmin = isAdminRole(userRole)

  const isEditMode = !!expense

  // React Query hook for caching pharmacy data
  const { pharmacies: myPharmacies, isLoading: isLoadingPharmacies } = useMyPharmacies()

  const showPharmacySelector = isAdmin || myPharmacies.length > 1

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateExpenseInput>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      currency: 'MXN',
      receiptDate: new Date().toISOString(),
    },
  })

  // Auto-select if only one pharmacy
  if (myPharmacies.length === 1 && !selectedPharmacyId) {
    setSelectedPharmacyId(myPharmacies[0].pharmacyId)
  }

  // Pre-fill form fields in edit mode
  useEffect(() => {
    if (!expense) return

    setValue('amount', expense.amount)
    setValue('description', expense.description)
    setValue('currency', expense.currency)
    setValue('receiptDate', new Date(expense.receiptDate).toISOString())

    if (expense.pharmacy) {
      setSelectedPharmacyId(expense.pharmacy)
    }

    if (expense.invoiceImageUrl) {
      setPreviewUrl(expense.invoiceImageUrl)
    }
  }, [expense, setValue])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
    } else if (file) {
      toast.error('El archivo debe ser PDF')
    }
  }

  const removePdf = () => {
    setPdfFile(null)
    setPdfUrl(undefined)
  }

  const handleXmlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.type === 'text/xml' || file.name.endsWith('.xml'))) {
      setXmlFile(file)
    } else if (file) {
      toast.error('El archivo debe ser XML')
    }
  }

  const removeXml = () => {
    setXmlFile(null)
    setXmlUrl(undefined)
  }

  // Upload ANY file (image, PDF, XML) through the server-side Cloudinary proxy
  const uploadFile = async (file: Blob, pharmacyCode: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('pharmacyCode', pharmacyCode)

    const response = await fetch('/api/expenses/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Error al subir archivo')
    }
    return response.json()
  }

  const onSubmit = async (data: CreateExpenseInput) => {
    if (!isEditMode && !selectedFile && !pdfFile) {
      toast.error('Debes subir una foto o archivo PDF de la factura')
      return
    }

    const uploadPharmacyCode = selectedPharmacyId || myPharmacies[0]?.pharmacyId
    if (!uploadPharmacyCode) {
      toast.error('Debes seleccionar una farmacia')
      return
    }

    setIsLoading(true)
    try {
      let invoiceImageUrl: string | undefined
      let invoicePublicId: string | undefined
      let pdfUrlValue: string | undefined
      let pdfPublicId: string | undefined
      let xmlUrlValue: string | undefined
      let xmlPublicId: string | undefined

      // Subir imagen original via server proxy (only if new file selected)
      if (selectedFile) {
        toast.loading('Comprimiendo imagen...', { id: 'expense-load' })
        const compressedBlob = await compressImage(selectedFile, 1000, 0.6)

        toast.loading('Subiendo comprobante...', { id: 'expense-load' })
        const cloudData = await uploadFile(compressedBlob, uploadPharmacyCode)
        invoiceImageUrl = cloudData.url
        invoicePublicId = cloudData.publicId
      }

      // Subir PDF (only if new file selected - task 2.2)
      if (pdfFile) {
        toast.loading('Subiendo PDF...', { id: 'expense-load' })
        const pdfData = await uploadFile(pdfFile, uploadPharmacyCode)
        pdfUrlValue = pdfData.url
        pdfPublicId = pdfData.publicId
      }

      // Subir XML (only if new file selected - task 2.2)
      if (xmlFile) {
        toast.loading('Subiendo XML...', { id: 'expense-load' })
        const xmlData = await uploadFile(xmlFile, uploadPharmacyCode)
        xmlUrlValue = xmlData.url
        xmlPublicId = xmlData.publicId
      }

      // Build request based on edit mode
      const isPatch = isEditMode
      const url = isPatch ? `/api/expenses/${expense._id}` : '/api/expenses'
      const method = isPatch ? 'PATCH' : 'POST'

      // Guardar en la API
      toast.loading(isPatch ? 'Actualizando registro...' : 'Guardando registro...', { id: 'expense-load' })
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          // Only include new file URLs if new files were uploaded
          ...(invoiceImageUrl && { invoiceImageUrl, invoicePublicId }),
          ...(pdfUrlValue && { pdfUrl: pdfUrlValue, pdfPublicId }),
          ...(xmlUrlValue && { xmlUrl: xmlUrlValue, xmlPublicId }),
          // Keep existing URLs if no new files uploaded (task 2.2)
          ...(!invoiceImageUrl && isEditMode && expense.invoiceImageUrl && { invoiceImageUrl: expense.invoiceImageUrl, invoicePublicId: expense.invoicePublicId }),
          ...(!pdfUrlValue && isEditMode && expense.pdfUrl && { pdfUrl: expense.pdfUrl, pdfPublicId: expense.pdfPublicId }),
          ...(!xmlUrlValue && isEditMode && expense.xmlUrl && { xmlUrl: expense.xmlUrl, xmlPublicId: expense.xmlPublicId }),
          ...(myPharmacies.length > 0 && selectedPharmacyId
            ? { pharmacyId: selectedPharmacyId }
            : {}),
        }),
      })

      if (!response.ok) throw new Error(isPatch ? 'Error al actualizar el gasto' : 'Error al guardar el gasto')

      toast.success(isPatch ? '¡Gasto actualizado con éxito!' : '¡Gasto rendido con éxito!', { id: 'expense-load' })
      router.push('/dashboard/gastos')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message, { id: 'expense-load' })
    } finally {
      setIsLoading(false)
    }
  }

  const statusInfo = expense ? STATUS_CONFIG[expense.status] : null

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

      {isEditMode && statusInfo && (
        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ring-1 ring-inset ${statusInfo.classes}`}>
            {statusInfo.label}
          </span>
        </div>
      )}

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
                    disabled={isEditMode}
                  />
                </div>
                {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
              </div>

              {showPharmacySelector && myPharmacies.length > 0 && (
                <div className="space-y-2">
                  <label className="label">Farmacia</label>
                  <select
                    value={selectedPharmacyId}
                    onChange={(e) => setSelectedPharmacyId(e.target.value)}
                    className="input"
                    required={isAdmin}
                    disabled={isEditMode || isLoadingPharmacies}
                  >
                    <option value="">Seleccionar farmacia...</option>
                    {myPharmacies.map(p => (
                      <option key={p.pharmacyId} value={p.pharmacyId}>
                        {p.pharmacyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="col-span-full space-y-2">
                <label className="label">Descripción / Motivo</label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="input resize-none"
                  placeholder="Ej: Pago de factura Edesur del mes de Mayo"
                  disabled={isEditMode && expense?.status !== ExpenseStatus.PENDIENTE_DE_FACTURAR}
                />
                {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="label">Fecha del Comprobante</label>
                <input
                  type="date"
                  value={watch('receiptDate')?.split('T')[0] ?? ''}
                  onChange={(e) => {
                    const date = new Date(e.target.value)
                    setValue('receiptDate', date.toISOString())
                  }}
                  className="input"
                  disabled={isEditMode}
                />
              </div>

              {isEditMode && (
                <div className="col-span-full space-y-2">
                  <label className="label">Notas (opcional)</label>
                  <textarea
                    {...register('notes' as any)}
                    rows={2}
                    className="input resize-none"
                    placeholder="Agregar notas para la transición de estado..."
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Comprobante (Foto/Ticket)</h3>
            <div className="relative aspect-video md:aspect-[3/4] rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden group hover:border-brand-300 transition-colors">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  onClick={() => window.open(previewUrl, '_blank')}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') window.open(previewUrl, '_blank') }}
                />
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
            {previewUrl && (
              <label className="mt-3 flex items-center justify-center gap-2 text-sm text-brand-600 hover:text-brand-700 cursor-pointer font-medium">
                <Camera size={16} />
                Cambiar Foto
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Archivo PDF (CFDI)</h3>
            {(pdfUrl || pdfFile) ? (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={20} className="text-blue-600 shrink-0" />
                  {pdfUrl ? (
                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-700 truncate hover:text-blue-900 hover:underline" title="Abrir PDF">
                      factura.pdf
                    </a>
                  ) : (
                    <span className="text-sm text-blue-700 truncate max-w-[150px]">
                      {pdfFile?.name}
                    </span>
                  )}
                </div>
                <button type="button" onClick={removePdf} className="p-1 hover:bg-blue-100 rounded shrink-0">
                  <X size={16} className="text-blue-600" />
                </button>
              </div>
            ) : (
              <div className="relative rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden group hover:border-brand-300 transition-colors">
                <label className="cursor-pointer flex flex-col items-center gap-2 p-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileUp size={20} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Subir PDF</span>
                  <span className="text-xs text-gray-400">Archivo .pdf</span>
                  <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={handlePdfChange} data-testid="pdf-upload" />
                </label>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Archivo XML (CFDI)</h3>
            {(xmlUrl || xmlFile) ? (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <FileDigit size={20} className="text-purple-600 shrink-0" />
                  {xmlUrl ? (
                    <a href={xmlUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-700 truncate hover:text-purple-900 hover:underline" title="Abrir XML">
                      factura.xml
                    </a>
                  ) : (
                    <span className="text-sm text-purple-700 truncate max-w-[150px]">
                      {xmlFile?.name}
                    </span>
                  )}
                </div>
                <button type="button" onClick={removeXml} className="p-1 hover:bg-purple-100 rounded shrink-0">
                  <X size={16} className="text-purple-600" />
                </button>
              </div>
            ) : (
              <div className="relative rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center overflow-hidden group hover:border-brand-300 transition-colors">
                <label className="cursor-pointer flex flex-col items-center gap-2 p-4 text-center">
                  <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <File size={20} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900">Subir XML</span>
                  <span className="text-xs text-gray-400">Archivo .xml</span>
                  <input type="file" accept=".xml,text/xml,application/xml" className="hidden" onChange={handleXmlChange} data-testid="xml-upload" />
                </label>
              </div>
            )}
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
                {isEditMode ? 'Actualizar Gasto' : 'Rendir Gasto'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
