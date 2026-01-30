import { Request, Response, NextFunction } from 'express';
import { Quotation } from '../models/Quotation';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { ProductStore } from '../models/ProductStore';
import { Customer } from '../models/Customer';
import { CashMovement } from '../models/CashMovement';
import { AppError } from '../middleware/errorHandler';

export const getAllQuotations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, customerId, status, startDate, endDate } = req.query;
    const filter: any = {};

    if (storeId) filter.storeId = storeId;
    if (customerId) filter.customerId = customerId;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.quotationDate = {};
      if (startDate) filter.quotationDate.$gte = new Date(startDate as string);
      if (endDate) filter.quotationDate.$lte = new Date(endDate as string);
    }

    const quotations = await Quotation.find(filter)
      .populate('customerId', 'name phone email loyaltyPoints')
      .populate('storeId', 'name')
      .populate('items.productId', 'name salePrice')
      .populate('discountId', 'name type value')
      .sort({ quotationDate: -1 });

    res.json({
      status: 'success',
      results: quotations.length,
      data: { quotations }
    });
  } catch (error) {
    next(error);
  }
};

export const getQuotation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quotation = await Quotation.findById(req.params.id)
      .populate('customerId')
      .populate('storeId')
      .populate('items.productId')
      .populate('discountId');

    if (!quotation) {
      return next(new AppError('Quotation not found', 404));
    }

    res.json({
      status: 'success',
      data: { quotation }
    });
  } catch (error) {
    next(error);
  }
};

export const createQuotation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { items, customerId, storeId, discountId, discountAmount, paymentMethod, userId, expirationDate } = req.body;

    // Validar que los productos existan
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return next(new AppError(`Product ${item.productId} not found`, 404));
      }
    }

    // Calcular total
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const totalQuotation = subtotal - (discountAmount || 0);

    // Crear cotización
    const quotation = await Quotation.create({
      quotationDate: new Date(),
      totalQuotation,
      customerId,
      storeId,
      items,
      userId,
      discountId,
      discountAmount: discountAmount || 0,
      paymentMethod,
      expirationDate: expirationDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
      status: 'pending'
    });

    // Poblar datos relacionados
    await quotation.populate('customerId', 'name phone email points');
    await quotation.populate('storeId', 'name');
    await quotation.populate('items.productId', 'name salePrice');
    await quotation.populate('discountId', 'name type value');

    res.json({
      status: 'success',
      message: 'Quotation created successfully',
      data: { quotation }
    });
  } catch (error) {
    next(error);
  }
};

export const convertQuotationToOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quotationId } = req.params;
    const { paymentMethod } = req.body;

    // Obtener la cotización
    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return next(new AppError('Quotation not found', 404));
    }

    if (quotation.status !== 'pending') {
      return next(new AppError(`Cannot convert quotation with status: ${quotation.status}`, 400));
    }

    // Validar método de pago
    const finalPaymentMethod = paymentMethod || quotation.paymentMethod || 'efectivo';

    // Verificar y actualizar stock en ProductStore
    for (const item of quotation.items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return next(new AppError(`Product ${item.productId} not found`, 404));
      }

      // Buscar el ProductStore para esta tienda
      const productStore = await ProductStore.findOne({
        productId: item.productId,
        storeId: quotation.storeId
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

    // Actualizar puntos del cliente si existe
    if (quotation.customerId) {
      const customer = await Customer.findById(quotation.customerId);
      if (customer) {
        // Calcular puntos ganados
        const pointsEarned = Math.floor(quotation.totalQuotation / 100) || 1;
        customer.loyaltyPoints = (customer.loyaltyPoints || 0) + pointsEarned;
        await customer.save();
      }
    }

    // Crear la orden
    const order = await Order.create({
      orderDate: new Date(),
      totalOrden: quotation.totalQuotation,
      paymentMethod: finalPaymentMethod,
      customerId: quotation.customerId,
      storeId: quotation.storeId,
      items: quotation.items,
      userId: quotation.userId
    });

    // Crear movimiento de caja
    if (finalPaymentMethod) {
      await CashMovement.create({
        type: 'income',
        amount: quotation.totalQuotation,
        paymentMethod: finalPaymentMethod,
        description: `Sale from order ${order._id}`,
        storeId: quotation.storeId,
        userId: quotation.userId
      });
    }

    // Actualizar la cotización
    quotation.status = 'converted';
    quotation.convertedOrderId = order._id;
    await quotation.save();

    // Poblar datos de la orden
    await order.populate('customerId', 'name phone');
    await order.populate('storeId', 'name');
    await order.populate('items.productId', 'name salePrice');

    res.json({
      status: 'success',
      message: 'Quotation converted to order successfully',
      data: { order }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuotation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quotationId } = req.params;

    const quotation = await Quotation.findById(quotationId);
    if (!quotation) {
      return next(new AppError('Quotation not found', 404));
    }

    if (quotation.status !== 'pending') {
      return next(new AppError(`Cannot delete quotation with status: ${quotation.status}`, 400));
    }

    quotation.status = 'cancelled';
    await quotation.save();

    res.json({
      status: 'success',
      message: 'Quotation cancelled successfully'
    });
  } catch (error) {
    next(error);
  }
};
