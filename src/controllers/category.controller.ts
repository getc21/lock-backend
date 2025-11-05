import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category';
import { AppError } from '../middleware/errorHandler';
import { ImageService } from '../services/image.service';

export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await Category.find();

    res.json({
      status: 'success',
      results: categories.length,
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
    console.log('🔄 Creando categoría - Datos recibidos:', req.body);
    console.log('👤 Usuario autenticado:', (req as any).user);
    console.log('📁 Archivo recibido:', (req as any).file ? 'Sí' : 'No');
    
    const category = await Category.create(req.body);
    console.log('✅ Categoría creada exitosamente:', category);

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
