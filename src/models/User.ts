import mongoose, { Schema, Document, Model } from 'mongoose'
import { IUser, UserRole } from '@/types'

// ---- INTERFACE MONGOOSE (extiende Document) ----
export interface IUserDocument extends Omit<IUser, '_id'>, Document {}

// ---- ESQUEMA ----
const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [100, 'El nombre no puede superar 100 caracteres'],
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true, // Permite null sin violar unique
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingrese un email válido',
      ],
    },
    username: {
      type: String,
      required: [true, 'El nombre de usuario es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'El username debe tener al menos 3 caracteres'],
      maxlength: [30, 'El username no puede superar 30 caracteres'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false, // No se devuelve en queries por defecto
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.SUPERVISOR,
      required: true,
    },
    // NOTE: pharmacyName y pharmacyCode fueron movidos a colección Pharmacy
    // Se mantienen como campos opcionales para backwards compatibility con datos existentes
    // La nueva vía de acceso es a través de la colección Pharmacy
    pharmacyName: {
      type: String,
      trim: true,
      default: undefined,
    },
    pharmacyCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: undefined,
    },
    phone: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
      trim: true,
    },
    profileImagePublicId: {
      type: String,
      trim: true,
    },
    assignedPharmacies: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true, // Auto-gestiona createdAt y updatedAt
    versionKey: false,
  }
)

// ---- ÍNDICES ----
// Nota: email y pharmacyCode ya tienen índices por unique: true
UserSchema.index({ role: 1 })
UserSchema.index({ isActive: 1 })

// ---- MODELO ----
// Patrón para evitar re-compilación del modelo en Next.js (hot reload)
const User: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>('User', UserSchema)

export default User
