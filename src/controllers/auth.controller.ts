import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, firstName, lastName, password, role, stores } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return next(new AppError('Email or username already registered', 400));
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      firstName,
      lastName,
      passwordHash,
      role: role || 'cashier',
      stores: stores || []
    });

    // Generate token (sin expiración - válido indefinidamente)
    const secret: Secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      secret
    );

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    // Find user with password
    const user = await User.findOne({ username }).select('+passwordHash').populate('stores');
    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate token (sin expiración - válido indefinidamente)
    const secret: Secret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, username: user.username },
      secret
    );

    res.json({
      status: 'success',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          stores: user.stores
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const user = await User.findById(userId);

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
