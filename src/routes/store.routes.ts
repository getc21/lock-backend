import express from 'express';
import * as storeController from '../controllers/store.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', storeController.getAllStores);
router.get('/:id', storeController.getStore);
router.post('/', storeController.createStore);
router.patch('/:id', storeController.updateStore);
router.delete('/:id', storeController.deleteStore);

export default router;
