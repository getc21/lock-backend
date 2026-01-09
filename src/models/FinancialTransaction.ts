import mongoose, { Document, Schema } from 'mongoose';

export interface IFinancialTransaction extends Document {
  date: Date;
  type: 'income' | 'expense';
  amount: number;
  description?: string;
  categoryId?: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const financialTransactionSchema = new Schema<IFinancialTransaction>(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    },
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense'],
      index: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      trim: true
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'ExpenseCategory'
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Índices
financialTransactionSchema.index({ date: -1, storeId: 1 });
financialTransactionSchema.index({ type: 1, storeId: 1 });
financialTransactionSchema.index({ categoryId: 1, storeId: 1 });
financialTransactionSchema.index({ date: 1, type: 1, storeId: 1 });

export const FinancialTransaction = mongoose.model<IFinancialTransaction>('FinancialTransaction', financialTransactionSchema);
