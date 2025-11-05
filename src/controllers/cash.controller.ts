import { Request, Response, NextFunction } from 'express';
import { CashRegister } from '../models/CashRegister';
import { CashMovement } from '../models/CashMovement';
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
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate as string);
      if (endDate) filter.date.$lte = new Date(endDate as string);
    }

    const movements = await CashMovement.find(filter).sort({ date: -1 });

    res.json({
      status: 'success',
      results: movements.length,
      data: { movements }
    });
  } catch (error) {
    next(error);
  }
};

export const addCashMovement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movement = await CashMovement.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { movement }
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
