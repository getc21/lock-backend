import { Request, Response, NextFunction } from 'express';
import { Discount } from '../models/Discount';
import { AppError } from '../middleware/errorHandler';

export const getAllDiscounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const { isActive, storeId, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    // ⭐ FILTRAR POR TIENDA (solo si se proporciona)
    if (storeId) {
      filter.storeId = storeId;
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50)); // Max 100 items
    const skip = (pageNum - 1) * limitNum;

    const [discounts, total] = await Promise.all([
      Discount.find(filter)
        .populate('storeId', 'name')
        .skip(skip)
        .limit(limitNum)
        .lean(), // ✅ Usar .lean() para mejor rendimiento
      Discount.countDocuments(filter)
    ]);

    res.json({
      status: 'success',
      results: discounts.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      data: { discounts }
    });
  } catch (error) {
    console.error('DiscountController.getAllDiscounts - Error:', error);
    next(error);
  }
};

export const getDiscount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const discount = await Discount.findById(req.params.id).populate('storeId', 'name');

    if (!discount) {
      return next(new AppError('Discount not found', 404));
    }


    res.json({
      status: 'success',
      data: { discount }
    });
  } catch (error) {
    console.error('DiscountController.getDiscount - Error:', error);
    next(error);
  }
};

export const createDiscount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    // ⭐ USAR STOREID DEL BODY O DE LA QUERY PARAM (tienda actual del frontend)
    let discountData = { ...req.body };
    
    // Si no se proporciona storeId en el body, usar el de la query
    if (!discountData.storeId) {
      const storeIdFromQuery = req.query.storeId || req.headers['x-store-id'];
      if (storeIdFromQuery) {
        discountData.storeId = storeIdFromQuery;
      } else {
        // Fallback: usar la primera tienda disponible
        const { Store } = require('../models/Store');
        const firstStore = await Store.findOne({});
        if (firstStore) {
          discountData.storeId = firstStore._id;
        } else {
        }
      }
    }


    const discount = await Discount.create(discountData);
    
    // Populate store info for response
    await discount.populate('storeId', 'name');


    res.status(201).json({
      status: 'success',
      data: { discount }
    });
  } catch (error) {
    console.error('DiscountController.createDiscount - Error:', error);
    next(error);
  }
};

export const updateDiscount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    // ⭐ NO PERMITIR CAMBIAR LA TIENDA EN ACTUALIZACIONES
    const updateData = { ...req.body };
    delete updateData.storeId; // Remover storeId del update para evitar cambios
    
    const discount = await Discount.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).populate('storeId', 'name');

    if (!discount) {
      return next(new AppError('Discount not found', 404));
    }


    res.json({
      status: 'success',
      data: { discount }
    });
  } catch (error) {
    console.error('DiscountController.updateDiscount - Error:', error);
    next(error);
  }
};

export const deleteDiscount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const discount = await Discount.findByIdAndDelete(req.params.id);

    if (!discount) {
      return next(new AppError('Discount not found', 404));
    }


    // ⭐ CAMBIAR A STATUS 200 PARA CONSISTENCIA
    res.status(200).json({
      status: 'success',
      message: 'Descuento eliminado exitosamente',
      data: { deletedDiscount: { id: discount._id, name: discount.name } }
    });
  } catch (error) {
    console.error('DiscountController.deleteDiscount - Error:', error);
    next(error);
  }
};

export const getActiveDiscounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const now = new Date();
    const { storeId } = req.query;
    
    const filter: any = {
      isActive: true,
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: null, endDate: null }
      ]
    };

    // ⭐ FILTRAR POR TIENDA (solo si se proporciona)
    if (storeId) {
      filter.storeId = storeId;
    } else {
    }

    
    const discounts = await Discount.find(filter).populate('storeId', 'name');

    res.json({
      status: 'success',
      results: discounts.length,
      data: { discounts }
    });
  } catch (error) {
    console.error('DiscountController.getActiveDiscounts - Error:', error);
    next(error);
  }
};
