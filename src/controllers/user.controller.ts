import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcryptjs';

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, isActive, storeId, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (storeId) filter.stores = storeId;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('stores', 'name')
        .select('-passwordHash')
        .skip(skip)
        .limit(limitNum)
        .lean(), // ✅ .lean() para mejor rendimiento
      User.countDocuments(filter)
    ]);

    res.json({
      status: 'success',
      results: users.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      data: { users }
    });
  } catch (error) {
    console.error('UserController.getAllUsers - Error:', error);
    next(error);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id).populate('stores').select('-passwordHash');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password, ...userData } = req.body;
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      ...userData,
      passwordHash
    });

    const userResponse = user.toObject();
    delete (userResponse as any).passwordHash;

    res.status(201).json({
      status: 'success',
      data: { user: userResponse }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password, ...updateData } = req.body;

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    }).select('-passwordHash');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new AppError('User not found', 404));
    }


    // Cambiar de 204 a 200 para devolver un response body
    res.status(200).json({
      status: 'success',
      message: 'Usuario eliminado exitosamente',
      data: { deletedUser: { id: user._id, email: user.email } }
    });
  } catch (error) {
    console.error('UserController.deleteUser - Error:', error);
    next(error);
  }
};

export const assignStoreToUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, storeId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    if (!user.stores.includes(storeId)) {
      user.stores.push(storeId);
      await user.save();
    }

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
