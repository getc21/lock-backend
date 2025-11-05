import { Request, Response, NextFunction } from 'express';
import { Supplier } from '../models/Supplier';
import { AppError } from '../middleware/errorHandler';
import { ImageService } from '../services/image.service';

export const getAllSuppliers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const suppliers = await Supplier.find();

    res.json({
      status: 'success',
      results: suppliers.length,
      data: { suppliers }
    });
  } catch (error) {
    next(error);
  }
};

export const getSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return next(new AppError('Supplier not found', 404));
    }

    res.json({
      status: 'success',
      data: { supplier }
    });
  } catch (error) {
    next(error);
  }
};

export const createSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { supplier }
    });
  } catch (error) {
    next(error);
  }
};

export const updateSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oldSupplier = await Supplier.findById(req.params.id);
    
    if (!oldSupplier) {
      return next(new AppError('Supplier not found', 404));
    }

    // Si hay una nueva imagen y existía una anterior, eliminar la anterior
    if (req.body.foto && oldSupplier.foto && oldSupplier.foto !== req.body.foto) {
      await ImageService.deleteImage(oldSupplier.foto);
    }

    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      status: 'success',
      data: { supplier }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSupplier = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return next(new AppError('Supplier not found', 404));
    }

    // Eliminar imagen de Cloudinary si existe
    if (supplier.foto) {
      await ImageService.deleteImage(supplier.foto);
    }

    await Supplier.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
