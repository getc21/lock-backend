import express from 'express';
import * as userController from '../controllers/user.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', authorizeRoles('admin'), userController.getAllUsers);
router.get('/:id', userController.getUser);
router.post('/', authorizeRoles('admin'), userController.createUser);
router.patch('/:id', authorizeRoles('admin'), userController.updateUser);
router.delete('/:id', authorizeRoles('admin'), userController.deleteUser);
router.post('/assign-store', authorizeRoles('admin'), userController.assignStoreToUser);

export default router;

