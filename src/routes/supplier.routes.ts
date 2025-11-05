import express from 'express';
import * as supplierController from '../controllers/supplier.controller';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { processImageUpload } from '../services/image.service';

const router = express.Router();

router.use(authenticateToken);

router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplier);
router.post(
  '/', 
  upload.single('foto'),
  processImageUpload('suppliers'),
  supplierController.createSupplier
);
router.patch(
  '/:id', 
  upload.single('foto'),
  processImageUpload('suppliers'),
  supplierController.updateSupplier
);
router.delete('/:id', supplierController.deleteSupplier);

export default router;
