import mongoose, { Schema } from 'mongoose';
import { ISportField } from '../../interfaces';

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

fieldSchema.index({ sportType: 1 });
fieldSchema.index({ status: 1 });
fieldSchema.index({ name: 'text', location: 'text' });

const SportField = mongoose.model<ISportField>('SportField', fieldSchema);
export default SportField;
