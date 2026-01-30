import mongoose, { Document, Schema } from 'mongoose';

export interface IQuotationItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IQuotation extends Document {
  quotationDate: Date;
  expirationDate?: Date;
  totalQuotation: number;
  customerId?: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  items: IQuotationItem[];
  userId?: mongoose.Types.ObjectId;
  discountId?: mongoose.Types.ObjectId;
  discountAmount?: number;
  paymentMethod?: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  notes?: string;
  status: 'pending' | 'converted' | 'expired' | 'cancelled';
  convertedOrderId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const quotationItemSchema = new Schema<IQuotationItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const quotationSchema = new Schema<IQuotation>(
  {
    quotationDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    expirationDate: {
      type: Date
    },
    totalQuotation: {
      type: Number,
      required: true,
      min: 0
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer'
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true
    },
    items: [quotationItemSchema],
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    discountId: {
      type: Schema.Types.ObjectId,
      ref: 'Discount'
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['efectivo', 'tarjeta', 'transferencia', 'otro']
    },
    notes: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'converted', 'expired', 'cancelled'],
      default: 'pending'
    },
    convertedOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order'
    }
  },
  {
    timestamps: true
  }
);

// Índices para reportes y búsquedas
quotationSchema.index({ quotationDate: -1, storeId: 1 });
quotationSchema.index({ status: 1, storeId: 1 });
quotationSchema.index({ customerId: 1, storeId: 1 });

export const Quotation = mongoose.model<IQuotation>('Quotation', quotationSchema);
export default Quotation;
