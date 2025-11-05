import express from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticateToken } from '../middleware/auth';
import { validateStoreAccessIfProvided } from '../middleware/storePermission';
import { validateOrderStoreAccess } from '../middleware/resourceStoreValidation';

const router = express.Router();

router.use(authenticateToken);

router.get('/', validateStoreAccessIfProvided, orderController.getAllOrders);
router.get('/report', validateStoreAccessIfProvided, orderController.getSalesReport);
router.get('/:id', validateOrderStoreAccess, orderController.getOrder);
router.post('/', validateStoreAccessIfProvided, orderController.createOrder);

export default router;
