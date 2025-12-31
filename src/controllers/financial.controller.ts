import { Request, Response, NextFunction } from 'express';
import { FinancialTransaction } from '../models/FinancialTransaction';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { ProductStore } from '../models/ProductStore';
import { AppError } from '../middleware/errorHandler';

export const getAllTransactions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, type, category, startDate, endDate } = req.query;
    const filter: any = {};

    if (storeId) filter.storeId = storeId;
    if (type) filter.type = type;
    if (category) filter.category = category;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const transactions = await FinancialTransaction.find(filter)
      .populate('storeId', 'name')
      .sort({ date: -1 });

    res.json({
      status: 'success',
      results: transactions.length,
      data: { transactions }
    });
  } catch (error) {
    next(error);
  }
};

export const getTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await FinancialTransaction.findById(req.params.id).populate('storeId');

    if (!transaction) {
      return next(new AppError('Transaction not found', 404));
    }

    res.json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await FinancialTransaction.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await FinancialTransaction.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!transaction) {
      return next(new AppError('Transaction not found', 404));
    }

    res.json({
      status: 'success',
      data: { transaction }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await FinancialTransaction.findByIdAndDelete(req.params.id);

    if (!transaction) {
      return next(new AppError('Transaction not found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const getFinancialReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, startDate, endDate } = req.query;
    const filter: any = {};

    if (storeId) filter.storeId = storeId;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const transactions = await FinancialTransaction.find(filter);

    const report = {
      totalIncome: 0,
      totalExpense: 0,
      netBalance: 0,
      byCategory: {} as Record<string, number>
    };

    transactions.forEach(t => {
      if (t.type === 'income') {
        report.totalIncome += t.amount;
      } else {
        report.totalExpense += t.amount;
      }

      if (t.category) {
        if (!report.byCategory[t.category]) {
          report.byCategory[t.category] = 0;
        }
        report.byCategory[t.category] += t.type === 'income' ? t.amount : -t.amount;
      }
    });

    report.netBalance = report.totalIncome - report.totalExpense;

    res.json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    next(error);
  }
};

// 📊 NUEVOS ENDPOINTS PARA REPORTES AVANZADOS

// Análisis de rotación de inventario
export const getInventoryRotationAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, startDate, endDate, period = 'monthly' } = req.query;
    
    console.log('🔍 Rotation Analysis Request:', {
      storeId,
      startDate,
      endDate,
      period
    });
    
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    // Obtener ProductStore para la tienda (con datos de stock)
    const productStoreFilter: any = {};
    if (storeId) productStoreFilter.storeId = storeId;

    const productStores = await ProductStore.find(productStoreFilter)
      .populate({
        path: 'productId',
        populate: 'categoryId'
      });

    // Obtener órdenes del período SIN populate para mejor performance
    const orderFilter: any = {};
    if (storeId) orderFilter.storeId = storeId;
    if (Object.keys(dateFilter).length > 0) orderFilter.createdAt = dateFilter;

    
    const orders = await Order.find(orderFilter).lean(); // Usar lean() para mejor performance

    // Debug: Ver estructura de la primera orden
    if (orders.length > 0) {
      console.log('🔬 First order structure:', {
        id: orders[0]._id,
        itemsCount: orders[0].items.length,
        firstItem: orders[0].items[0] ? {
          productId: orders[0].items[0].productId,
          productIdType: typeof orders[0].items[0].productId,
          quantity: orders[0].items[0].quantity
        } : 'No items'
      });
    }

    const rotationAnalysis = productStores.map(productStore => {
      const product = productStore.productId as any;
      
      const productSales = orders.reduce((total, order) => {
        const productItems = order.items.filter(item => {
          // Comparar IDs como strings para seguridad
          const itemProductId = item.productId.toString();
          const productId = (product._id as any).toString();
          return itemProductId === productId;
        });
        return total + productItems.reduce((sum, item) => sum + item.quantity, 0);
      }, 0);

      const averageStock = productStore.stock || 1; // Evitar división por cero
      const rotationRate = averageStock > 0 ? productSales / averageStock : 0;
      
      return {
        productId: product._id,
        productName: product.name,
        category: product.categoryId?.name || 'Sin categoría',
        currentStock: productStore.stock,
        totalSold: productSales,
        rotationRate: Math.round(rotationRate * 100) / 100,
        daysToSellStock: averageStock > 0 && productSales > 0 
          ? Math.round((averageStock / (productSales / 30)) * 100) / 100 
          : null,
        status: rotationRate > 2 ? 'fast' : rotationRate > 0.5 ? 'normal' : 'slow'
      };
    });

    // Estadísticas generales
    const totalProducts = rotationAnalysis.length;
    const fastMoving = rotationAnalysis.filter(p => p.status === 'fast').length;
    const slowMoving = rotationAnalysis.filter(p => p.status === 'slow').length;

    res.json({
      status: 'success',
      data: {
        period: { startDate, endDate },
        summary: {
          totalProducts,
          fastMovingProducts: fastMoving,
          slowMovingProducts: slowMoving,
          averageRotationRate: totalProducts > 0 ? rotationAnalysis.reduce((sum, p) => sum + p.rotationRate, 0) / totalProducts : 0
        },
        products: rotationAnalysis.sort((a, b) => b.rotationRate - a.rotationRate)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Análisis de rentabilidad por producto
export const getProfitabilityAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, startDate, endDate } = req.query;
    
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    // Obtener órdenes del período
    const orderFilter: any = {};
    if (storeId) orderFilter.storeId = storeId;
    if (Object.keys(dateFilter).length > 0) orderFilter.createdAt = dateFilter;

    const orders = await Order.find(orderFilter).populate('items.productId');

    const productProfitability: Record<string, any> = {};

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId) {
          const productId = (item.productId as any)._id.toString();
          const product = item.productId as any;
          
          if (!productProfitability[productId]) {
            productProfitability[productId] = {
              productId: productId,
              productName: product.name,
              category: product.categoryId?.name || 'Sin categoría',
              totalRevenue: 0,
              totalCost: 0,
              totalQuantity: 0,
              orderCount: 0
            };
          }

          const revenue = item.quantity * item.price;
          const cost = item.quantity * (product.purchasePrice || 0);
          
          productProfitability[productId].totalRevenue += revenue;
          productProfitability[productId].totalCost += cost;
          productProfitability[productId].totalQuantity += item.quantity;
          productProfitability[productId].orderCount += 1;
        }
      });
    });

    const profitabilityAnalysis = Object.values(productProfitability).map((product: any) => {
      const profit = product.totalRevenue - product.totalCost;
      const profitMargin = product.totalRevenue > 0 ? (profit / product.totalRevenue) * 100 : 0;
      
      return {
        ...product,
        totalProfit: Math.round(profit * 100) / 100,
        profitMargin: Math.round(profitMargin * 100) / 100,
        averagePrice: product.totalQuantity > 0 ? Math.round((product.totalRevenue / product.totalQuantity) * 100) / 100 : 0,
        revenuePercentage: 0 // Se calculará después
      };
    });

    // Calcular porcentaje de ingresos
    const totalRevenue = profitabilityAnalysis.reduce((sum, p) => sum + p.totalRevenue, 0);
    profitabilityAnalysis.forEach(product => {
      product.revenuePercentage = totalRevenue > 0 ? Math.round((product.totalRevenue / totalRevenue * 100) * 100) / 100 : 0;
    });

    // Estadísticas generales
    const totalProfit = profitabilityAnalysis.reduce((sum, p) => sum + p.totalProfit, 0);
    const averageProfitMargin = profitabilityAnalysis.length > 0 
      ? profitabilityAnalysis.reduce((sum, p) => sum + p.profitMargin, 0) / profitabilityAnalysis.length 
      : 0;

    res.json({
      status: 'success',
      data: {
        period: { startDate, endDate },
        summary: {
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          totalProfit: Math.round(totalProfit * 100) / 100,
          averageProfitMargin: Math.round(averageProfitMargin * 100) / 100,
          productCount: profitabilityAnalysis.length
        },
        products: profitabilityAnalysis.sort((a, b) => b.totalProfit - a.totalProfit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Análisis de tendencias de ventas
export const getSalesTrendsAnalysis = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, period = 'daily', startDate, endDate } = req.query;
    
    // Mapear los períodos del frontend a los del backend
    const periodMapping: Record<string, string> = {
      'day': 'daily',
      'daily': 'daily',
      'week': 'weekly', 
      'weekly': 'weekly',
      'month': 'monthly',
      'monthly': 'monthly'
    };
    
    const mappedPeriod = periodMapping[period as string] || 'daily';
    
    const dateFilter: any = {};
    if (startDate) dateFilter.$gte = new Date(startDate as string);
    if (endDate) dateFilter.$lte = new Date(endDate as string);

    const orderFilter: any = {};
    if (storeId) orderFilter.storeId = storeId;
    if (Object.keys(dateFilter).length > 0) orderFilter.createdAt = dateFilter;

    const orders = await Order.find(orderFilter);

    // Agrupar por período
    const groupedData: Record<string, any> = {};
    
    orders.forEach(order => {
      let periodKey: string;
      const orderDate = new Date(order.createdAt);
      
      switch (mappedPeriod) {
        case 'hourly':
          const hourPadded = orderDate.getHours().toString().padStart(2, '0');
          const dayPadded = orderDate.getDate().toString().padStart(2, '0');
          const monthPadded = (orderDate.getMonth() + 1).toString().padStart(2, '0');
          periodKey = `${orderDate.getFullYear()}-${monthPadded}-${dayPadded}-${hourPadded}`;
          break;
        case 'daily':
          const dayPaddedDaily = orderDate.getDate().toString().padStart(2, '0');
          const monthPaddedDaily = (orderDate.getMonth() + 1).toString().padStart(2, '0');
          periodKey = `${orderDate.getFullYear()}-${monthPaddedDaily}-${dayPaddedDaily}`;
          break;
        case 'weekly':
          // Calcular el inicio de la semana (lunes)
          const weekStart = new Date(orderDate);
          const dayOfWeek = orderDate.getDay();
          const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Si es domingo (0), restar 6 días, sino restar (dayOfWeek - 1)
          weekStart.setDate(orderDate.getDate() - daysToSubtract);
          const weekDay = weekStart.getDate().toString().padStart(2, '0');
          const weekMonth = (weekStart.getMonth() + 1).toString().padStart(2, '0');
          periodKey = `${weekStart.getFullYear()}-${weekMonth}-${weekDay}`;
          break;
        case 'monthly':
          const monthPaddedMonthly = (orderDate.getMonth() + 1).toString().padStart(2, '0');
          periodKey = `${orderDate.getFullYear()}-${monthPaddedMonthly}-01`;
          break;
        default:
          const dayPaddedDefault = orderDate.getDate().toString().padStart(2, '0');
          const monthPaddedDefault = (orderDate.getMonth() + 1).toString().padStart(2, '0');
          periodKey = `${orderDate.getFullYear()}-${monthPaddedDefault}-${dayPaddedDefault}`;
      }

      if (!groupedData[periodKey]) {
        groupedData[periodKey] = {
          period: periodKey,
          orderCount: 0,
          totalRevenue: 0,
          totalItems: 0,
          averageOrderValue: 0
        };
      }

      groupedData[periodKey].orderCount += 1;
      groupedData[periodKey].totalRevenue += order.totalOrden;
      groupedData[periodKey].totalItems += order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    });

    // Calcular promedios y tendencias
    const trendsData = Object.values(groupedData).map((data: any) => {
      data.averageOrderValue = data.orderCount > 0 ? Math.round((data.totalRevenue / data.orderCount) * 100) / 100 : 0;
      
      // Mapear campos para compatibilidad con frontend
      return {
        period: data.period,
        date: data.period, // Ahora period es siempre una fecha válida YYYY-MM-DD
        orderCount: data.orderCount,
        totalRevenue: data.totalRevenue,
        totalSales: data.totalRevenue, // Frontend busca 'totalSales'
        totalItems: data.totalItems,
        averageOrderValue: data.averageOrderValue,
        avgOrderValue: data.averageOrderValue, // Frontend busca 'avgOrderValue'
      };
    }).sort((a, b) => a.period.localeCompare(b.period));

    // Calcular tendencias generales
    const totalPeriods = trendsData.length;
    const totalRevenue = trendsData.reduce((sum, d) => sum + d.totalRevenue, 0);
    const totalOrders = trendsData.reduce((sum, d) => sum + d.orderCount, 0);

    // Calcular crecimiento
    let growthRate = 0;
    if (trendsData.length >= 2) {
      const firstHalf = trendsData.slice(0, Math.floor(trendsData.length / 2));
      const secondHalf = trendsData.slice(Math.floor(trendsData.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.totalRevenue, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.totalRevenue, 0) / secondHalf.length;
      
      growthRate = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
    }

    res.json({
      status: 'success',
      data: {
        period: { type: mappedPeriod, startDate, endDate },
        summary: {
          totalSales: Math.round(totalRevenue * 100) / 100,  // Frontend espera 'totalSales'
          totalRevenue: Math.round(totalRevenue * 100) / 100, // Mantener compatibilidad
          totalOrders,
          averageDaily: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0,  // Frontend espera 'averageDaily' 
          averageOrderValue: totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0, // Mantener compatibilidad
          growthRate: Math.round(growthRate * 100) / 100,
          periodCount: totalPeriods,  // Frontend espera 'periodCount'
          periodsAnalyzed: totalPeriods // Mantener compatibilidad
        },
        trends: trendsData
      }
    });
  } catch (error) {
    next(error);
  }
};

// Comparación de períodos
export const getPeriodsComparison = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      storeId, 
      currentStartDate, 
      currentEndDate, 
      previousStartDate, 
      previousEndDate 
    } = req.query;

    if (!currentStartDate || !currentEndDate || !previousStartDate || !previousEndDate) {
      return next(new AppError('All date parameters are required for period comparison', 400));
    }

    const baseFilter: any = {};
    if (storeId) baseFilter.storeId = storeId;

    // Datos del período actual
    const currentOrders = await Order.find({
      ...baseFilter,
      createdAt: {
        $gte: new Date(currentStartDate as string),
        $lte: new Date(currentEndDate as string)
      }
    });

    // Datos del período anterior
    const previousOrders = await Order.find({
      ...baseFilter,
      createdAt: {
        $gte: new Date(previousStartDate as string),
        $lte: new Date(previousEndDate as string)
      }
    });

    const calculatePeriodStats = (orders: any[]) => {
      const totalSales = orders.reduce((sum, order) => sum + order.totalOrden, 0);
      const totalOrders = orders.length;
      const totalItems = orders.reduce((sum: number, order: any) => 
        sum + order.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0), 0);
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      return {
        totalSales: Math.round(totalSales * 100) / 100,
        totalOrders,
        totalItems,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100
      };
    };

    const currentStats = calculatePeriodStats(currentOrders);
    const previousStats = calculatePeriodStats(previousOrders);

    // Calcular cambios porcentuales
    const calculatePercentageChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100 * 100) / 100;
    };

    const comparison = {
      currentPeriod: currentStats,
      previousPeriod: previousStats,
      salesGrowth: calculatePercentageChange(currentStats.totalSales, previousStats.totalSales),
      ordersGrowth: calculatePercentageChange(currentStats.totalOrders, previousStats.totalOrders),
      avgOrderValueGrowth: calculatePercentageChange(currentStats.averageOrderValue, previousStats.averageOrderValue),
    };

    // Análisis por productos (top 10 más vendidos en período actual)
    const productAnalysis = new Map();
    
    // Procesar período actual
    currentOrders.forEach(order => {
      order.items.forEach((item: any) => {
        const productId = item.productId.toString();
        const productName = item.productName || 'Producto sin nombre';
        
        if (!productAnalysis.has(productId)) {
          productAnalysis.set(productId, {
            productName,
            currentSales: 0,
            currentQuantity: 0,
            previousSales: 0,
            previousQuantity: 0
          });
        }
        
        const product = productAnalysis.get(productId);
        product.currentSales += item.price * item.quantity;
        product.currentQuantity += item.quantity;
      });
    });

    // Procesar período anterior
    previousOrders.forEach(order => {
      order.items.forEach((item: any) => {
        const productId = item.productId.toString();
        const productName = item.productName || 'Producto sin nombre';
        
        if (!productAnalysis.has(productId)) {
          productAnalysis.set(productId, {
            productName,
            currentSales: 0,
            currentQuantity: 0,
            previousSales: 0,
            previousQuantity: 0
          });
        }
        
        const product = productAnalysis.get(productId);
        product.previousSales += item.price * item.quantity;
        product.previousQuantity += item.quantity;
      });
    });

    // Convertir a array y calcular crecimiento
    const productComparisons = Array.from(productAnalysis.values())
      .map(product => ({
        ...product,
        growth: calculatePercentageChange(product.currentSales, product.previousSales)
      }))
      .sort((a, b) => b.currentSales - a.currentSales)
      .slice(0, 10);

    res.json({
      status: 'success',
      data: { 
        comparison,
        productComparisons
      }
    });
  } catch (error) {
    next(error);
  }
};
