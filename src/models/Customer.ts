import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  lastPurchase?: Date;
  totalSpent: number;
  totalOrders: number;
  loyaltyPoints: number;
  storeId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const customerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    },
    lastPurchase: {
      type: Date
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: 0
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
      min: 0
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store ID is required']
    }
  },
  {
    timestamps: true
  }
);

// Index para búsquedas
customerSchema.index({ phone: 1 });
customerSchema.index({ name: 1 });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
