import mongoose, { Document, Schema } from 'mongoose';

export interface ICashMovement extends Document {
  date: Date;
  type: 'income' | 'expense' | 'sale' | 'opening' | 'closing' | 'adjustment';
  amount: number;
  description?: string;
  orderId?: mongoose.Types.ObjectId;
  userId?: string;
  storeId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const cashMovementSchema = new Schema<ICashMovement>(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense', 'sale', 'opening', 'closing', 'adjustment']
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
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

// Índices para reportes
cashMovementSchema.index({ date: -1, storeId: 1 });
cashMovementSchema.index({ type: 1, storeId: 1 });

export const CashMovement = mongoose.model<ICashMovement>('CashMovement', cashMovementSchema);
