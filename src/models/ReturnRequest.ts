import mongoose, { Document, Schema } from 'mongoose';

export interface IReturnItem {
  productId: mongoose.Types.ObjectId;
  originalQuantity: number;
  returnQuantity: number;
  unitPrice: number;
  returnReason: string;
  notes?: string;
}

export enum ReturnStatus {
  PENDING = 'pending',           // Solicitada, esperando aprobación
  APPROVED = 'approved',         // Aprobada
  REJECTED = 'rejected',         // Rechazada
  COMPLETED = 'completed',       // Completada y procesada
  PARTIALLY_COMPLETED = 'partially_completed', // Completada parcialmente
  CANCELLED = 'cancelled'        // Cancelada
}

export enum ReturnType {
  RETURN = 'return',             // Devolución (reembolso)
  EXCHANGE = 'exchange',         // Cambio por otro producto
  PARTIAL_REFUND = 'partial_refund', // Reembolso parcial
  FULL_REFUND = 'full_refund'   // Reembolso total
}

export interface IReturnRequest extends Document {
  // Referencia a la orden original
  orderId: mongoose.Types.ObjectId;
  orderNumber?: string;
  
  // Tipo y estado
  type: ReturnType;
  status: ReturnStatus;
  
  // Items a devolver
  items: IReturnItem[];
  
  // Información financiera
  totalRefundAmount: number;      // Monto total a reembolsar
  refundMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'cuenta'; // Método de reembolso
  
  // Información del cliente
  customerId?: mongoose.Types.ObjectId;
  customerName?: string;
  customerContact?: string;
  
  // Información de la tienda
  storeId: mongoose.Types.ObjectId;
  
  // Razón de devolución (categorizada)
  returnReasonCategory: 'defective' | 'not_as_described' | 'customer_change_mind' | 'wrong_item' | 'damaged' | 'other';
  returnReasonDetails: string;
  
  // Auditoría
  requestedBy: mongoose.Types.ObjectId;      // Usuario que solicita
  requestedAt: Date;
  approvedBy?: mongoose.Types.ObjectId;      // Usuario que aprueba
  approvedAt?: Date;
  processedBy?: mongoose.Types.ObjectId;     // Usuario que procesa
  processedAt?: Date;
  
  // Documentación
  attachmentUrls?: string[];                  // URLs de fotos/evidencia
  
  // Cálculo de impacto
  impactOnInventory: {
    productId: mongoose.Types.ObjectId;
    quantityAdded: number;
    newStock: number;
  }[];
  
  // Seguimiento
  notes: string[];
  internalNotes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const returnItemSchema = new Schema<IReturnItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    originalQuantity: {
      type: Number,
      required: true,
      min: 1
    },
    returnQuantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    returnReason: {
      type: String,
      required: true
    },
    notes: String
  },
  { _id: true }
);

const impactOnInventorySchema = new Schema(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantityAdded: {
      type: Number,
      required: true
    },
    newStock: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const returnRequestSchema = new Schema<IReturnRequest>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true
    },
    orderNumber: String,
    
    type: {
      type: String,
      enum: Object.values(ReturnType),
      default: ReturnType.FULL_REFUND,
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: Object.values(ReturnStatus),
      default: ReturnStatus.PENDING,
      required: true,
      index: true
    },
    
    items: [returnItemSchema],
    
    totalRefundAmount: {
      type: Number,
      required: true,
      min: 0
    },
    refundMethod: {
      type: String,
      enum: ['efectivo', 'tarjeta', 'transferencia', 'cuenta'],
      default: 'efectivo',
      required: true
    },
    
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer',
      index: true
    },
    customerName: String,
    customerContact: String,
    
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true
    },
    
    returnReasonCategory: {
      type: String,
      enum: ['defective', 'not_as_described', 'customer_change_mind', 'wrong_item', 'damaged', 'other'],
      required: true
    },
    returnReasonDetails: {
      type: String,
      required: true
    },
    
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    requestedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    processedAt: Date,
    
    attachmentUrls: [String],
    
    impactOnInventory: [impactOnInventorySchema],
    
    notes: {
      type: [String],
      default: []
    },
    internalNotes: String
  },
  {
    timestamps: true
  }
);

// Índices para búsquedas rápidas
returnRequestSchema.index({ orderId: 1, storeId: 1 });
returnRequestSchema.index({ status: 1, storeId: 1, createdAt: -1 });
returnRequestSchema.index({ customerId: 1, storeId: 1 });
returnRequestSchema.index({ type: 1, storeId: 1 });
returnRequestSchema.index({ requestedAt: -1, storeId: 1 });
returnRequestSchema.index({ approvedAt: -1, storeId: 1 });
returnRequestSchema.index({ processedAt: -1, storeId: 1 });
returnRequestSchema.index({ refundMethod: 1, storeId: 1 });

export const ReturnRequest = mongoose.model<IReturnRequest>('ReturnRequest', returnRequestSchema);
