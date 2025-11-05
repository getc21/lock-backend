import mongoose, { Document, Schema } from 'mongoose';

export interface IStore extends Document {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const storeSchema = new Schema<IStore>(
  {
    name: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

export const Store = mongoose.model<IStore>('Store', storeSchema);
