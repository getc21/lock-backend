import { Request, Response, NextFunction } from 'express';
import { Store } from '../models/Store';
import { AppError } from '../middleware/errorHandler';

export const getAllStores = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const filter: any = {};

    if (status) filter.status = status;

    const stores = await Store.find(filter);

    res.json({
      status: 'success',
      results: stores.length,
      data: { stores }
    });
  } catch (error) {
    next(error);
  }
};

export const getStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findById(req.params.id);

    if (!store) {
      return next(new AppError('Store not found', 404));
    }

    res.json({
      status: 'success',
      data: { store }
    });
  } catch (error) {
    next(error);
  }
};

export const createStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { store }
    });
  } catch (error) {
    next(error);
  }
};

export const updateStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!store) {
      return next(new AppError('Store not found', 404));
    }

    res.json({
      status: 'success',
      data: { store }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteStore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const store = await Store.findByIdAndDelete(req.params.id);

    if (!store) {
      return next(new AppError('Store not found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
