import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
}

export interface IOrder extends Document {
  orderDate: Date;
  totalOrden: number;
  paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'qr' | 'otro';
  customerId?: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  items: IOrderItem[];
  userId?: mongoose.Types.ObjectId;
  receiptNumber?: string;
  status?: 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
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

const orderSchema = new Schema<IOrder>(
  {
    orderDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    totalOrden: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['efectivo', 'tarjeta', 'transferencia', 'qr', 'otro'],
      default: 'efectivo'
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
    items: [orderItemSchema],
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    receiptNumber: {
      type: String,
      sparse: true,
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'completed'
    }
  },
  {
    timestamps: true
  }
);

// Índices para reportes y búsquedas
orderSchema.index({ orderDate: -1, storeId: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ storeId: 1, orderDate: -1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
