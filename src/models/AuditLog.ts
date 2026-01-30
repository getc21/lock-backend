import mongoose, { Document, Schema } from 'mongoose';

export enum AuditActionType {
  // Transacciones financieras
  ORDER_CREATED = 'order_created',
  ORDER_CANCELLED = 'order_cancelled',
  REFUND_PROCESSED = 'refund_processed',
  PARTIAL_REFUND = 'partial_refund',
  EXCHANGE_PROCESSED = 'exchange_processed',
  
  // Devoluciones
  RETURN_REQUESTED = 'return_requested',
  RETURN_APPROVED = 'return_approved',
  RETURN_REJECTED = 'return_rejected',
  RETURN_COMPLETED = 'return_completed',
  
  // Caja
  CASH_OPENING = 'cash_opening',
  CASH_CLOSING = 'cash_closing',
  CASH_ADJUSTMENT = 'cash_adjustment',
  CASH_DEPOSIT = 'cash_deposit',
  CASH_WITHDRAWAL = 'cash_withdrawal',
  
  // Inventario
  INVENTORY_ADJUSTED = 'inventory_adjusted',
  INVENTORY_RESTORED = 'inventory_restored',
  
  // Acceso y autenticación
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  USER_CREATED = 'user_created',
  USER_MODIFIED = 'user_modified',
  
  // Cambios en datos maestros
  PRODUCT_MODIFIED = 'product_modified',
  PRICE_CHANGED = 'price_changed',
  CUSTOMER_MODIFIED = 'customer_modified',
  
  // Reportes
  REPORT_GENERATED = 'report_generated',
  EXPORT_PERFORMED = 'export_performed',
  
  // Discrepancias
  DISCREPANCY_DETECTED = 'discrepancy_detected',
  DISCREPANCY_RESOLVED = 'discrepancy_resolved',
  
  OTHER = 'other'
}

export interface IAuditLogChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface IAuditLog extends Document {
  // Información del evento
  actionType: AuditActionType;
  description: string;
  
  // Entidad afectada
  entityType: string;                         // 'Order', 'ReturnRequest', 'CashRegister', etc.
  entityId: mongoose.Types.ObjectId;          // ID de la entidad afectada
  
  // Usuario responsable
  userId: mongoose.Types.ObjectId;
  userName: string;
  userRole: string;
  
  // Información de la tienda
  storeId: mongoose.Types.ObjectId;
  storeName: string;
  
  // Cambios realizados
  changes?: IAuditLogChange[];                // Cambios en campos específicos
  oldValues?: any;                            // Snapshot anterior (para auditoría)
  newValues?: any;                            // Snapshot nuevo (para auditoría)
  
  // Impacto financiero
  financialImpact?: {
    amount: number;
    currency: string;
    type: 'debit' | 'credit';
    reason: string;
  };
  
  // Referencias cruzadas
  relatedEntities?: {
    type: string;
    id: mongoose.Types.ObjectId;
  }[];
  
  // Metadatos
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  
  // Estado
  status: 'success' | 'pending' | 'failed' | 'reversed';
  errorMessage?: string;
  
  // Reversión
  reversedBy?: mongoose.Types.ObjectId;
  reversalReason?: string;
  reversalId?: mongoose.Types.ObjectId;
  
  timestamp: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const auditLogChangeSchema = new Schema<IAuditLogChange>(
  {
    field: {
      type: String,
      required: true
    },
    oldValue: Schema.Types.Mixed,
    newValue: Schema.Types.Mixed
  },
  { _id: false }
);

const financialImpactSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    },
    type: {
      type: String,
      enum: ['debit', 'credit'],
      required: true
    },
    reason: String
  },
  { _id: false }
);

const relatedEntitySchema = new Schema(
  {
    type: {
      type: String,
      required: true
    },
    id: {
      type: Schema.Types.ObjectId,
      required: true
    }
  },
  { _id: false }
);

const auditLogSchema = new Schema<IAuditLog>(
  {
    actionType: {
      type: String,
      enum: Object.values(AuditActionType),
      required: true,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    
    entityType: {
      type: String,
      required: true,
      index: true
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },
    
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    userName: String,
    userRole: String,
    
    storeId: {
      type: Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true
    },
    storeName: String,
    
    changes: [auditLogChangeSchema],
    oldValues: Schema.Types.Mixed,
    newValues: Schema.Types.Mixed,
    
    financialImpact: financialImpactSchema,
    
    relatedEntities: [relatedEntitySchema],
    
    ipAddress: String,
    userAgent: String,
    sessionId: String,
    
    status: {
      type: String,
      enum: ['success', 'pending', 'failed', 'reversed'],
      default: 'success'
    },
    errorMessage: String,
    
    reversedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    reversalReason: String,
    reversalId: {
      type: Schema.Types.ObjectId,
      ref: 'AuditLog'
    },
    
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Índices para búsquedas complejas
auditLogSchema.index({ actionType: 1, storeId: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, storeId: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, storeId: 1 });
auditLogSchema.index({ status: 1, storeId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1, storeId: 1 });
auditLogSchema.index({ 'financialImpact.amount': 1, storeId: 1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
