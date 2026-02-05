import mongoose, { Document, Schema } from 'mongoose';

export interface IReceipt extends Document {
  receiptNumber: string; // Número único del comprobante (ej: RCP-2026-001-0001)
  orderId: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  userId: string;
  amount: number;
  paymentMethod: string; // 'efectivo', 'qr', 'tarjeta'
  customerId?: mongoose.Types.ObjectId;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  status: 'issued' | 'cancelled' | 'refunded'; // Estado del comprobante
  issuedAt: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  qrCode?: string; // Código QR del comprobante
  createdAt: Date;
  updatedAt: Date;
}

const receiptSchema = new Schema<IReceipt>(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true
    },
    userId: {
      type: String,
      default: 'system'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentMethod: {
      type: String,
      enum: ['efectivo', 'qr', 'tarjeta'],
      required: true
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer'
    },
    items: [
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
        },
        subtotal: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],
    status: {
      type: String,
      enum: ['issued', 'cancelled', 'refunded'],
      default: 'issued'
    },
    issuedAt: {
      type: Date,
      default: Date.now
    },
    cancelledAt: Date,
    cancellationReason: String,
    qrCode: String
  },
  {
    timestamps: true
  }
);

// Índices para búsquedas y auditoría
receiptSchema.index({ receiptNumber: 1 });
receiptSchema.index({ orderId: 1 });
receiptSchema.index({ storeId: 1, issuedAt: -1 });
receiptSchema.index({ userId: 1, storeId: 1 });
receiptSchema.index({ customerId: 1 });
receiptSchema.index({ status: 1, storeId: 1 });

// Validación: asegurar que el número de comprobante sea único por tienda
receiptSchema.pre('save', async function (next) {
  if (this.isNew) {
    const existingReceipt = await Receipt.findOne({
      receiptNumber: this.receiptNumber,
      storeId: this.storeId
    });

    if (existingReceipt) {
      throw new Error('Receipt number already exists for this store');
    }
  }
  next();
});

export const Receipt = mongoose.model<IReceipt>('Receipt', receiptSchema);
