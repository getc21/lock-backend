import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description?: string;
  categoryId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId; // Tienda que creó el producto
  foto?: string;
  weight?: string;
  expiryDate?: Date;
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
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true // La tienda que creó el producto
    },
    foto: {
      type: String
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required']
    }
  },
  {
    timestamps: true
  }
);

// Index para búsquedas eficientes
productSchema.index({ name: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ storeId: 1 }); // Para filtrar por tienda

export const Product = mongoose.model<IProduct>('Product', productSchema);
