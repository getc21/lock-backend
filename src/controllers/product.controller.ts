import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { AppError } from '../middleware/errorHandler';
import { ImageService } from '../services/image.service';

export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, categoryId, supplierId, lowStock } = req.query;
    const filter: any = {};

    if (storeId) filter.storeId = storeId;
    if (categoryId) filter.categoryId = categoryId;
    if (supplierId) filter.supplierId = supplierId;
    if (lowStock) filter.stock = { $lte: parseInt(lowStock as string) };

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .populate('supplierId', 'name')
      .populate('locationId', 'name')
      .populate('storeId', 'name');

    res.json({
      status: 'success',
      results: products.length,
      data: { products }
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId')
      .populate('supplierId')
      .populate('locationId')
      .populate('storeId');

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oldProduct = await Product.findById(req.params.id);
    
    if (!oldProduct) {
      return next(new AppError('Product not found', 404));
    }

    // Si hay una nueva imagen y existía una anterior, eliminar la anterior
    if (req.body.foto && oldProduct.foto && oldProduct.foto !== req.body.foto) {
      await ImageService.deleteImage(oldProduct.foto);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Eliminar imagen de Cloudinary si existe
    if (product.foto) {
      await ImageService.deleteImage(product.foto);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add' or 'subtract'
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    if (operation === 'add') {
      product.stock += quantity;
    } else if (operation === 'subtract') {
      if (product.stock < quantity) {
        return next(new AppError('Insufficient stock', 400));
      }
      product.stock -= quantity;
    }

    await product.save();

    res.json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

export const searchProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.params;
    
    if (!query || query.trim() === '') {
      return next(new AppError('Search query is required', 400));
    }

    // Buscar producto por:
    // 1. Nombre que contenga el query (case insensitive)
    const product = await Product.findOne({
      $or: [
        { name: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('categoryId', 'name')
    .populate('supplierId', 'name')
    .populate('locationId', 'name')
    .populate('storeId', 'name');

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};
