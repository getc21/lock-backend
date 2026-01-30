import { Request, Response } from 'express';
import { ReturnRequest, ReturnStatus, ReturnType } from '../models/ReturnRequest';
import { RefundTransaction, RefundStatus } from '../models/RefundTransaction';
import { AuditLog, AuditActionType } from '../models/AuditLog';
import { Order } from '../models/Order';
import { CashMovement } from '../models/CashMovement';
import { FinancialTransaction } from '../models/FinancialTransaction';
import { Product } from '../models/Product';
import { ProductStore } from '../models/ProductStore';
import mongoose from 'mongoose';

/**
 * Controlador profesional para gestión de devoluciones, cambios y reembolsos
 * Incluye auditoría completa, control de inventario y transacciones contables
 */
class ReturnsAndRefundsController {
  
  /**
   * CREAR SOLICITUD DE DEVOLUCIÓN
   * Solicita una devolución/cambio de una orden existente
   */
  createReturnRequest = async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, type, items, refundMethod, reasonCategory, reasonDetails, notes, attachmentUrls, storeId } = req.body;
      const userId = (req as any).user.id;
      
      // 1. Validar que la orden existe
      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ error: 'Orden no encontrada' });
        return;
      }
      
      if (order.storeId.toString() !== storeId) {
        res.status(403).json({ error: 'Tienda no coincide con la orden' });
        return;
      }
      
      // 2. Calcular monto total de reembolso y ACTUALIZAR INVENTARIO INMEDIATAMENTE
      let totalRefund = 0;
      const impactOnInventory: Array<{ productId: any; quantityAdded: any; newStock: any }> = [];
      
      for (const item of items) {
        const productStore = await ProductStore.findOne({
          productId: item.productId,
          storeId
        });
        
        if (!productStore) {
          res.status(404).json({ error: `Producto ${item.productId} no disponible en esta tienda` });
          return;
        }
        
        const refundAmount = item.returnQuantity * item.unitPrice;
        totalRefund += refundAmount;
        
        // ACTUALIZAR INVENTARIO INMEDIATAMENTE
        productStore.stock += item.returnQuantity;
        await productStore.save();
        
        // Registrar impacto en inventario
        impactOnInventory.push({
          productId: item.productId,
          quantityAdded: item.returnQuantity,
          newStock: productStore.stock
        });
      }
      
      // 3. Crear solicitud de devolución
      const returnRequest = new ReturnRequest({
        orderId,
        orderNumber: (order as any).orderNumber || orderId.toString().slice(-8),
        type,
        status: ReturnStatus.PENDING,
        items,
        totalRefundAmount: totalRefund,
        refundMethod,
        customerId: order.customerId,
        storeId: new mongoose.Types.ObjectId(storeId),  // Convertir a ObjectId
        returnReasonCategory: reasonCategory,
        returnReasonDetails: reasonDetails,
        requestedBy: userId,
        requestedAt: new Date(),
        attachmentUrls,
        impactOnInventory,
        notes: Array.isArray(notes) ? notes : (notes ? [notes] : [])
      });
      
      const savedReturn = await returnRequest.save();
      
      // 4. ACTUALIZAR LA ORDEN: reducir cantidades y recalcular total
      for (const returnItem of items) {
        const orderItem = (order as any).items.find((oi: any) => oi.productId.toString() === returnItem.productId.toString());
        if (orderItem) {
          // Reducir cantidad devuelta del item
          orderItem.quantity -= returnItem.returnQuantity;
          
          // Si la cantidad es 0, remover el item de la orden
          if (orderItem.quantity <= 0) {
            (order as any).items = (order as any).items.filter((oi: any) => 
              oi.productId.toString() !== returnItem.productId.toString()
            );
          }
        }
      }
      
      // Recalcular totalOrden
      let newTotal = 0;
      for (const orderItem of (order as any).items) {
        newTotal += (orderItem.price * orderItem.quantity);
      }
      (order as any).totalOrden = newTotal;
      await order.save();
      
      // 5. Registrar en auditoría
      await this.createAuditLog({
        actionType: AuditActionType.RETURN_REQUESTED,
        description: `Devolución solicitada: Orden ${savedReturn.orderNumber}, Monto: ${totalRefund}`,
        entityType: 'ReturnRequest',
        entityId: savedReturn._id,
        userId,
        storeId,
        changes: [
          { field: 'status', oldValue: null, newValue: ReturnStatus.PENDING },
          { field: 'totalRefundAmount', oldValue: null, newValue: totalRefund }
        ],
        financialImpact: {
          amount: totalRefund,
          currency: 'USD',
          type: 'debit',
          reason: 'Devolución pendiente'
        },
        relatedEntities: [
          { type: 'Order', id: new mongoose.Types.ObjectId(orderId) }
        ]
      });
      
      res.status(201).json({
        message: 'Solicitud de devolución creada exitosamente',
        returnRequest: savedReturn
      });
      
    } catch (error) {
      res.status(500).json({ error: `Error al crear solicitud de devolución: ${error}` });
    }
  };
  
  /**
   * APROBAR SOLICITUD DE DEVOLUCIÓN
   * Gerente o administrador aprueba la solicitud
   */
  approveReturnRequest = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { returnRequestId } = req.params;
      const { approvalNotes } = req.body;
      const userId = (req as any).user.id;
      
      const returnRequest = await ReturnRequest.findById(returnRequestId).session(session);
      if (!returnRequest) {
        await session.abortTransaction();
        res.status(404).json({ error: 'Solicitud de devolución no encontrada' });
        return;
      }
      
      if (returnRequest.status !== ReturnStatus.PENDING) {
        await session.abortTransaction();
        res.status(400).json({ error: 'La solicitud ya ha sido procesada' });
        return;
      }
      
      // Actualizar solicitud
      returnRequest.status = ReturnStatus.APPROVED;
      returnRequest.approvedBy = new mongoose.Types.ObjectId(userId);
      returnRequest.approvedAt = new Date();
      if (approvalNotes) {
        returnRequest.notes.push(`Aprobada: ${approvalNotes}`);
      }
      
      await returnRequest.save({ session });
      
      // Registrar auditoría
      await this.createAuditLog({
        actionType: AuditActionType.RETURN_APPROVED,
        description: `Devolución aprobada: ${returnRequest.orderNumber}`,
        entityType: 'ReturnRequest',
        entityId: returnRequest._id,
        userId,
        storeId: returnRequest.storeId,
        changes: [
          { field: 'status', oldValue: ReturnStatus.PENDING, newValue: ReturnStatus.APPROVED }
        ],
        financialImpact: {
          amount: returnRequest.totalRefundAmount,
          currency: 'USD',
          type: 'debit',
          reason: 'Devolución aprobada'
        }
      }, session);
      
      await session.commitTransaction();
      res.json({
        message: 'Solicitud de devolución aprobada',
        returnRequest
      });
      
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ error: `Error al aprobar devolución: ${error}` });
    } finally {
      await session.endSession();
    }
  }
  
  /**
   * PROCESAR DEVOLUCIÓN (Completar y generar reembolso)
   * Finaliza la devolución y crea la transacción de reembolso
   */
  processReturnAndRefund = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { returnRequestId } = req.params;
      const { processNotes } = req.body;
      const userId = (req as any).user.id;
      
      const returnRequest = await ReturnRequest.findById(returnRequestId).session(session);
      if (!returnRequest) {
        await session.abortTransaction();
        res.status(404).json({ error: 'Solicitud de devolución no encontrada' });
        return;
      }
      
      if (returnRequest.status !== ReturnStatus.APPROVED) {
        await session.abortTransaction();
        res.status(400).json({ error: 'Solo se pueden procesar devoluciones aprobadas' });
        return;
      }
      
      // 1. Actualizar inventario
      for (const impact of returnRequest.impactOnInventory) {
        const productStore = await ProductStore.findOne({
          productId: impact.productId,
          storeId: returnRequest.storeId
        }).session(session);
        
        if (productStore) {
          productStore.stock += impact.quantityAdded;
          await productStore.save({ session });
        }
      }
      
      // 2. Crear transacción de reembolso
      const refundTransaction = new RefundTransaction({
        returnRequestId,
        orderId: returnRequest.orderId,
        amount: returnRequest.totalRefundAmount,
        currency: 'USD',
        type: returnRequest.type === ReturnType.PARTIAL_REFUND ? 'partial' : 'full',
        refundMethod: returnRequest.refundMethod,
        customerId: returnRequest.customerId,
        customerName: returnRequest.customerName,
        storeId: returnRequest.storeId,
        status: RefundStatus.PROCESSED,
        initiatedBy: userId,
        initiatedAt: new Date(),
        processedBy: userId,
        processedAt: new Date(),
        notes: processNotes
      });
      
      await refundTransaction.save({ session });
      
      // 3. Crear movimiento de caja
      await CashMovement.create([{
        date: new Date(),
        type: 'refund',
        amount: returnRequest.totalRefundAmount,
        description: `Reembolso por devolución: ${returnRequest.orderNumber}`,
        orderId: returnRequest.orderId,
        userId,
        storeId: returnRequest.storeId
      }], { session });
      
      // 4. Registrar en transacciones financieras
      await FinancialTransaction.create([{
        date: new Date(),
        type: 'expense',
        amount: returnRequest.totalRefundAmount,
        description: `Reembolso por devolución: ${returnRequest.orderNumber}`,
        storeId: returnRequest.storeId
      }], { session });
      
      // 5. Actualizar solicitud de devolución
      returnRequest.status = ReturnStatus.COMPLETED;
      returnRequest.processedBy = new mongoose.Types.ObjectId(userId);
      returnRequest.processedAt = new Date();
      if (processNotes) {
        returnRequest.notes.push(`Completada: ${processNotes}`);
      }
      
      await returnRequest.save({ session });
      
      // 6. Registrar en auditoría con detalle financiero completo
      await this.createAuditLog({
        actionType: AuditActionType.REFUND_PROCESSED,
        description: `Reembolso completado: ${returnRequest.orderNumber}, Monto: ${returnRequest.totalRefundAmount}`,
        entityType: 'ReturnRequest',
        entityId: returnRequest._id,
        userId,
        storeId: returnRequest.storeId,
        changes: [
          { field: 'status', oldValue: ReturnStatus.APPROVED, newValue: ReturnStatus.COMPLETED },
          { field: 'processedAt', oldValue: null, newValue: new Date() }
        ],
        financialImpact: {
          amount: returnRequest.totalRefundAmount,
          currency: 'USD',
          type: 'debit',
          reason: 'Reembolso completado'
        },
        relatedEntities: [
          { type: 'Order', id: returnRequest.orderId },
          { type: 'RefundTransaction', id: refundTransaction._id }
        ]
      }, session);
      
      await session.commitTransaction();
      res.json({
        message: 'Devolución y reembolso procesados exitosamente',
        returnRequest,
        refundTransaction
      });
      
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ error: `Error al procesar reembolso: ${error}` });
    } finally {
      await session.endSession();
    }
  };
  
  /**
   * RECHAZAR SOLICITUD DE DEVOLUCIÓN
   * Rechaza una solicitud con razón documentada
   */
  rejectReturnRequest = async (req: Request, res: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const { returnRequestId } = req.params;
      const { rejectionReason, internalNotes } = req.body;
      const userId = (req as any).user.id;
      
      const returnRequest = await ReturnRequest.findById(returnRequestId).session(session);
      if (!returnRequest) {
        await session.abortTransaction();
        res.status(404).json({ error: 'Solicitud de devolución no encontrada' });
        return;
      }
      
      if (![ReturnStatus.PENDING, ReturnStatus.APPROVED].includes(returnRequest.status)) {
        await session.abortTransaction();
        res.status(400).json({ error: 'No se puede rechazar una solicitud en este estado' });
        return;
      }
      
      returnRequest.status = ReturnStatus.REJECTED;
      returnRequest.approvedBy = new mongoose.Types.ObjectId(userId);
      returnRequest.approvedAt = new Date();
      returnRequest.notes.push(`Rechazada: ${rejectionReason}`);
      returnRequest.internalNotes = internalNotes;
      
      await returnRequest.save({ session });
      
      // Registrar auditoría
      await this.createAuditLog({
        actionType: AuditActionType.RETURN_REJECTED,
        description: `Devolución rechazada: ${returnRequest.orderNumber}, Razón: ${rejectionReason}`,
        entityType: 'ReturnRequest',
        entityId: returnRequest._id,
        userId,
        storeId: returnRequest.storeId,
        changes: [
          { field: 'status', oldValue: returnRequest.status, newValue: ReturnStatus.REJECTED }
        ]
      }, session);
      
      await session.commitTransaction();
      res.json({
        message: 'Solicitud de devolución rechazada',
        returnRequest
      });
      
    } catch (error) {
      await session.abortTransaction();
      res.status(500).json({ error: `Error al rechazar devolución: ${error}` });
    } finally {
      await session.endSession();
    }
  };
  
  /**
   * OBTENER DEVOLUCIONES CON FILTROS AVANZADOS
   */
  getReturnsWithFilters = async (req: Request, res: Response): Promise<void> => {
    try {
      const { storeId, status, type, startDate, endDate, customerId, refundMethod } = req.query;
      
      // Validar que storeId esté presente
      if (!storeId) {
        res.status(400).json({ error: 'storeId es requerido' });
        return;
      }
      
      // Convertir storeId a ObjectId si es un string
      let objectIdStoreId: mongoose.Types.ObjectId;
      try {
        objectIdStoreId = new mongoose.Types.ObjectId(storeId as string);
      } catch (error) {
        res.status(400).json({ error: 'Formato de storeId inválido' });
        return;
      }
      
      const filter: any = { storeId: objectIdStoreId };
      
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (customerId) {
        try {
          filter.customerId = new mongoose.Types.ObjectId(customerId as string);
        } catch (error) {
          // Si el formato de customerId es inválido, ignorar el filtro
        }
      }
      if (refundMethod) filter.refundMethod = refundMethod;
      
      if (startDate || endDate) {
        filter.requestedAt = {};
        if (startDate) filter.requestedAt.$gte = new Date(startDate as string);
        if (endDate) filter.requestedAt.$lte = new Date(endDate as string);
      }
      
      const returns = await ReturnRequest.find(filter)
        .populate('orderId')
        .populate('customerId')
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name email')
        .populate('processedBy', 'name email')
        .sort({ requestedAt: -1 });
      
      const summary = {
        total: returns.length,
        totalRefundAmount: returns.reduce((sum, r) => sum + r.totalRefundAmount, 0),
        byStatus: {
          pending: returns.filter(r => r.status === ReturnStatus.PENDING).length,
          approved: returns.filter(r => r.status === ReturnStatus.APPROVED).length,
          completed: returns.filter(r => r.status === ReturnStatus.COMPLETED).length,
          rejected: returns.filter(r => r.status === ReturnStatus.REJECTED).length
        },
        byType: {
          return: returns.filter(r => r.type === ReturnType.RETURN).length,
          exchange: returns.filter(r => r.type === ReturnType.EXCHANGE).length,
          partial: returns.filter(r => r.type === ReturnType.PARTIAL_REFUND).length
        }
      };
      
      res.json({ returns, summary });
      
    } catch (error) {
      res.status(500).json({ error: `Error al obtener devoluciones: ${error}` });
    }
  }
  
  /**
   * OBTENER REPORTE DE AUDITORÍA
   */
  getAuditReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { storeId, actionType, startDate, endDate, entityType } = req.query;
      
      const filter: any = { storeId };
      
      if (actionType) filter.actionType = actionType;
      if (entityType) filter.entityType = entityType;
      
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate as string);
        if (endDate) filter.timestamp.$lte = new Date(endDate as string);
      }
      
      const logs = await AuditLog.find(filter)
        .populate('userId', 'name email role')
        .populate('approvedBy', 'name email')
        .sort({ timestamp: -1 });
      
      const financialSummary = {
        totalDebits: logs
          .filter(l => l.financialImpact?.type === 'debit')
          .reduce((sum, l) => sum + (l.financialImpact?.amount || 0), 0),
        totalCredits: logs
          .filter(l => l.financialImpact?.type === 'credit')
          .reduce((sum, l) => sum + (l.financialImpact?.amount || 0), 0),
        byActionType: {}
      };
      
      res.json({ logs, financialSummary });
      
    } catch (error) {
      res.status(500).json({ error: `Error al obtener reporte de auditoría: ${error}` });
    }
  }
  
  /**
   * Helper: Crear registro de auditoría
   */
  private createAuditLog = async (auditData: any, session?: any): Promise<void> => {
    const logData = {
      ...auditData,
      userName: (await mongoose.model('User').findById(auditData.userId)).name,
      timestamp: new Date(),
      status: 'success'
    };
    
    if (session) {
      await AuditLog.create([logData], { session });
    } else {
      await AuditLog.create([logData]);
    }
  };
}

export default new ReturnsAndRefundsController();
