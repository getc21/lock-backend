import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description?: string;
  categoryId: mongoose.Types.ObjectId;
  supplierId: mongoose.Types.ObjectId;
  locationId: mongoose.Types.ObjectId;
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
    locationId: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: true
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
  }
);

// Index para búsquedas eficientes
productSchema.index({ name: 1, storeId: 1 });
productSchema.index({ categoryId: 1, storeId: 1 });
productSchema.index({ stock: 1 });

export const Product = mongoose.model<IProduct>('Product', productSchema);
