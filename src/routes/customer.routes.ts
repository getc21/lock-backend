import express from 'express';
import * as customerController from '../controllers/customer.controller';
import { authenticateToken } from '../middleware/auth';
import { validateStoreAccessIfProvided } from '../middleware/storePermission';
import { validateCustomerStoreAccess } from '../middleware/resourceStoreValidation';

const router = express.Router();

router.use(authenticateToken);

router.get('/', validateStoreAccessIfProvided, customerController.getAllCustomers);
router.get('/top', validateStoreAccessIfProvided, customerController.getTopCustomers);
router.get('/:id', validateCustomerStoreAccess, customerController.getCustomer);
router.post('/', validateStoreAccessIfProvided, customerController.createCustomer);
router.patch('/:id', validateCustomerStoreAccess, customerController.updateCustomer);
router.delete('/:id', validateCustomerStoreAccess, customerController.deleteCustomer);

export default router;
