import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { ProductStore } from '../models/ProductStore';
import { Customer } from '../models/Customer';
import { CashMovement } from '../models/CashMovement';
import { CashRegister } from '../models/CashRegister';
import { Receipt } from '../models/Receipt';
import { AppError } from '../middleware/errorHandler';
import { createAuditLog, AuditActionType } from '../utils/auditService';
import { generateReceiptNumber } from '../utils/receiptService';

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, customerId, startDate, endDate, paymentMethod, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (storeId) filter.storeId = storeId;
    if (customerId) filter.customerId = customerId;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate as string);
      if (endDate) filter.orderDate.$lte = new Date(endDate as string);
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50)); // Max 100 items
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customerId', 'name phone')
        .populate('storeId', 'name')
        .populate('items.productId', 'name salePrice')
        .sort({ orderDate: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(), // ✅ Usar .lean() para mejor rendimiento
      Order.countDocuments(filter)
    ]);

    console.log('📦 getAllOrders - Filter:', JSON.stringify(filter));
    console.log('📦 getAllOrders - Found orders:', orders.length);
    console.log('📦 getAllOrders - Total:', total);

    res.json({
      status: 'success',
      results: orders.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      data: { orders }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customerId')
      .populate('storeId')
      .populate('items.productId');

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    res.json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, customerId, storeId, paymentMethod } = req.body;
    const userId = (req as any).user?.id; // Extraer userId del token JWT

    if (!userId) {
      return next(new AppError('User ID not found in token', 401));
    }

    if (!items || items.length === 0) {
      return next(new AppError('Order must contain at least one item', 400));
    }

    // Verificar stock ANTES de crear la orden
    const stockValidation: { [key: string]: number } = {};
    for (const item of items) {
      const productStore = await ProductStore.findOne({
        productId: item.productId,
        storeId
      });

      if (!productStore) {
        return next(new AppError(`Product not available in this store`, 404));
      }

      if (productStore.stock < item.quantity) {
        return next(new AppError(`Insufficient stock for product`, 400));
      }

      stockValidation[item.productId] = item.quantity;
    }

    // Calcular total
    const totalOrden = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    // PASO 1: Crear orden
    const order = await Order.create({
      orderDate: new Date(),
      totalOrden,
      paymentMethod: paymentMethod || 'efectivo',
      customerId: customerId || null,
      storeId,
      items,
      userId,
      receiptNumber: undefined // Se asignará después
    });

    const orderId = order._id;

    // PASO 2: Generar número de comprobante
    const receiptNumber = await generateReceiptNumber(storeId as string);

    // PASO 3: Actualizar stock en ProductStore
    for (const item of items) {
      const result = await ProductStore.findOneAndUpdate(
        {
          productId: item.productId,
          storeId
        },
        {
          $inc: { stock: -item.quantity }
        },
        { new: true }
      );

      if (!result) {
        return next(new AppError(`Failed to update stock for product`, 500));
      }

      // Verificar que el stock no sea negativo
      if (result.stock < 0) {
        return next(new AppError(`Stock became negative`, 500));
      }
    }

    // PASO 4: Crear movimiento de caja
    const saleType = (paymentMethod === 'qr' || paymentMethod === 'tarjeta') ? 'qr' : 'cash';
    await CashMovement.create({
      date: new Date(),
      type: 'sale',
      amount: totalOrden,
      description: `Venta ${saleType === 'qr' ? 'por QR' : 'en efectivo'} #${receiptNumber}`,
      orderId,
      userId,
      storeId,
      saleType: saleType,
      paymentMethod: paymentMethod || 'efectivo'
    });

    // PASO 5: Crear comprobante/recibo
    const receipt = await Receipt.create({
      receiptNumber,
      orderId,
      storeId,
      userId: userId.toString(), // Convertir ObjectId a string
      amount: totalOrden,
      paymentMethod: paymentMethod || 'efectivo',
      customerId: customerId || null,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      })),
      status: 'issued',
      issuedAt: new Date() // Explícitamente establecer la fecha de emisión
    });

    // PASO 6: Actualizar orden con número de comprobante
    await Order.findByIdAndUpdate(orderId, { receiptNumber });

    // PASO 7: Actualizar estadísticas del cliente
    if (customerId) {
      const loyaltyPointsEarned = Math.floor(totalOrden);

      await Customer.findByIdAndUpdate(
        customerId,
        {
          $inc: {
            totalOrders: 1,
            totalSpent: totalOrden,
            loyaltyPoints: loyaltyPointsEarned
          },
          lastPurchase: new Date()
        }
      );
    }

    // PASO 8: Crear entrada de auditoría
    await createAuditLog({
      action: AuditActionType.ORDER_CREATED,
      entity: 'Order',
      entityId: orderId,
      userId,
      storeId: new mongoose.Types.ObjectId(storeId),
      changes: {
        after: {
          orderId: orderId.toString(),
          receiptNumber,
          totalOrden,
          itemCount: items.length,
          paymentMethod,
          customerId: customerId || 'N/A'
        }
      },
      metadata: {
        stockUpdates: stockValidation
      },
      status: 'success'
    });

    res.status(201).json({
      status: 'success',
      data: {
        order,
        receipt,
        receiptNumber
      }
    });

  } catch (error: any) {
    // Registrar el error en auditoría
    try {
      const { storeId, userId } = req.body;
      if (storeId && userId) {
        await createAuditLog({
          action: AuditActionType.ORDER_CREATED,
          entity: 'Order',
          entityId: new mongoose.Types.ObjectId(),
          userId,
          storeId: new mongoose.Types.ObjectId(storeId),
          changes: {
            after: { error: error.message }
          },
          status: 'failed',
          errorMessage: error.message
        });
      }
    } catch (auditError) {
      console.error('Error logging audit:', auditError);
    }

    next(error);
  }
};

export const getSalesReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, startDate, endDate } = req.query;
    const filter: any = { storeId };

    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) filter.orderDate.$gte = new Date(startDate as string);
      if (endDate) filter.orderDate.$lte = new Date(endDate as string);
    }

    const orders = await Order.find(filter);
    
    const totalSales = orders.reduce((sum, order) => sum + order.totalOrden, 0);
    const totalOrders = orders.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Agrupar por método de pago
    const paymentMethods = orders.reduce((acc: any, order) => {
      if (!acc[order.paymentMethod]) {
        acc[order.paymentMethod] = { count: 0, total: 0 };
      }
      acc[order.paymentMethod].count++;
      acc[order.paymentMethod].total += order.totalOrden;
      return acc;
    }, {});

    res.json({
      status: 'success',
      data: {
        totalSales,
        totalOrders,
        averageTicket,
        paymentMethods
      }
    });
  } catch (error) {
    next(error);
  }
};
