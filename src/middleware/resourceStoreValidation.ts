import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { Location } from '../models/Location';
import { AppError } from './errorHandler';
import { AuthRequest } from './auth';

// Validar que un producto pertenece a una tienda accesible por el usuario
export const validateProductStoreAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const productId = req.params.id;

    // Los admins pueden acceder a todos los productos
    if (userRole === 'admin') {
      return next();
    }

    // Buscar el producto
    const product = await Product.findById(productId);
    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Buscar el usuario y sus tiendas asignadas
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Verificar si el usuario tiene acceso a la tienda del producto
    const hasAccess = user.stores.some((storeId: any) => 
      storeId.toString() === product.storeId.toString()
    );

    if (!hasAccess) {
      return next(new AppError('You do not have access to this product', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Validar que un cliente pertenece a una tienda accesible por el usuario
export const validateCustomerStoreAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const customerId = req.params.id;

    // Los admins pueden acceder a todos los clientes
    if (userRole === 'admin') {
      return next();
    }

    // Buscar el cliente
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    // Buscar el usuario y sus tiendas asignadas
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Verificar si el usuario tiene acceso a la tienda del cliente
    const hasAccess = user.stores.some((storeId: any) => 
      storeId.toString() === customer.storeId.toString()
    );

    if (!hasAccess) {
      return next(new AppError('You do not have access to this customer', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Validar que una orden pertenece a una tienda accesible por el usuario
export const validateOrderStoreAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const orderId = req.params.id;

    // Los admins pueden acceder a todas las órdenes
    if (userRole === 'admin') {
      return next();
    }

    // Buscar la orden
    const order = await Order.findById(orderId);
    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Buscar el usuario y sus tiendas asignadas
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Verificar si el usuario tiene acceso a la tienda de la orden
    const hasAccess = user.stores.some((storeId: any) => 
      storeId.toString() === order.storeId.toString()
    );

    if (!hasAccess) {
      return next(new AppError('You do not have access to this order', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Validar que una ubicación pertenece a una tienda accesible por el usuario
export const validateLocationStoreAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const locationId = req.params.id;

    // Los admins pueden acceder a todas las ubicaciones
    if (userRole === 'admin') {
      return next();
    }

    // Buscar la ubicación
    const location = await Location.findById(locationId);
    if (!location) {
      return next(new AppError('Location not found', 404));
    }

    // Buscar el usuario y sus tiendas asignadas
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Verificar si el usuario tiene acceso a la tienda de la ubicación
    const hasAccess = user.stores.some((storeId: any) => 
      storeId.toString() === location.storeId.toString()
    );

    if (!hasAccess) {
      return next(new AppError('You do not have access to this location', 403));
    }

    next();
  } catch (error) {
    next(error);
  }
};
