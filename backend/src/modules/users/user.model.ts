/**
 * @file user.model.ts
 * @module users
 * @description Modelo Mongoose para la entidad Usuario en SportReserve-UPTC.
 * Define el esquema, validaciones, hooks de pre-guardado y métodos de instancia
 * para la gestión de usuarios de la plataforma.
 */

import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../../interfaces';

/**
 * Esquema Mongoose para el modelo Usuario.
 *
 * Campos principales:
 * - `firstName` / `lastName`: Nombre y apellido del usuario (requeridos, máx. 50 chars).
 * - `email`: Correo único, normalizado a minúsculas y validado por regex.
 * - `password`: Contraseña hasheada; excluida de consultas por defecto (`select: false`).
 * - `phone`: Teléfono opcional (máx. 20 chars).
 * - `role`: Rol del usuario en el sistema — `'ADMIN'` o `'USER'` (por defecto `'USER'`).
 * - `status`: Estado de la cuenta — `'active'`, `'inactive'` o `'blocked'` (por defecto `'active'`).
 * - `avatar`: URL opcional del avatar del usuario.
 * - `resetPasswordToken` / `resetPasswordExpires`: Token y expiración para recuperación de contraseña;
 *   excluidos de consultas por defecto (`select: false`).
 *
 * Opciones:
 * - `timestamps: true` agrega automáticamente `createdAt` y `updatedAt`.
 */
const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone cannot exceed 20 characters'],
    },
    role: {
      type: String,
      enum: ['ADMIN', 'USER'],
      default: 'USER',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active',
    },
    avatar: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Hook pre-save: hashea la contraseña antes de persistir el documento.
 *
 * Solo se ejecuta cuando el campo `password` ha sido modificado,
 * evitando re-hasheos innecesarios en actualizaciones de otros campos.
 * Utiliza bcrypt con un salt de 12 rondas para mayor seguridad.
 *
 * @param {Function} next - Callback para continuar la cadena de middleware.
 */
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Método de instancia: compara una contraseña en texto plano con el hash almacenado.
 *
 * @param {string} candidatePassword - Contraseña ingresada por el usuario.
 * @returns {Promise<boolean>} `true` si la contraseña coincide, `false` en caso contrario.
 *
 * @example
 * const isMatch = await user.comparePassword('miContraseña123');
 * if (!isMatch) throw new Error('Credenciales inválidas');
 */
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Modelo Mongoose para la entidad Usuario.
 * Exportado como default para uso en servicios y otras capas de la aplicación.
 */
const User = mongoose.model<IUser>('User', userSchema);
export default User;