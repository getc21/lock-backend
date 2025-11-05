import { Request, Response, NextFunction } from 'express';
import { Customer } from '../models/Customer';
import { AppError } from '../middleware/errorHandler';

export const getAllCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, storeId } = req.query;
    const filter: any = {};

    console.log(`🔍 CustomerController: search=${search}, storeId=${storeId}`);
    console.log(`🔍 CustomerController: req.user=`, (req as any).user);

    // Filtrar por tienda (obligatorio para sistema multi-tienda)
    if (storeId) {
      filter.storeId = storeId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    console.log(`🔍 CustomerController: filter=`, filter);

    const customers = await Customer.find(filter).sort({ createdAt: -1 });

    console.log(`✅ CustomerController: Encontrados ${customers.length} clientes`);

    res.json({
      status: 'success',
      results: customers.length,
      data: { customers }
    });
  } catch (error) {
    console.log(`❌ CustomerController Error:`, error);
    next(error);
  }
};

export const getCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    res.json({
      status: 'success',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

export const createCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    res.json({
      status: 'success',
      data: { customer }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const getTopCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { limit = 10, storeId } = req.query;
    const filter: any = {};
    
    // Filtrar por tienda (obligatorio para sistema multi-tienda)
    if (storeId) {
      filter.storeId = storeId;
    }
    
    const customers = await Customer.find(filter)
      .sort({ totalSpent: -1 })
      .limit(Number(limit));

    res.json({
      status: 'success',
      data: { customers }
    });
  } catch (error) {
    next(error);
  }
};
