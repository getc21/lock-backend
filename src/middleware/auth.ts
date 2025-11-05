import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔑 Middleware auth - Header:', authHeader);
  console.log('🎫 Token extraído:', token ? `${token.substring(0, 10)}...` : 'No token');

  if (!token) {
    console.log('❌ No se encontró token');
    return next(new AppError('Access token is required', 401));
  }

  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as any;
    req.user = decoded;
    console.log('✅ Token válido - Usuario:', decoded.email);
    next();
  } catch (error) {
    console.log('❌ Token inválido:', error);
    return next(new AppError('Invalid or expired token', 403));
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};
