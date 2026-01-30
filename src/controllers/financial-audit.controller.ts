import { Request, Response } from 'express';
import { AuditLog, AuditActionType } from '../models/AuditLog';
import { RefundTransaction, RefundStatus } from '../models/RefundTransaction';
import { FinancialTransaction } from '../models/FinancialTransaction';
import { CashMovement } from '../models/CashMovement';
import { ReturnRequest } from '../models/ReturnRequest';
import mongoose from 'mongoose';

/**
 * Controlador de Auditoría Financiera Profesional
 * Proporciona reportes contables, trazabilidad y análisis financiero
 */
class FinancialAuditController {
  
  /**
   * REPORTE DE RECONCILIACIÓN CONTABLE
   * Compara transacciones registradas vs movimientos reales
   */
  async getFinancialReconciliation(req: Request, res: Response): Promise<void> {
    try {
      const { storeId, startDate, endDate } = req.query;
      
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      
      // 1. Obtener movimientos de caja
      const cashMovements = await CashMovement.find({
        storeId,
        date: dateFilter
      });
      
      // 2. Obtener transacciones financieras
      const financialTransactions = await FinancialTransaction.find({
        storeId,
        date: dateFilter
      });
      
      // 3. Obtener reembolsos procesados
      const refunds = await RefundTransaction.find({
        storeId,
        initiatedAt: dateFilter,
        status: RefundStatus.PROCESSED
      });
      
      // 4. Obtener devoluciones completadas
      const returns = await ReturnRequest.find({
        storeId,
        processedAt: { 
          $gte: dateFilter.$gte || new Date(0),
          $lte: dateFilter.$lte || new Date()
        }
      });
      
      // 5. Calcular totales
      const cashTotals = {
        income: cashMovements
          .filter(m => ['income', 'sale'].includes(m.type))
          .reduce((sum, m) => sum + m.amount, 0),
        expenses: cashMovements
          .filter(m => ['expense', 'refund'].includes(m.type))
          .reduce((sum, m) => sum + m.amount, 0),
        total: 0
      };
      
      cashTotals.total = cashTotals.income - cashTotals.expenses;
      
      const financialTotals = {
        income: financialTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        expenses: financialTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0),
        total: 0
      };
      
      financialTotals.total = financialTotals.income - financialTotals.expenses;
      
      // 6. Validar discrepancias
      const reconciliation = {
        period: { start: startDate, end: endDate },
        cashSummary: cashTotals,
        financialSummary: financialTotals,
        refundsSummary: {
          totalProcessed: refunds.reduce((sum, r) => sum + r.amount, 0),
          countProcessed: refunds.length
        },
        returnsSummary: {
          totalAmount: returns.reduce((sum, r) => sum + r.totalRefundAmount, 0),
          countCompleted: returns.length
        },
        discrepancies: {
          detected: Math.abs(cashTotals.total - financialTotals.total) > 0.01,
          difference: cashTotals.total - financialTotals.total,
          percentage: financialTotals.total !== 0 
            ? ((cashTotals.total - financialTotals.total) / financialTotals.total * 100).toFixed(2)
            : 'N/A'
        },
        status: Math.abs(cashTotals.total - financialTotals.total) <= 0.01 ? 'RECONCILED' : 'NEEDS_REVIEW'
      };
      
      res.json(reconciliation);
      
    } catch (error) {
      res.status(500).json({ error: `Error en reconciliación: ${error}` });
    }
  }
  
  /**
   * REPORTE DETALLADO DE CAMBIOS Y DEVOLUCIONES
   */
  async getReturnsAndRefundsReport(req: Request, res: Response): Promise<void> {
    try {
      const { storeId, startDate, endDate } = req.query;
      
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      
      // Obtener todas las devoluciones completadas
      const returns = await ReturnRequest.find({
        storeId,
        processedAt: dateFilter
      })
        .populate('orderId')
        .populate('customerId', 'name email')
        .populate('requestedBy', 'name')
        .populate('processedBy', 'name');
      
      // Obtener reembolsos asociados
      const refunds = await RefundTransaction.find({
        storeId,
        initiatedAt: dateFilter
      });
      
      // Análisis por categoría de razón
      const byReasonCategory = {};
      const byRefundMethod = {};
      const byType = {};
      
      returns.forEach(r => {
        // Por categoría
        if (!byReasonCategory[r.returnReasonCategory]) {
          byReasonCategory[r.returnReasonCategory] = { count: 0, total: 0 };
        }
        byReasonCategory[r.returnReasonCategory].count++;
        byReasonCategory[r.returnReasonCategory].total += r.totalRefundAmount;
        
        // Por método
        if (!byRefundMethod[r.refundMethod]) {
          byRefundMethod[r.refundMethod] = { count: 0, total: 0 };
        }
        byRefundMethod[r.refundMethod].count++;
        byRefundMethod[r.refundMethod].total += r.totalRefundAmount;
        
        // Por tipo
        if (!byType[r.type]) {
          byType[r.type] = { count: 0, total: 0 };
        }
        byType[r.type].count++;
        byType[r.type].total += r.totalRefundAmount;
      });
      
      res.json({
        period: { start: startDate, end: endDate },
        summary: {
          totalReturns: returns.length,
          totalRefundAmount: returns.reduce((sum, r) => sum + r.totalRefundAmount, 0),
          averageRefundAmount: returns.length > 0 
            ? (returns.reduce((sum, r) => sum + r.totalRefundAmount, 0) / returns.length).toFixed(2)
            : 0
        },
        byReasonCategory,
        byRefundMethod,
        byType,
        details: returns.map(r => ({
          id: r._id,
          orderNumber: r.orderNumber,
          customerId: r.customerId?._id,
          customerName: r.customerName,
          type: r.type,
          reasonCategory: r.returnReasonCategory,
          totalAmount: r.totalRefundAmount,
          refundMethod: r.refundMethod,
          status: r.status,
          requestedAt: r.requestedAt,
          processedAt: r.processedAt,
          requestedBy: (r.requestedBy as any)?.name,
          processedBy: (r.processedBy as any)?.name
        }))
      });
      
    } catch (error) {
      res.status(500).json({ error: `Error en reporte de devoluciones: ${error}` });
    }
  }
  
  /**
   * REPORTE COMPLETO DE AUDITORÍA CON TRAZABILIDAD
   */
  async getComprehensiveAuditTrail(req: Request, res: Response): Promise<void> {
    try {
      const { storeId, entityType, entityId, startDate, endDate } = req.query;
      
      const filter: any = { storeId };
      
      if (entityType) filter.entityType = entityType;
      if (entityId) filter.entityId = new mongoose.Types.ObjectId(entityId as string);
      
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate as string);
        if (endDate) filter.timestamp.$lte = new Date(endDate as string);
      }
      
      const auditLogs = await AuditLog.find(filter)
        .populate('userId', 'name email role')
        .populate('approvedBy', 'name email')
        .populate('reversedBy', 'name email')
        .sort({ timestamp: -1 });
      
      // Agrupar por acción
      const byActionType = {};
      const financialByType = { debit: 0, credit: 0 };
      
      auditLogs.forEach(log => {
        if (!byActionType[log.actionType]) {
          byActionType[log.actionType] = { count: 0, totalImpact: 0 };
        }
        byActionType[log.actionType].count++;
        
        if (log.financialImpact) {
          byActionType[log.actionType].totalImpact += log.financialImpact.amount;
          financialByType[log.financialImpact.type] += log.financialImpact.amount;
        }
      });
      
      res.json({
        period: { start: startDate, end: endDate },
        summary: {
          totalEvents: auditLogs.length,
          totalFinancialImpact: financialByType.debit - financialByType.credit,
          debits: financialByType.debit,
          credits: financialByType.credit
        },
        byActionType,
        auditTrail: auditLogs.map(log => ({
          timestamp: log.timestamp,
          actionType: log.actionType,
          description: log.description,
          user: (log.userId as any)?.name,
          entityType: log.entityType,
          status: log.status,
          financialImpact: log.financialImpact,
          changes: log.changes
        }))
      });
      
    } catch (error) {
      res.status(500).json({ error: `Error en reporte de auditoría: ${error}` });
    }
  }
  
  /**
   * REPORTE DE INTEGRIDAD CONTABLE
   * Verifica que todas las transacciones estén correctamente registradas
   */
  async getAccountingIntegrityReport(req: Request, res: Response): Promise<void> {
    try {
      const { storeId, startDate, endDate } = req.query;
      
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      
      // Verificar que cada devolución completada tenga:
      // 1. Registro en AuditLog con RETURN_COMPLETED
      // 2. Transacción en RefundTransaction con status PROCESSED
      // 3. Movimiento de caja
      // 4. Transacción financiera
      
      const returns = await ReturnRequest.find({
        storeId,
        status: 'completed'
      });
      
      // Use numeric counters during the loop
      let auditLogCount = 0;
      let refundTxCount = 0;
      let cashMovementCount = 0;
      let financialTxCount = 0;
      const discrepanciesFound: Array<{ returnId: mongoose.Types.ObjectId; issue: string }> = [];
      
      for (const ret of returns) {
        // Verificar AuditLog
        const hasAuditLog = await AuditLog.findOne({
          entityId: ret._id,
          actionType: AuditActionType.RETURN_COMPLETED
        });
        if (hasAuditLog) auditLogCount++;
        else discrepanciesFound.push({
          returnId: ret._id,
          issue: 'Missing AuditLog for RETURN_COMPLETED'
        });
        
        // Verificar RefundTransaction
        const hasRefund = await RefundTransaction.findOne({
          returnRequestId: ret._id,
          status: RefundStatus.PROCESSED
        });
        if (hasRefund) refundTxCount++;
        else discrepanciesFound.push({
          returnId: ret._id,
          issue: 'Missing RefundTransaction'
        });
        
        // Verificar CashMovement
        const hasCashMovement = await CashMovement.findOne({
          orderId: ret.orderId,
          type: 'refund'
        });
        if (hasCashMovement) cashMovementCount++;
        
        // Verificar FinancialTransaction
        const hasFinancialTx = await FinancialTransaction.findOne({
          description: { $regex: ret.orderNumber || ret._id.toString() },
          type: 'expense'
        });
        if (hasFinancialTx) financialTxCount++;
      }
      
      const integrityCheck = {
        timestamp: new Date(),
        totalReturns: returns.length,
        checks: {
          allHaveAuditLog: `${auditLogCount}/${returns.length}`,
          allHaveRefundTransaction: `${refundTxCount}/${returns.length}`,
          allHaveCashMovement: `${cashMovementCount}/${returns.length}`,
          allHaveFinancialTransaction: `${financialTxCount}/${returns.length}`,
          discrepanciesFound
        }
      };
      
      res.json(integrityCheck);
      
    } catch (error) {
      res.status(500).json({ error: `Error en reporte de integridad: ${error}` });
    }
  }
  
  /**
   * EXPORTAR DATOS PARA AUDITORÍA EXTERNA
   */
  async exportAuditDataForExternal(req: Request, res: Response): Promise<void> {
    try {
      const { storeId, startDate, endDate, format = 'json' } = req.query;
      
      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);
      
      // Recopilar todos los datos
      const auditData = {
        exportDate: new Date(),
        period: { start: startDate, end: endDate },
        store: storeId,
        data: {
          returns: await ReturnRequest.find({ storeId, processedAt: dateFilter }),
          refunds: await RefundTransaction.find({ storeId, initiatedAt: dateFilter }),
          auditLogs: await AuditLog.find({ storeId, timestamp: dateFilter }),
          cashMovements: await CashMovement.find({ storeId, date: dateFilter }),
          financialTransactions: await FinancialTransaction.find({ storeId, date: dateFilter })
        }
      };
      
      if (format === 'json') {
        res.json(auditData);
      } else if (format === 'csv') {
        // Implementar exportación a CSV si es necesario
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="audit_export.csv"');
        res.send('CSV export not yet implemented');
      }
      
    } catch (error) {
      res.status(500).json({ error: `Error en exportación: ${error}` });
    }
  }
}

export default new FinancialAuditController();
