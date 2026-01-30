import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { ProductStore } from '../models/ProductStore';
import { Customer } from '../models/Customer';
import { CashMovement } from '../models/CashMovement';
import { AppError } from '../middleware/errorHandler';

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
    const { items, customerId, storeId, paymentMethod, userId } = req.body;

    // Verificar y actualizar stock en ProductStore
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return next(new AppError(`Product ${item.productId} not found`, 404));
      }

      // Buscar el ProductStore para esta tienda
      const productStore = await ProductStore.findOne({
        productId: item.productId,
        storeId
      });

      if (!productStore) {
        return next(new AppError(`Product not available in this store`, 404));
      }

      if (productStore.stock < item.quantity) {
        return next(new AppError(`Insufficient stock for ${product.name}`, 400));
      }
      
      // Actualizar stock en ProductStore
      productStore.stock -= item.quantity;
      await productStore.save();
    }

    // Calcular total
    const totalOrden = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

    // Crear orden
    const order = await Order.create({
      orderDate: new Date(),
      totalOrden,
      paymentMethod: paymentMethod || 'efectivo',
      customerId,
      storeId,
      items,
      userId
    });

    // Registrar movimiento de caja
    await CashMovement.create({
      date: new Date(),
      type: 'sale',
      amount: totalOrden,
      description: `Venta #${order._id}`,
      orderId: order._id,
      userId,
      storeId
    });

    // Actualizar estadísticas del cliente
    if (customerId) {
      // Calcular puntos de lealtad (1 punto por cada peso gastado, redondear hacia abajo)
      const loyaltyPointsEarned = Math.floor(totalOrden);
      
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { 
          totalOrders: 1, 
          totalSpent: totalOrden,
          loyaltyPoints: loyaltyPointsEarned
        },
        lastPurchase: new Date()
      });
    }

    res.status(201).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
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
