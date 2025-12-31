import mongoose, { Document, Schema } from 'mongoose';

export interface IProductStore extends Document {
  productId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  stock: number;
  salePrice: number;
  purchasePrice: number;
  createdAt: Date;
  updatedAt: Date;
}

const productStoreSchema = new Schema<IProductStore>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    salePrice: {
      type: Number,
      required: true,
      min: 0
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Crear índice único: un producto solo puede tener una entrada por tienda
productStoreSchema.index({ productId: 1, storeId: 1 }, { unique: true });

export const ProductStore = mongoose.model<IProductStore>('ProductStore', productStoreSchema);
