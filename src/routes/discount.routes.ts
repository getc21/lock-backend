import express from 'express';
import * as discountController from '../controllers/discount.controller';
import { authenticateToken } from '../middleware/auth';
import { validateStoreAccessIfProvided } from '../middleware/storePermission';

const router = express.Router();

router.use(authenticateToken);

// ⭐ APLICAR VALIDACIÓN DE TIENDA A TODAS LAS RUTAS
router.get('/', validateStoreAccessIfProvided, discountController.getAllDiscounts);
router.get('/active', validateStoreAccessIfProvided, discountController.getActiveDiscounts);
router.get('/:id', discountController.getDiscount);
router.post('/', discountController.createDiscount); // La tienda se asigna automáticamente
router.patch('/:id', discountController.updateDiscount);
router.delete('/:id', discountController.deleteDiscount);

export default router;
