import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { ProductStore } from '../models/ProductStore';
import { User } from '../models/User';
import { Store } from '../models/Store';
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
          { path: 'supplierId', select: 'name' }
        ]
      })
      .populate('locationId', 'name'); // Ubicación específica de esta tienda

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
    const products = filtered.map(ps => {
      const productData = (ps.productId as any) || {};
      return {
        _id: productData._id,
        name: productData.name,
        description: productData.description,
        categoryId: productData.categoryId,
        supplierId: productData.supplierId,
        storeId: productData.storeId,
        locationId: (ps.locationId as any)?.name || ps.locationId, // Ubicación de ProductStore
        foto: productData.foto,
        weight: productData.weight,
        expiryDate: productData.expiryDate,
        stock: ps.stock,
        salePrice: ps.salePrice,
        purchasePrice: ps.purchasePrice,
        productStoreId: ps._id,
        createdAt: productData.createdAt,
        updatedAt: productData.updatedAt
      };
    });

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
    const userRole = (req as any).user?.role;

    // Debug logs
    console.log('=== CREATE PRODUCT DEBUG ===');
    console.log(`Request user object: ${JSON.stringify((req as any).user)}`);
    console.log(`Extracted userId: ${userId}`);
    console.log(`User role: ${userRole}`);
    console.log(`Received storeId: ${storeId}`);

    if (!storeId || !userId) {
      console.log(`❌ Missing data - storeId: ${storeId}, userId: ${userId}`);
      return next(new AppError('Store ID and user ID are required', 400));
    }

    // Obtener el usuario y sus tiendas asociadas
    const user = await User.findById(userId);
    if (!user) {
      console.log(`❌ User not found with ID: ${userId}`);
      return next(new AppError('User not found', 404));
    }
    
    console.log(`✅ User found: ${user.username}`);
    console.log(`User stores: ${user.stores.map(s => s.toString()).join(', ')}`);
    
    // Los admins pueden crear productos en cualquier tienda
    const hasAccess = userRole === 'admin' || user.stores.includes(storeId);
    
    if (!hasAccess) {
      console.log(`❌ User doesn't have access to store ${storeId}`);
      return next(new AppError('You do not have access to this store', 403));
    }

    console.log(`✅ User has access to store ${storeId}`);

    // Crear el producto genérico (sin precios, stock, ni ubicación)
    const product = await Product.create({
      name: req.body.name,
      description: req.body.description,
      categoryId: req.body.categoryId,
      supplierId: req.body.supplierId,
      storeId: storeId, // La tienda que crea el producto
      foto: req.body.foto,
      weight: req.body.weight,
      expiryDate: req.body.expiryDate
    });

    console.log(`✅ Product created: ${product._id}`);

    // Crear entradas ProductStore para TODAS las tiendas del usuario
    const productStores: any[] = [];
    
    // Si el usuario es admin, crear para TODAS las tiendas del sistema
    // Si no, crear solo para las tiendas del usuario
    let storesToCreate: any[] = [];
    
    if (userRole === 'admin') {
      // Obtener todas las tiendas del sistema
      const allStores = await Store.find({});
      storesToCreate = allStores.map(s => s._id);
      console.log(`👨‍💼 Admin creating product for ALL ${storesToCreate.length} stores`);
    } else if (user.stores.length > 0) {
      storesToCreate = user.stores;
      console.log(`👤 User creating product for their ${storesToCreate.length} stores`);
    } else {
      // Si no es admin y no tiene tiendas, solo para la tienda actual
      storesToCreate = [storeId];
      console.log(`⚠️ User has no stores, creating for current store only`);
    }
    
    console.log(`📦 Creating ProductStore entries for ${storesToCreate.length} stores`);
    
    for (const userStoreId of storesToCreate) {
      const isCurrentStore = userStoreId.toString() === storeId;
      
      // Si es la tienda actual, usar los datos completos
      // Si no, crear con stock=0 y precios=0
      const productStore = await ProductStore.create({
        productId: product._id,
        storeId: userStoreId,
        locationId: isCurrentStore ? req.body.locationId : req.body.locationId, // Usar la misma locationId (cada tienda debe actualizarla después)
        stock: isCurrentStore ? stock : 0,
        salePrice: isCurrentStore ? salePrice : 0,
        purchasePrice: isCurrentStore ? purchasePrice : 0
      });
      
      console.log(`✅ Created ProductStore for store ${userStoreId.toString()}`);
      productStores.push(productStore);
    }

    console.log(`✅ Product creation completed successfully`);

    res.status(201).json({
      status: 'success',
      data: { 
        product,
        productStores
      }
    });
  } catch (error) {
    console.error('❌ Error creating product:', error);
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
