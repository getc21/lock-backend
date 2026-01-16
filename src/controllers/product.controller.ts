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

    // Encontrar todos los ProductStore para la tienda actual (excluyendo eliminados)
    const productStores = await ProductStore.find({ storeId })
      .populate({
        path: 'productId',
        match: { isDeleted: { $ne: true } }, // Excluir productos eliminados
        populate: [
          { path: 'categoryId', select: 'name' },
          { path: 'supplierId', select: 'name' }
        ]
      })
      .populate('locationId'); // Obtener el documento completo de Location

    // Filtrar por productId null (producto eliminado) y por categoryId o supplierId si se proporciona
    let filtered = productStores.filter(ps => ps.productId !== null);
    
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
      const location = (ps.locationId as any);
      
      return {
        _id: productData._id,
        name: productData.name,
        description: productData.description,
        categoryId: productData.categoryId,
        supplierId: productData.supplierId,
        storeId: productData.storeId,
        locationId: location, // Devolver el objeto completo de location
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
        { path: 'supplierId' }
      ]
    }).populate('locationId'); // Obtener documento completo de Location

    if (!productStore) {
      return next(new AppError('Product not found in this store', 404));
    }

    // Combinar datos - devolver el objeto completo de locationId
    const location = (productStore.locationId as any);
    const product = {
      ...(productStore.productId as any),
      locationId: location, // Devolver el objeto completo de location
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
    // Convertir strings a números (llegan como strings en multipart)
    const storeId = req.body.storeId;
    const salePrice = parseFloat(req.body.salePrice) || 0;
    const purchasePrice = parseFloat(req.body.purchasePrice) || 0;
    const stock = parseInt(req.body.stock) || 0;
    
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    // Debug logs - log ALL body fields
    console.log('=== CREATE PRODUCT DEBUG ===');
    console.log('📨 Full request.body:', JSON.stringify(req.body, null, 2));
    console.log('🔑 Extracted fields (after conversion):');
    console.log(`  - name: ${req.body.name}`);
    console.log(`  - categoryId: ${req.body.categoryId}`);
    console.log(`  - supplierId: ${req.body.supplierId}`);
    console.log(`  - locationId: ${req.body.locationId}`);
    console.log(`  - storeId: ${storeId}`);
    console.log(`  - stock: ${stock} (type: ${typeof stock})`);
    console.log(`  - salePrice: ${salePrice} (type: ${typeof salePrice})`);
    console.log(`  - purchasePrice: ${purchasePrice} (type: ${typeof purchasePrice})`);
    console.log(`👤 User info:`);
    console.log(`  - userId: ${userId}`);
    console.log(`  - userRole: ${userRole}`);

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
      const userStoreIdStr = userStoreId.toString();
      const currentStoreIdStr = storeId.toString();
      const isCurrentStore = userStoreIdStr === currentStoreIdStr;
      const locationIdToUse = isCurrentStore ? req.body.locationId : null;
      
      console.log(`  Creating ProductStore for store ${userStoreIdStr}`);
      console.log(`    - currentStoreId: ${currentStoreIdStr}`);
      console.log(`    - isCurrentStore: ${isCurrentStore}`);
      console.log(`    - locationId: ${locationIdToUse}`);
      console.log(`    - stock: ${isCurrentStore ? stock : 0}`);
      console.log(`    - salePrice: ${isCurrentStore ? salePrice : 0}`);
      console.log(`    - purchasePrice: ${isCurrentStore ? purchasePrice : 0}`);
      
      // Si es la tienda actual, usar los datos completos
      // Si no, crear con stock=0 y precios=0
      const productStore = await ProductStore.create({
        productId: product._id,
        storeId: userStoreId,
        locationId: locationIdToUse, // Solo para la tienda actual
        stock: isCurrentStore ? stock : 0,
        salePrice: isCurrentStore ? salePrice : 0,
        purchasePrice: isCurrentStore ? purchasePrice : 0
      });
      
      console.log(`✅ Created ProductStore: ${productStore._id}`);
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

    // Convertir strings a números (llegan como strings en multipart)
    const salePrice = req.body.salePrice ? parseFloat(req.body.salePrice) : undefined;
    const purchasePrice = req.body.purchasePrice ? parseFloat(req.body.purchasePrice) : undefined;
    const stock = req.body.stock ? parseInt(req.body.stock) : undefined;

    // Actualizar datos genéricos del producto
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        description: req.body.description,
        categoryId: req.body.categoryId,
        supplierId: req.body.supplierId,
        weight: req.body.weight,
        expiryDate: req.body.expiryDate,
        foto: req.body.foto
      },
      {
        new: true,
        runValidators: true
      }
    );

    // Actualizar datos en ProductStore para la tienda actual
    if (req.body.storeId) {
      const updateData: any = {};
      
      if (req.body.locationId) {
        updateData.locationId = req.body.locationId;
      }
      if (salePrice !== undefined) {
        updateData.salePrice = salePrice;
      }
      if (purchasePrice !== undefined) {
        updateData.purchasePrice = purchasePrice;
      }
      if (stock !== undefined) {
        updateData.stock = stock;
      }
      
      if (Object.keys(updateData).length > 0) {
        await ProductStore.updateOne(
          { productId: req.params.id, storeId: req.body.storeId },
          updateData
        );
      }
    }

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

    // Soft delete: marcar como eliminado en lugar de borrar
    product.isDeleted = true;
    product.deletedAt = new Date();
    await product.save();

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
    const { storeId } = req.query;
    
    if (!query || query.trim() === '') {
      return next(new AppError('Search query is required', 400));
    }

    // Buscar producto por nombre o código
    const product = await Product.findOne({
      $or: [
        { name: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('categoryId', 'name')
    .populate('supplierId', 'name')
    .populate('storeId', 'name');

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    const productObj = product.toObject();
    let salePrice = 0;

    // Si se proporciona storeId, obtener el precio de venta de esa tienda
    if (storeId) {
      try {
        const { Types } = require('mongoose');
        const storeObjectId = new Types.ObjectId(storeId as string);
        
        const productStore = await ProductStore.findOne({
          productId: product._id,
          storeId: storeObjectId
        });

        if (!productStore || productStore.stock === 0) {
          return next(new AppError('Producto no disponible en esta tienda', 404));
        }

        salePrice = productStore.salePrice;
      } catch (error) {
        console.error('Error buscando ProductStore:', error);
        return next(new AppError('Error validando disponibilidad del producto', 500));
      }
    } else {
      // Si no se proporciona storeId, obtener el precio de la primera tienda que lo tenga
      const productStore = await ProductStore.findOne({
        productId: product._id
      });
      
      if (productStore) {
        salePrice = productStore.salePrice;
      }
    }

    // Crear objeto con el precio de venta incluido
    const productWithPrice = { ...productObj, salePrice };

    res.json({
      status: 'success',
      data: { product: productWithPrice }
    });
  } catch (error) {
    console.error('Error en searchProduct:', error);
    next(error);
  }
};

export const getProductStocks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener el stock del producto en TODAS las tiendas
    const productStores = await ProductStore.find({ productId: req.params.id })
      .populate({
        path: 'storeId',
        select: 'name'
      })
      .populate({
        path: 'locationId',
        select: 'name'
      });

    if (productStores.length === 0) {
      return next(new AppError('Product not found in any store', 404));
    }

    // Mapear los datos para devolver de forma clara
    const stocks = productStores.map(ps => ({
      storeId: (ps.storeId as any)?._id,
      storeName: (ps.storeId as any)?.name || 'Sin tienda',
      locationId: (ps.locationId as any)?._id,
      locationName: (ps.locationId as any)?.name || 'Sin ubicación',
      stock: ps.stock,
      salePrice: ps.salePrice,
      purchasePrice: ps.purchasePrice
    }));

    res.json({
      status: 'success',
      data: { stocks }
    });
  } catch (error) {
    next(error);
  }
};
