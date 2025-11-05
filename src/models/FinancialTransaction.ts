import mongoose, { Document, Schema } from 'mongoose';

export interface IFinancialTransaction extends Document {
  date: Date;
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  category?: string;
  storeId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const financialTransactionSchema = new Schema<IFinancialTransaction>(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense']
    },
    amount: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      trim: true
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
financialTransactionSchema.index({ date: -1, storeId: 1 });
financialTransactionSchema.index({ type: 1, storeId: 1 });

export const FinancialTransaction = mongoose.model<IFinancialTransaction>('FinancialTransaction', financialTransactionSchema);
