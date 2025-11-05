import express from 'express';
import * as cashController from '../controllers/cash.controller';
import { authenticateToken } from '../middleware/auth';
import { validateStoreAccessIfProvided } from '../middleware/storePermission';

const router = express.Router();

router.use(authenticateToken);

router.post('/register/open', validateStoreAccessIfProvided, cashController.openCashRegister);
router.post('/register/close/:id', validateStoreAccessIfProvided, cashController.closeCashRegister);
router.get('/status', validateStoreAccessIfProvided, cashController.getCashRegisterStatus);
router.get('/movements', validateStoreAccessIfProvided, cashController.getCashMovements);
router.post('/movements', validateStoreAccessIfProvided, cashController.addCashMovement);

export default router;
