import { Request, Response, NextFunction } from 'express';
import { Location } from '../models/Location';
import { AppError } from '../middleware/errorHandler';

export const getAllLocations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, page = 1, limit = 50 } = req.query;
    const filter: any = {};

    if (storeId) filter.storeId = storeId;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [locations, total] = await Promise.all([
      Location.find(filter)
        .populate('storeId', 'name')
        .skip(skip)
        .limit(limitNum)
        .lean(), // ✅ .lean() para mejor rendimiento
      Location.countDocuments(filter)
    ]);

    res.json({
      status: 'success',
      results: locations.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      data: { locations }
    });
  } catch (error) {
    next(error);
  }
};

export const getLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const location = await Location.findById(req.params.id).populate('storeId');

    if (!location) {
      return next(new AppError('Location not found', 404));
    }

    res.json({
      status: 'success',
      data: { location }
    });
  } catch (error) {
    next(error);
  }
};

export const createLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('=== CREATE LOCATION DEBUG ===');
    console.log(`Request body: ${JSON.stringify(req.body)}`);
    
    const location = await Location.create(req.body);

    console.log(`✅ Location created: ${location._id}`);

    res.status(201).json({
      status: 'success',
      data: { location }
    });
  } catch (error) {
    console.error('❌ Error creating location:', error);
    next(error);
  }
};

export const updateLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const location = await Location.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!location) {
      return next(new AppError('Location not found', 404));
    }

    res.json({
      status: 'success',
      data: { location }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);

    if (!location) {
      return next(new AppError('Location not found', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};
