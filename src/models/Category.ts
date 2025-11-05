import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  foto?: string;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    foto: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

export const Category = mongoose.model<ICategory>('Category', categorySchema);
