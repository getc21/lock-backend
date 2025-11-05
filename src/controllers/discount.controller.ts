import { Request, Response, NextFunction } from 'express';
import { Discount } from '../models/Discount';
import { AppError } from '../middleware/errorHandler';

export const getAllDiscounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('DiscountController.getAllDiscounts - Query params:', req.query);
    console.log('DiscountController.getAllDiscounts - User context:', (req as any).user);
    
    const { isActive, storeId } = req.query;
    const filter: any = {};

    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    // ⭐ FILTRAR POR TIENDA (solo si se proporciona)
    if (storeId) {
      filter.storeId = storeId;
      console.log('DiscountController.getAllDiscounts - Filtering by store:', storeId);
    } else {
      console.log('DiscountController.getAllDiscounts - No storeId filter, showing all discounts');
    }

    console.log('DiscountController.getAllDiscounts - Applied filter:', filter);

    const discounts = await Discount.find(filter).populate('storeId', 'name');
    console.log('DiscountController.getAllDiscounts - Found discounts count:', discounts.length);
    console.log('DiscountController.getAllDiscounts - Sample discount:', discounts[0]);

    res.json({
      status: 'success',
      results: discounts.length,
      data: { discounts }
    });
  } catch (error) {
    console.error('DiscountController.getAllDiscounts - Error:', error);
    next(error);
  }
};

export const getDiscount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('DiscountController.getDiscount - Getting discount ID:', req.params.id);
    
    const discount = await Discount.findById(req.params.id).populate('storeId', 'name');

    if (!discount) {
      return next(new AppError('Discount not found', 404));
    }

    console.log('DiscountController.getDiscount - Found discount for store:', discount.storeId);

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
    console.log('DiscountController.createDiscount - Request body:', req.body);
    console.log('DiscountController.createDiscount - User context:', (req as any).user);
    
    // ⭐ USAR STOREID DEL BODY O DE LA QUERY PARAM (tienda actual del frontend)
    let discountData = { ...req.body };
    
    // Si no se proporciona storeId en el body, usar el de la query
    if (!discountData.storeId) {
      const storeIdFromQuery = req.query.storeId || req.headers['x-store-id'];
      if (storeIdFromQuery) {
        discountData.storeId = storeIdFromQuery;
        console.log('DiscountController.createDiscount - Using storeId from query/header:', storeIdFromQuery);
      } else {
        // Fallback: usar la primera tienda disponible
        const { Store } = require('../models/Store');
        const firstStore = await Store.findOne({});
        if (firstStore) {
          discountData.storeId = firstStore._id;
          console.log('DiscountController.createDiscount - No storeId provided, using first store:', firstStore.name);
        } else {
          console.log('DiscountController.createDiscount - No stores found, creating discount without storeId');
        }
      }
    }

    console.log('DiscountController.createDiscount - Creating discount with data:', discountData);

    const discount = await Discount.create(discountData);
    
    // Populate store info for response
    await discount.populate('storeId', 'name');

    console.log('DiscountController.createDiscount - Created discount:', discount);

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
    console.log('DiscountController.updateDiscount - Updating discount ID:', req.params.id);
    console.log('DiscountController.updateDiscount - Update data:', req.body);
    
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

    console.log('DiscountController.updateDiscount - Updated discount:', discount);

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
    console.log('DiscountController.deleteDiscount - Deleting discount ID:', req.params.id);
    
    const discount = await Discount.findByIdAndDelete(req.params.id);

    if (!discount) {
      return next(new AppError('Discount not found', 404));
    }

    console.log('DiscountController.deleteDiscount - Deleted discount from store:', discount.storeId);

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
    console.log('DiscountController.getActiveDiscounts - Query params:', req.query);
    console.log('DiscountController.getActiveDiscounts - User context:', (req as any).user);
    
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
      console.log('DiscountController.getActiveDiscounts - Filtering by store:', storeId);
    } else {
      console.log('DiscountController.getActiveDiscounts - No storeId filter, showing all active discounts');
    }

    console.log('DiscountController.getActiveDiscounts - Applied filter:', filter);
    
    const discounts = await Discount.find(filter).populate('storeId', 'name');
    console.log('DiscountController.getActiveDiscounts - Found active discounts count:', discounts.length);
    console.log('DiscountController.getActiveDiscounts - Sample discount:', discounts[0]);

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
