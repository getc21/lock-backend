import mongoose, { Document, Schema } from 'mongoose';

export interface IExpenseCategory extends Document {
  name: string;
  description?: string;
  icon?: string;
  storeId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const expenseCategorySchema = new Schema<IExpenseCategory>(
  {
    name: {
      type: String,
      required: [true, 'Expense category name is required'],
      trim: true,
      unique: true,
      sparse: true
    },
    description: {
      type: String,
      trim: true
    },
    icon: {
      type: String,
      trim: true
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Índices
expenseCategorySchema.index({ storeId: 1 });
expenseCategorySchema.index({ name: 1, storeId: 1 });
expenseCategorySchema.index({ isActive: 1 });

export const ExpenseCategory = mongoose.model<IExpenseCategory>(
  'ExpenseCategory',
  expenseCategorySchema
);
