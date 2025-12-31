import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { ProductStore } from '../models/ProductStore';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { ImageService } from '../services/image.service';

export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, categoryId, supplierId } = req.query;
    
    if (!storeId) {
      return next(new AppError('Store ID is required', 400));
    }

    // Encontrar todos los ProductStore para la tienda actual
    const productStores = await ProductStore.find({ storeId })
      .populate({
        path: 'productId',
        populate: [
          { path: 'categoryId', select: 'name' },
          { path: 'supplierId', select: 'name' },
          { path: 'locationId', select: 'name' }
        ]
      });

    // Filtrar por categoryId o supplierId si se proporciona
    let filtered = productStores;
    
    if (categoryId) {
      filtered = filtered.filter(ps => 
        (ps.productId as any).categoryId._id.toString() === categoryId
      );
    }
    
    if (supplierId) {
      filtered = filtered.filter(ps => 
        (ps.productId as any).supplierId._id.toString() === supplierId
      );
    }

    // Combinar datos de Product y ProductStore
    const products = filtered.map(ps => ({
      ...((ps.productId as any) || {}),
      stock: ps.stock,
      salePrice: ps.salePrice,
      purchasePrice: ps.purchasePrice,
      productStoreId: ps._id
    }));

    res.json({
      status: 'success',
      results: products.length,
      data: { products }
    });
  } catch (error) {
    next(error);
  }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      return next(new AppError('Store ID is required', 400));
    }

    // Encontrar ProductStore específico
    const productStore = await ProductStore.findOne({
      productId: req.params.id,
      storeId
    }).populate({
      path: 'productId',
      populate: [
        { path: 'categoryId' },
        { path: 'supplierId' },
        { path: 'locationId' }
      ]
    });

    if (!productStore) {
      return next(new AppError('Product not found in this store', 404));
    }

    // Combinar datos
    const product = {
      ...(productStore.productId as any),
      stock: productStore.stock,
      salePrice: productStore.salePrice,
      purchasePrice: productStore.purchasePrice,
      productStoreId: productStore._id
    };

    res.json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { storeId, salePrice, purchasePrice, stock } = req.body;
    const userId = (req as any).user?.id;

    if (!storeId || !userId) {
      return next(new AppError('Store ID and user ID are required', 400));
    }

    // Obtener el usuario y sus tiendas asociadas
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    
    if (!user.stores.includes(storeId)) {
      return next(new AppError('You do not have access to this store', 403));
    }

    // Debug: log user stores
    console.log(`Creating product for user ${userId}`);
    console.log(`User stores: ${user.stores.map(s => s.toString()).join(', ')}`);
    console.log(`Current store: ${storeId}`);

    // Crear el producto genérico (sin precios ni stock)
    const product = await Product.create({
      name: req.body.name,
      description: req.body.description,
      categoryId: req.body.categoryId,
      supplierId: req.body.supplierId,
      locationId: req.body.locationId,
      foto: req.body.foto,
      weight: req.body.weight,
      expiryDate: req.body.expiryDate
    });

    // Crear entradas ProductStore para TODAS las tiendas del usuario
    const productStores = [];
    
    for (const userStoreId of user.stores) {
      const isCurrentStore = userStoreId.toString() === storeId;
      
      // Si es la tienda actual, usar los datos completos
      // Si no, crear con stock=0 y precios=0
      const productStore = await ProductStore.create({
        productId: product._id,
        storeId: userStoreId,
        stock: isCurrentStore ? stock : 0,
        salePrice: isCurrentStore ? salePrice : 0,
        purchasePrice: isCurrentStore ? purchasePrice : 0
      });
      
      console.log(`Created ProductStore for store ${userStoreId.toString()} - isCurrentStore: ${isCurrentStore}`);
      productStores.push(productStore);
    }

    res.status(201).json({
      status: 'success',
      data: { 
        product,
        productStores
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oldProduct = await Product.findById(req.params.id);
    
    if (!oldProduct) {
      return next(new AppError('Product not found', 404));
    }

    // Si hay una nueva imagen y existía una anterior, eliminar la anterior
    if (req.body.foto && oldProduct.foto && oldProduct.foto !== req.body.foto) {
      await ImageService.deleteImage(oldProduct.foto);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    // Eliminar imagen de Cloudinary si existe
    if (product.foto) {
      await ImageService.deleteImage(product.foto);
    }

    await Product.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { quantity, operation, storeId } = req.body; // operation: 'add' or 'subtract'
    
    if (!storeId) {
      return next(new AppError('Store ID is required', 400));
    }

    // Encontrar ProductStore específico
    const productStore = await ProductStore.findOne({
      productId: req.params.id,
      storeId
    }).populate('productId');

    if (!productStore) {
      return next(new AppError('Product not found in this store', 404));
    }

    if (operation === 'add') {
      productStore.stock += quantity;
    } else if (operation === 'subtract') {
      if (productStore.stock < quantity) {
        return next(new AppError('Insufficient stock', 400));
      }
      productStore.stock -= quantity;
    }

    await productStore.save();

    res.json({
      status: 'success',
      data: { productStore }
    });
  } catch (error) {
    next(error);
  }
};

export const searchProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { query } = req.params;
    
    if (!query || query.trim() === '') {
      return next(new AppError('Search query is required', 400));
    }

    // Buscar producto por:
    // 1. Nombre que contenga el query (case insensitive)
    const product = await Product.findOne({
      $or: [
        { name: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('categoryId', 'name')
    .populate('supplierId', 'name')
    .populate('locationId', 'name')
    .populate('storeId', 'name');

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.json({
      status: 'success',
      data: { product }
    });
  } catch (error) {
    next(error);
  }
};
