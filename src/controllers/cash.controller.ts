import { Request, Response, NextFunction } from 'express';
import { CashRegister } from '../models/CashRegister';
import { CashMovement } from '../models/CashMovement';
import { FinancialTransaction } from '../models/FinancialTransaction';
import { AppError } from '../middleware/errorHandler';

export const openCashRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { openingAmount, storeId, userId } = req.body;

    // Verificar que no haya caja abierta
    const openRegister = await CashRegister.findOne({ storeId, status: 'open' });
    if (openRegister) {
      return next(new AppError('There is already an open cash register', 400));
    }

    const cashRegister = await CashRegister.create({
      date: new Date(),
      openingAmount,
      status: 'open',
      openingTime: new Date(),
      userId,
      storeId
    });

    // Registrar movimiento de apertura
    await CashMovement.create({
      date: new Date(),
      type: 'opening',
      amount: openingAmount,
      description: 'Apertura de caja',
      userId,
      storeId
    });

    res.status(201).json({
      status: 'success',
      data: { cashRegister }
    });
  } catch (error) {
    next(error);
  }
};

export const closeCashRegister = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { closingAmount } = req.body;

    const cashRegister = await CashRegister.findById(id);
    if (!cashRegister) {
      return next(new AppError('Cash register not found', 404));
    }

    if (cashRegister.status === 'closed') {
      return next(new AppError('Cash register is already closed', 400));
    }

    // Calcular monto esperado
    const movements = await CashMovement.find({
      storeId: cashRegister.storeId,
      date: { $gte: cashRegister.openingTime }
    });

    const expectedAmount = cashRegister.openingAmount + movements.reduce((sum, mov) => {
      if (mov.type === 'income' || mov.type === 'sale') return sum + mov.amount;
      if (mov.type === 'expense') return sum - mov.amount;
      return sum;
    }, 0);

    const difference = closingAmount - expectedAmount;

    cashRegister.closingAmount = closingAmount;
    cashRegister.expectedAmount = expectedAmount;
    cashRegister.difference = difference;
    cashRegister.status = 'closed';
    cashRegister.closingTime = new Date();
    await cashRegister.save();

    res.json({
      status: 'success',
      data: { cashRegister }
    });
  } catch (error) {
    next(error);
  }
};

export const getCashMovements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, startDate, endDate, type } = req.query;
    const filter: any = {};

    if (storeId) filter.storeId = storeId;
    if (type) filter.type = type;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    // Obtener movimientos de caja manuales
    const cashMovements = await CashMovement.find(filter).sort({ createdAt: -1 });
    
    // Obtener transacciones financieras (incluye inversiones en inventario)
    const financialFilter: any = {};
    if (storeId) financialFilter.storeId = storeId;
    if (type) financialFilter.type = type;
    if (startDate || endDate) {
      financialFilter.createdAt = {};
      if (startDate) financialFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) financialFilter.createdAt.$lte = new Date(endDate as string);
    }
    
    const financialTransactions = await FinancialTransaction.find(financialFilter).sort({ createdAt: -1 });
    
    // Combinar ambas y ordenar por fecha
    const allMovements = [
      ...cashMovements.map(m => ({ ...m.toObject(), _type: 'cash' })),
      ...financialTransactions.map(f => ({ ...f.toObject(), _type: 'financial' }))
    ].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date).getTime();
      const dateB = new Date(b.createdAt || b.date).getTime();
      return dateB - dateA;
    });

    res.json({
      status: 'success',
      results: allMovements.length,
      data: { movements: allMovements }
    });
  } catch (error) {
    next(error);
  }
};

export const addCashMovement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, amount, description, cashRegisterId } = req.body;
    const storeId = req.body.storeId || (req as any).user?.storeId;

    if (!storeId) {
      return next(new AppError('Store ID is required', 400));
    }

    // Map frontend types to backend types
    const typeMap: { [key: string]: string } = {
      'entrada': 'income',
      'salida': 'expense',
      'income': 'income',
      'expense': 'expense'
    };

    const mappedType = typeMap[type] || type;

    const movement = await CashMovement.create({
      type: mappedType,
      amount,
      description,
      storeId,
      cashRegisterId,
      date: new Date()
    });

    res.status(201).json({
      status: 'success',
      data: movement
    });
  } catch (error) {
    next(error);
  }
};

export const getCashRegisterStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId } = req.query;
    
    if (!storeId) {
      return next(new AppError('Store ID is required', 400));
    }

    // Buscar caja abierta para la tienda
    const openRegister = await CashRegister.findOne({ 
      storeId, 
      status: 'open' 
    }).sort({ openingTime: -1 });

    if (openRegister) {
      res.json({
        status: 'success',
        data: openRegister
      });
    } else {
      res.json({
        status: 'success',
        data: null,
        message: 'No open cash register found'
      });
    }
  } catch (error) {
    next(error);
  }
};
