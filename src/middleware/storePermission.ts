import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AppError } from './errorHandler';
import { AuthRequest } from './auth';

export const validateStoreAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    // Los admins pueden acceder a todas las tiendas
    if (userRole === 'admin') {
      return next();
    }

    // Obtener el storeId del request (puede venir de query, params o body)
    const storeId = req.query.storeId || req.params.storeId || req.body.storeId;
    
    if (!storeId) {
      return next(new AppError('Store ID is required', 400));
    }

    // Buscar el usuario y sus tiendas asignadas
    const user = await User.findById(userId).populate('stores');
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Verificar si el usuario tiene acceso a la tienda solicitada
    const hasAccess = user.stores.some((store: any) => 
      store._id.toString() === storeId.toString()
    );

    if (!hasAccess) {
      return next(new AppError('You do not have access to this store', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const validateStoreAccessIfProvided = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const storeId = req.query.storeId || req.params.storeId || req.body.storeId;
    
    
    // Los admins pueden acceder a todas las tiendas
    if (userRole === 'admin') {
      return next();
    }
    
    // Si no se proporciona storeId, continuar sin validar (por ahora para diagnóstico)
    if (!storeId) {
      return next();
    }

    // Si se proporciona storeId, validar acceso
    return validateStoreAccess(req, res, next);
  } catch (error) {
    next(error);
  }
};
