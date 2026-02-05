import mongoose from 'mongoose';
import { AuditLog, AuditActionType } from '../models/AuditLog';

// Re-exportar AuditActionType para facilitar su uso
export { AuditActionType };

export interface AuditLogData {
  action: AuditActionType;
  entity: string;
  entityId: mongoose.Types.ObjectId;
  userId: string;
  storeId: mongoose.Types.ObjectId;
  changes: {
    before?: Record<string, any>;
    after: Record<string, any>;
  };
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status?: 'success' | 'failed';
  errorMessage?: string;
}

/**
 * Registra una acción en el log de auditoría
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await AuditLog.create({
      actionType: data.action,
      entityType: data.entity,
      entityId: data.entityId,
      userId: data.userId,
      description: `${data.entity} - ${data.action}`,
      storeId: data.storeId,
      changes: [{
        field: 'created',
        oldValue: null,
        newValue: data.changes.after
      }],
      newValues: data.changes.after,
      oldValues: data.changes.before || null,
      metadata: data.metadata,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // No lanzar error para no interrumpir la operación principal
  }
}

/**
 * Obtiene logs de auditoría con filtros
 */
export async function getAuditLogs(filters: {
  action?: AuditActionType;
  entity?: string;
  entityId?: mongoose.Types.ObjectId;
  userId?: string;
  storeId: mongoose.Types.ObjectId;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const { storeId, page = 1, limit = 50, ...otherFilters } = filters;
  const query: any = { storeId };

  if (otherFilters.action) query.action = otherFilters.action;
  if (otherFilters.entity) query.entity = otherFilters.entity;
  if (otherFilters.entityId) query.entityId = otherFilters.entityId;
  if (otherFilters.userId) query.userId = otherFilters.userId;

  if (otherFilters.startDate || otherFilters.endDate) {
    query.timestamp = {};
    if (otherFilters.startDate) query.timestamp.$gte = otherFilters.startDate;
    if (otherFilters.endDate) query.timestamp.$lte = otherFilters.endDate;
  }

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    AuditLog.countDocuments(query)
  ]);

  return {
    logs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Obtiene el historial de cambios de una entidad específica
 */
export async function getEntityHistory(
  entity: string,
  entityId: mongoose.Types.ObjectId,
  storeId: mongoose.Types.ObjectId
) {
  return AuditLog.find({ entity, entityId, storeId })
    .sort({ timestamp: -1 })
    .lean();
}

/**
 * Valida la integridad de una operación comparando con logs anteriores
 */
export async function validateAuditTrail(
  entityId: mongoose.Types.ObjectId,
  storeId: mongoose.Types.ObjectId
): Promise<{ isValid: boolean; issues: string[] }> {
  const logs = await AuditLog.find({ entityId, storeId })
    .sort({ timestamp: 1 })
    .lean();

  const issues: string[] = [];

  // Verificar que no hay gaps de tiempo sospechosos
  for (let i = 1; i < logs.length; i++) {
    const timeDiff = logs[i].timestamp.getTime() - logs[i - 1].timestamp.getTime();
    if (timeDiff > 86400000) {
      // 24 horas
      issues.push(`Gap de más de 24 horas entre logs ${i - 1} y ${i}`);
    }
  }

  // Verificar que todos los cambios son razonables
  for (const log of logs) {
    if (log.status === 'failed' && !log.errorMessage) {
      issues.push(`Log de fallo sin mensaje de error: ${log._id}`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}
