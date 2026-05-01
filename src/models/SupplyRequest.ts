import mongoose, { Schema, Document, Model } from 'mongoose'
import {
  ISupplyRequest,
  ISupplyItem,
  IStatusHistoryEvent,
  SupplyRequestStatus,
  SupplyCategory,
} from '@/types'

// ---- INTERFACES MONGOOSE ----
export interface ISupplyRequestDocument
  extends Omit<ISupplyRequest, '_id'>,
    Document {}

// ---- SUB-ESQUEMAS ----

const SupplyItemSchema = new Schema<ISupplyItem>(
  {
    name: {
      type: String,
      required: [true, 'El nombre del insumo es obligatorio'],
      trim: true,
      maxlength: [200, 'El nombre no puede superar 200 caracteres'],
    },
    category: {
      type: String,
      enum: Object.values(SupplyCategory),
      required: [true, 'La categoría es obligatoria'],
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [1, 'La cantidad debe ser al menos 1'],
    },
    unit: {
      type: String,
      required: [true, 'La unidad es obligatoria'],
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Las notas no pueden superar 500 caracteres'],
    },
  },
  { _id: false } // No generar _id para subdocumentos
)

const StatusHistorySchema = new Schema<IStatusHistoryEvent>(
  {
    status: {
      type: String,
      enum: Object.values(SupplyRequestStatus),
      required: true,
    },
    changedBy: {
      type: String,
      required: true,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
)

// ---- ESQUEMA PRINCIPAL ----
const SupplyRequestSchema = new Schema<ISupplyRequestDocument>(
  {
    requestNumber: {
      type: String,
      unique: true,
      // Se auto-genera en el pre-save hook
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
    items: {
      type: [SupplyItemSchema],
      required: [true, 'El pedido debe incluir al menos un ítem'],
      validate: {
        validator: (items: ISupplyItem[]) => items.length > 0,
        message: 'El pedido debe contener al menos un insumo',
      },
    },
    status: {
      type: String,
      enum: Object.values(SupplyRequestStatus),
      default: SupplyRequestStatus.REQUESTED,
      required: true,
    },
    statusHistory: {
      type: [StatusHistorySchema],
      default: [],
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
      default: 'NORMAL',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Las notas no pueden superar 1000 caracteres'],
    },
    adminNotes: {
      type: String,
      trim: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    shippingDate: {
      type: Date,
    },
    expectedDelivery: {
      type: Date,
    },
    receivedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

// ---- HOOK: Auto-generar requestNumber ----
SupplyRequestSchema.pre('save', async function (this: ISupplyRequestDocument, next) {
  if (!this.isNew) return next()

  const count = await mongoose.model('SupplyRequest').countDocuments()
  const year = new Date().getFullYear()
  // @ts-ignore
  this.requestNumber = `REQ-${year}-${String(count + 1).padStart(4, '0')}`
  next()
})

// ---- ÍNDICES ----
SupplyRequestSchema.index({ pharmacy: 1, createdAt: -1 })
SupplyRequestSchema.index({ pharmacy: 1, status: 1 }) // Índice compuesto para métricas
SupplyRequestSchema.index({ status: 1 })
SupplyRequestSchema.index({ requestNumber: 1 })
SupplyRequestSchema.index({ priority: 1 })

// ---- MODELO ----
const SupplyRequest: Model<ISupplyRequestDocument> =
  mongoose.models.SupplyRequest ??
  mongoose.model<ISupplyRequestDocument>('SupplyRequest', SupplyRequestSchema)

export default SupplyRequest
