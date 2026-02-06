import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category';
import { AppError } from '../middleware/errorHandler';
import { ImageService } from '../services/image.service';

export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, page = 1, limit = 100 } = req.query;
    const filter: any = {};

    if (storeId) filter.storeId = storeId;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit as string) || 100)); // Categories can be larger
    const skip = (pageNum - 1) * limitNum;

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .skip(skip)
        .limit(limitNum)
        .lean(), // ✅ .lean() para mejor rendimiento
      Category.countDocuments(filter)
    ]);

    res.json({
      status: 'success',
      results: categories.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

export const getCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    res.json({
      status: 'success',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const category = await Category.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { category }
    });
  } catch (error) {
    console.error('❌ Error creando categoría:', error);
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oldCategory = await Category.findById(req.params.id);
    
    if (!oldCategory) {
      return next(new AppError('Category not found', 404));
    }

    // Si hay una nueva imagen y existía una anterior, eliminar la anterior
    if (req.body.foto && oldCategory.foto && oldCategory.foto !== req.body.foto) {
      await ImageService.deleteImage(oldCategory.foto);
    }

    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      status: 'success',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    // Eliminar imagen de Cloudinary si existe
    if (category.foto) {
      await ImageService.deleteImage(category.foto);
    }

    await Category.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
