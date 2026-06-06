import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  code?: string; // Código de barras o código único del producto
  sku?: string; // SKU del producto
  description?: string;
  categoryId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId; // Tienda que creó el producto
  foto?: string;
  weight?: string;
  expiryDate?: Date;
  isDeleted?: boolean;
  deletedAt?: Date;
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
    code: {
      type: String,
      trim: true,
      index: true, // Índice para búsquedas rápidas por código
      sparse: true // Permite múltiples null values
    },
    sku: {
      type: String,
      trim: true,
      index: true, // Índice para búsquedas rápidas por SKU
      sparse: true // Permite múltiples null values
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
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true // Index para búsquedas rápidas de no eliminados
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Índices para búsquedas eficientes
productSchema.index({ name: 1 });
productSchema.index({ code: 1 }); // Búsqueda rápida por código de barras
productSchema.index({ sku: 1 }); // Búsqueda rápida por SKU
productSchema.index({ categoryId: 1 });
productSchema.index({ storeId: 1 }); // Para filtrar por tienda

export const Product = mongoose.model<IProduct>('Product', productSchema);
