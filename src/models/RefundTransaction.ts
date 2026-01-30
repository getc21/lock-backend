import mongoose, { Document, Schema } from 'mongoose';

export enum RefundStatus {
  PENDING = 'pending',           // Pendiente de procesar
  PROCESSED = 'processed',       // Procesada
  CANCELLED = 'cancelled',       // Cancelada
  FAILED = 'failed'              // Falló
}

export interface IRefundTransaction extends Document {
  // Referencia
  returnRequestId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  
  // Detalles del reembolso
  amount: number;                // Monto a reembolsar
  currency: string;              // Moneda
  type: 'full' | 'partial';      // Tipo de reembolso
  
  // Método de reembolso
  refundMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'cuenta';
  
  // Detalles según método
  methodDetails?: {
    // Para tarjeta
    last4Digits?: string;
    cardNetwork?: string;
    
    // Para transferencia
    bankName?: string;
    accountNumber?: string;
    
    // Para cuenta interna
    accountId?: mongoose.Types.ObjectId;
  };
  
  // Cliente
  customerId?: mongoose.Types.ObjectId;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  
  // Tienda
  storeId: mongoose.Types.ObjectId;
  
  // Estado
  status: RefundStatus;
  processedAt?: Date;
  
  // Auditoría
  initiatedBy: mongoose.Types.ObjectId;
  initiatedAt: Date;
  processedBy?: mongoose.Types.ObjectId;
  
  // Confirmación externa (si aplica)
  externalReferenceId?: string;  // ID de transacción externa (tarjeta, banco)
  externalConfirmation?: {
    source: 'stripe' | 'paypal' | 'mercadopago' | 'bank' | 'other';
    confirmationCode: string;
    confirmationDate: Date;
  };
  
  // Documentación
  proofOfRefund?: string;         // URL a comprobante
  notes?: string;
  
  // Reversión (si se necesita reversar un reembolso)
  reversedBy?: mongoose.Types.ObjectId;
  reversedAt?: Date;
  reversalReason?: string;
  reversalRefundTransactionId?: mongoose.Types.ObjectId; // ID del nuevo reembolso (si se procesa de nuevo)
  
  createdAt: Date;
  updatedAt: Date;
}

const methodDetailsSchema = new Schema(
  {
    last4Digits: String,
    cardNetwork: String,
    bankName: String,
    accountNumber: String,
    accountId: {
      type: Schema.Types.ObjectId,
      ref: 'Account'
    }
  },
  { _id: false }
);

const externalConfirmationSchema = new Schema(
  {
    source: {
      type: String,
      enum: ['stripe', 'paypal', 'mercadopago', 'bank', 'other']
    },
    confirmationCode: String,
    confirmationDate: Date
  },
  { _id: false }
);

const refundTransactionSchema = new Schema<IRefundTransaction>(
  {
    returnRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'ReturnRequest',
      required: true,
      index: true
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'USD',
      required: true
    },
    type: {
      type: String,
      enum: ['full', 'partial'],
      default: 'full',
      required: true
    },
    
    refundMethod: {
      type: String,
      enum: ['efectivo', 'tarjeta', 'transferencia', 'cuenta'],
      default: 'efectivo',
      required: true,
      index: true
    },
    
    methodDetails: methodDetailsSchema,
    
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      index: true
    },
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true
    },
    
    status: {
      type: String,
      enum: Object.values(RefundStatus),
      default: RefundStatus.PENDING,
      required: true,
      index: true
    },
    processedAt: Date,
    
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    initiatedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    
    externalReferenceId: {
      type: String,
      sparse: true,
      index: true
    },
    externalConfirmation: externalConfirmationSchema,
    
    proofOfRefund: String,
    notes: String,
    
    reversedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reversedAt: Date,
    reversalReason: String,
    reversalRefundTransactionId: {
      type: Schema.Types.ObjectId,
      ref: 'RefundTransaction'
    }
  },
  {
    timestamps: true
  }
);

// Índices para auditoría y reportes
refundTransactionSchema.index({ status: 1, storeId: 1, initiatedAt: -1 });
refundTransactionSchema.index({ refundMethod: 1, storeId: 1, initiatedAt: -1 });
refundTransactionSchema.index({ customerId: 1, storeId: 1 });
refundTransactionSchema.index({ initiatedAt: -1, storeId: 1 });
refundTransactionSchema.index({ amount: 1, storeId: 1 });

export const RefundTransaction = mongoose.model<IRefundTransaction>('RefundTransaction', refundTransactionSchema);
