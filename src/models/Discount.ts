import mongoose, { Document, Schema } from 'mongoose';

export interface IDiscount extends Document {
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumAmount?: number;
  maximumDiscount?: number;
  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  storeId: Schema.Types.ObjectId; // ⭐ AGREGADO: Referencia a la tienda
  createdAt: Date;
  updatedAt: Date;
}

const discountSchema = new Schema<IDiscount>(
  {
    name: {
      type: String,
      required: [true, 'Discount name is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: ['percentage', 'fixed']
    },
    value: {
      type: Number,
      required: [true, 'Value is required'],
      min: 0
    },
    minimumAmount: {
      type: Number,
      min: 0
    },
    maximumDiscount: {
      type: Number,
      min: 0
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: false // ⭐ TEMPORAL: Hacer opcional para no romper descuentos existentes
    }
  },
  {
    timestamps: true
  }
);

export const Discount = mongoose.model<IDiscount>('Discount', discountSchema);
