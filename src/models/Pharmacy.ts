import mongoose, { Schema, Document, Model } from 'mongoose'
import { IPharmacy } from '@/types'

// ---- INTERFACE MONGOOSE (extiende Document) ----
export interface IPharmacyDocument extends Omit<IPharmacy, '_id'>, Document {}

// ---- ESQUEMA ----
const PharmacySchema = new Schema<IPharmacyDocument>(
  {
    pharmacyName: {
      type: String,
      required: [true, 'El nombre de la farmacia es obligatorio'],
      trim: true,
      maxlength: 100,
    },
    address: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

// ---- ÍNDICES ----
PharmacySchema.index({ pharmacyName: 1 })
PharmacySchema.index({ isActive: 1 })

// ---- MODELO ----
const Pharmacy: Model<IPharmacyDocument> =
  mongoose.models.Pharmacy ?? mongoose.model<IPharmacyDocument>('Pharmacy', PharmacySchema)

export default Pharmacy