import { Request, Response, NextFunction } from 'express';
import { Role } from '../models/Role';
import { AppError } from '../middleware/errorHandler';

export const getAllRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await Role.find();

    res.json({
      status: 'success',
      results: roles.length,
      data: { roles }
    });
  } catch (error) {
    next(error);
  }
};

export const getRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return next(new AppError('Role not found', 404));
    }

    res.json({
      status: 'success',
      data: { role }
    });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await Role.create(req.body);

    res.status(201).json({
      status: 'success',
      data: { role }
    });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!role) {
      return next(new AppError('Role not found', 404));
    }

    res.json({
      status: 'success',
      data: { role }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await Role.findByIdAndDelete(req.params.id);

    if (!role) {
      return next(new AppError('Role not found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
