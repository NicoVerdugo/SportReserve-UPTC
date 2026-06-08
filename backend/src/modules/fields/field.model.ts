/**
 * @file field.model.ts
 * @module fields
 * @description Modelo Mongoose para la entidad Cancha Deportiva (SportField) en SportReserve-UPTC.
 * Define el esquema principal de canchas y el sub-esquema de horarios por día,
 * incluyendo validaciones, índices de búsqueda y configuración de timestamps.
 */

import mongoose, { Schema } from 'mongoose';
import { ISportField } from '../../interfaces';

/**
 * Sub-esquema para un slot de horario semanal de una cancha.
 *
 * Representa la disponibilidad de la cancha para un día específico de la semana.
 * No genera `_id` propio ya que es un subdocumento embebido.
 *
 * @property {number} dayOfWeek  - Día de la semana (0 = domingo, 6 = sábado).
 * @property {string} openTime   - Hora de apertura en formato HH:mm (24h).
 * @property {string} closeTime  - Hora de cierre en formato HH:mm (24h).
 */
const scheduleSlotSchema = new Schema(
  {
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    openTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Open time must be in HH:mm format'],
    },
    closeTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Close time must be in HH:mm format'],
    },
  },
  { _id: false }
);

/**
 * Esquema Mongoose para el modelo Cancha Deportiva.
 *
 * Campos principales:
 * - `name`: Nombre de la cancha (requerido, máx. 100 chars).
 * - `sportType`: Deporte asociado — `'football'`, `'basketball'`, `'volleyball'`, `'tennis'` o `'multiple'`.
 * - `location`: Ubicación física de la cancha (requerida, máx. 200 chars).
 * - `description`: Descripción opcional (máx. 1000 chars).
 * - `images`: Array de URLs de imágenes (por defecto vacío).
 * - `capacity`: Capacidad máxima de personas (mínimo 1).
 * - `pricePerHour`: Precio por hora de uso en pesos (no negativo).
 * - `schedule`: Array de {@link scheduleSlotSchema} con los horarios por día de la semana.
 * - `status`: Estado operativo — `'active'`, `'inactive'` o `'maintenance'` (por defecto `'active'`).
 *
 * Índices:
 * - `sportType` y `status`: índices simples para filtrado eficiente.
 * - `name` + `location`: índice de texto completo para búsqueda con `$text`.
 *
 * Opciones:
 * - `timestamps: true` agrega automáticamente `createdAt` y `updatedAt`.
 */
const fieldSchema = new Schema<ISportField>(
  {
    name: {
      type: String,
      required: [true, 'Field name is required'],
      trim: true,
      maxlength: [100, 'Field name cannot exceed 100 characters'],
    },
    sportType: {
      type: String,
      required: [true, 'Sport type is required'],
      enum: {
        values: ['football', 'basketball', 'volleyball', 'tennis', 'multiple'],
        message: 'Sport type must be one of: football, basketball, volleyball, tennis, multiple',
      },
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [200, 'Location cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    images: {
      type: [String],
      default: [],
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    pricePerHour: {
      type: Number,
      required: [true, 'Price per hour is required'],
      min: [0, 'Price per hour cannot be negative'],
    },
    schedule: {
      type: [scheduleSlotSchema],
      default: [],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive', 'maintenance'],
        message: 'Status must be one of: active, inactive, maintenance',
      },
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimizar consultas frecuentes por tipo de deporte y estado
fieldSchema.index({ sportType: 1 });
fieldSchema.index({ status: 1 });

// Índice de texto completo para búsqueda por nombre y ubicación con $text
fieldSchema.index({ name: 'text', location: 'text' });

/**
 * Modelo Mongoose para la entidad Cancha Deportiva.
 * Exportado como default para uso en servicios y otras capas de la aplicación.
 */
const SportField = mongoose.model<ISportField>('SportField', fieldSchema);
export default SportField;