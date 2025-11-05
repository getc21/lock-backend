import mongoose, { Document, Schema } from 'mongoose';

export interface ICashRegister extends Document {
  date: Date;
  openingAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  difference?: number;
  status: 'open' | 'closed';
  openingTime?: Date;
  closingTime?: Date;
  userId?: string;
  storeId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const cashRegisterSchema = new Schema<ICashRegister>(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    openingAmount: {
      type: Number,
      required: true,
      min: 0
    },
    closingAmount: {
      type: Number,
      min: 0
    },
    expectedAmount: {
      type: Number,
      min: 0
    },
    difference: {
      type: Number
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      required: true,
      default: 'open'
    },
    openingTime: {
      type: Date
    },
    closingTime: {
      type: Date
    },
    userId: {
      type: String
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Índices
cashRegisterSchema.index({ date: -1, storeId: 1 });
cashRegisterSchema.index({ status: 1, storeId: 1 });

export const CashRegister = mongoose.model<ICashRegister>('CashRegister', cashRegisterSchema);
