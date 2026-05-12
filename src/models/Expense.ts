import mongoose, { Schema, Document, Model } from 'mongoose'
import { IExpense, ExpenseStatus } from '@/types'

// ---- INTERFACE MONGOOSE ----
export interface IExpenseDocument extends Omit<IExpense, '_id'>, Omit<Document, 'isModified'> {
  isModified?: boolean
}

// ---- ESQUEMA ----
const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    expenseNumber: {
      type: String,
      unique: true,
      // Auto-generado en pre-save hook
    },
    pharmacy: {
      type: Schema.Types.ObjectId as any,
      ref: 'Pharmacy',
      required: [true, 'La referencia a la farmacia es obligatoria'],
    },
    pharmacyName: {
      type: String,
      required: [true, 'El nombre de la farmacia es obligatorio'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'El monto es obligatorio'],
      min: [0.01, 'El monto debe ser mayor a 0'],
    },
    currency: {
      type: String,
      default: 'MXN',
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
      maxlength: [500, 'La descripción no puede superar 500 caracteres'],
    },
    receiptDate: {
      type: Date,
      required: [true, 'La fecha de la factura es obligatoria'],
    },
    invoiceImageUrl: {
      type: String,
      trim: true,
    },
    invoicePublicId: {
      type: String,
      trim: true,
    },
    // ---- CFDI/PDF Fields (Phase 2) ----
    pdfUrl: {
      type: String,
      trim: true,
    },
    pdfPublicId: {
      type: String,
      trim: true,
    },
    xmlUrl: {
      type: String,
      trim: true,
    },
    xmlPublicId: {
      type: String,
      trim: true,
    },
    // ---- Tracking & Modification ----
    isModified: {
      type: Boolean,
      default: false,
    },
    period: {
      type: String,
      trim: true,
      // Formato: 'YYYY-MM'
    },
    // ---- Status V2 ----
    status: {
      type: String,
      enum: Object.values(ExpenseStatus),
      default: ExpenseStatus.PENDIENTE_DE_FACTURAR,
      required: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    adminComment: {
      type: String,
      trim: true,
      maxlength: [1000, 'El comentario no puede superar 1000 caracteres'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

// ---- HOOK: Auto-generar expenseNumber ----
ExpenseSchema.pre('save', async function (this: IExpenseDocument, next) {
  if (!this.isNew) return next()

  const count = await mongoose.model('Expense').countDocuments()
  const year = new Date().getFullYear()
  // @ts-ignore - Propiedad existe en el esquema y en la interfaz (Omit<IExpense, '_id'>)
  this.expenseNumber = `EXP-${year}-${String(count + 1).padStart(4, '0')}`
  next()
})

// ---- ÍNDICES ----
ExpenseSchema.index({ pharmacy: 1, createdAt: -1 })
ExpenseSchema.index({ pharmacy: 1, status: 1 }) // Índice compuesto para métricas
ExpenseSchema.index({ status: 1 })
ExpenseSchema.index({ expenseNumber: 1 })
ExpenseSchema.index({ receiptDate: -1 })
// ---- Nuevos índices para Phase 2 ----
ExpenseSchema.index({ period: 1 })
ExpenseSchema.index({ pdfPublicId: 1 })
ExpenseSchema.index({ xmlPublicId: 1 })
ExpenseSchema.index({ isModified: 1 })
// Compound index for common query pattern {pharmacy, status, createdAt}
ExpenseSchema.index({ pharmacy: 1, status: 1, createdAt: -1 })

// ---- MODELO ----
const Expense: Model<IExpenseDocument> =
  mongoose.models.Expense ??
  mongoose.model<IExpenseDocument>('Expense', ExpenseSchema)

export default Expense
