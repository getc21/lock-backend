import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplier extends Document {
  foto?: string;
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    foto: {
      type: String
    },
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true
    },
    contactName: {
      type: String,
      trim: true
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true
    },
    contactPhone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const Supplier = mongoose.model<ISupplier>('Supplier', supplierSchema);
