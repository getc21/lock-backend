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

// Validar que solo admin o manager pueden hacer cambios de inventario
export const validateInventoryManagement = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userRole = req.user?.role;

  // Solo admin y manager pueden ajustar stock
  if (userRole === 'admin' || userRole === 'manager') {
    return next();
  }

  return next(new AppError('Solo administradores y gerentes pueden ajustar el inventario', 403));
};

// Validar restricciones de edición de productos para empleados
// Los empleados solo pueden editar: salePrice, expiryDate
export const validateEmployeeProductEditRestrictions = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userRole = req.user?.role;
  const body = req.body;

  // Los admins y managers no tienen restricciones
  if (userRole === 'admin' || userRole === 'manager') {
    return next();
  }

  // Los empleados solo pueden editar salePrice y expiryDate
  if (userRole === 'employee') {
    const allowedFields = ['salePrice', 'expiryDate'];
    const providedFields = Object.keys(body).filter(
      key => body[key] !== undefined && body[key] !== null && key !== 'storeId'
    );

    const hasRestrictedFields = providedFields.some(
      field => !allowedFields.includes(field)
    );

    if (hasRestrictedFields) {
      return next(
        new AppError(
          'Los empleados solo pueden editar el precio de venta y fecha de caducidad',
          403
        )
      );
    }
  }

  return next();
};

// Validar que solo admin puede acceder
export const validateAdminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userRole = req.user?.role;

  if (userRole === 'admin') {
    return next();
  }

  return next(new AppError('Solo administradores pueden acceder a esta función', 403));
};

// Validar restricciones de empleados para ajuste de stock
// Los empleados solo pueden agregar stock, no quitar
export const validateEmployeeStockRestrictions = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const userRole = req.user?.role;
  const operation = req.body?.operation;

  // Los admins y managers no tienen restricciones
  if (userRole === 'admin' || userRole === 'manager') {
    return next();
  }

  // Los empleados solo pueden agregar (add), no restar (subtract)
  if (userRole === 'employee' && operation === 'subtract') {
    return next(
      new AppError(
        'Los empleados solo pueden agregar stock, no pueden retirar',
        403
      )
    );
  }

  return next();
};

