import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description?: string;
  purchasePrice: number;
  salePrice: number;
  weight?: string;
  categoryId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
  foto?: string;
  stock: number;
  expiryDate?: Date;
  storeId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: 0
    },
    salePrice: {
      type: Number,
      required: [true, 'Sale price is required'],
      min: 0
    },
    weight: {
      type: String,
      trim: true
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    supplierId: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true
    },
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: true
    },
    foto: {
      type: String
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required']
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

// Index para búsquedas eficientes
productSchema.index({ name: 1, storeId: 1 });
productSchema.index({ categoryId: 1, storeId: 1 });
productSchema.index({ stock: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
