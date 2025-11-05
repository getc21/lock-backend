import express from 'express';
import * as productController from '../controllers/product.controller';
import { authenticateToken } from '../middleware/auth';
import { validateStoreAccessIfProvided } from '../middleware/storePermission';
import { validateProductStoreAccess } from '../middleware/resourceStoreValidation';
import { upload } from '../middleware/upload';
import { processImageUpload } from '../services/image.service';

const router = express.Router();

router.use(authenticateToken);

router.get('/', validateStoreAccessIfProvided, productController.getAllProducts);
router.get('/search/:query', validateStoreAccessIfProvided, productController.searchProduct);
router.get('/:id', validateProductStoreAccess, productController.getProduct);
router.post(
  '/', 
  upload.single('foto'),
  processImageUpload('products'),
  validateStoreAccessIfProvided,
  productController.createProduct
);
router.patch(
  '/:id', 
  upload.single('foto'),
  processImageUpload('products'),
  validateProductStoreAccess,
  productController.updateProduct
);
router.delete('/:id', validateProductStoreAccess, productController.deleteProduct);
router.patch('/:id/stock', validateProductStoreAccess, productController.updateStock);

export default router;
