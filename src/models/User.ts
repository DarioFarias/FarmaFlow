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
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingrese un email válido',
      ],
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
      default: UserRole.PHARMACY,
      required: true,
    },
    pharmacyName: {
      type: String,
      trim: true,
      // Requerido solo si el rol es PHARMACY
      required: function (this: IUserDocument) {
        return this.role === UserRole.PHARMACY
      },
    },
    pharmacyCode: {
      type: String,
      unique: true,
      sparse: true,   // Permite múltiples documentos con null
      uppercase: true,
      trim: true,
      match: [/^FAR-\d{3}$/, 'El código debe tener formato FAR-001'],
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
