import { Request, Response, NextFunction } from 'express';
import { getAuditLogs, getEntityHistory, validateAuditTrail } from '../utils/auditService';
import { getReceiptStatistics } from '../utils/receiptService';
import { Receipt } from '../models/Receipt';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

/**
 * Obtiene logs de auditoría con filtros
 */
export const getAuditTrail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, action, entity, entityId, userId, startDate, endDate, page = 1, limit = 50 } = req.query;

    if (!storeId) {
      return next(new AppError('storeId is required', 400));
    }

    const logs = await getAuditLogs({
      storeId: new mongoose.Types.ObjectId(storeId as string),
      action: action as any,
      entity: entity as string,
      entityId: entityId ? new mongoose.Types.ObjectId(entityId as string) : undefined,
      userId: userId as string,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: parseInt(page as string),
      limit: Math.min(parseInt(limit as string) || 50, 100)
    });

    res.json({
      status: 'success',
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene el historial de cambios de una entidad específica
 */
export const getEntityAuditHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entity, entityId, storeId } = req.params;

    if (!entity || !entityId || !storeId) {
      return next(new AppError('entity, entityId, and storeId are required', 400));
    }

    const history = await getEntityHistory(
      entity,
      new mongoose.Types.ObjectId(entityId),
      new mongoose.Types.ObjectId(storeId)
    );

    res.json({
      status: 'success',
      data: {
        entity,
        entityId,
        history
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Valida la integridad de auditoría para una entidad
 */
export const validateAuditIntegrity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { entityId, storeId } = req.params;

    if (!entityId || !storeId) {
      return next(new AppError('entityId and storeId are required', 400));
    }

    const validation = await validateAuditTrail(
      new mongoose.Types.ObjectId(entityId),
      new mongoose.Types.ObjectId(storeId)
    );

    res.json({
      status: 'success',
      data: validation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene estadísticas de comprobantes
 */
export const getReceiptStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, startDate, endDate } = req.query;

    if (!storeId) {
      return next(new AppError('storeId is required', 400));
    }

    const stats = await getReceiptStatistics(
      storeId as string,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    console.log('📊 getReceiptStats - storeId:', storeId);
    console.log('📊 getReceiptStats - stats:', JSON.stringify(stats, null, 2));

    res.json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene un comprobante específico
 */
export const getReceipt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { receiptNumber, storeId } = req.params;

    if (!receiptNumber || !storeId) {
      return next(new AppError('receiptNumber and storeId are required', 400));
    }

    const receipt = await Receipt.findOne({
      receiptNumber,
      storeId: new mongoose.Types.ObjectId(storeId)
    })
      .populate('customerId', 'name email phone')
      .populate('orderId')
      .populate('items.productId', 'name');

    if (!receipt) {
      return next(new AppError('Receipt not found', 404));
    }

    res.json({
      status: 'success',
      data: { receipt }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Obtiene comprobantes por rango de fechas
 */
export const getReceiptsByDateRange = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, startDate, endDate, page = 1, limit = 50 } = req.query;

    if (!storeId) {
      return next(new AppError('storeId is required', 400));
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
    const skip = (pageNum - 1) * limitNum;

    // Primero, buscar SIN filtro de fecha para ver si hay Receipts
    let filter: any = { storeId: new mongoose.Types.ObjectId(storeId as string) };
    
    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .populate('customerId', 'name email')
        .populate('items.productId', 'name')
        .sort({ issuedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Receipt.countDocuments(filter)
    ]);

    console.log('📋 getReceiptsByDateRange - storeId:', storeId);
    console.log('📋 getReceiptsByDateRange - startDate:', startDate, 'endDate:', endDate);
    console.log('📋 getReceiptsByDateRange - found:', receipts.length, 'total:', total);
    if (receipts.length > 0) {
      console.log('📋 First receipt issuedAt:', receipts[0].issuedAt);
      console.log('📋 First receipt createdAt:', receipts[0].createdAt);
    }

    res.json({
      status: 'success',
      results: receipts.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      data: { receipts }
    });
  } catch (error) {
    next(error);
  }
};
