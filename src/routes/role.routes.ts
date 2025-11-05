import express from 'express';
import * as roleController from '../controllers/role.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/', roleController.getAllRoles);
router.get('/:id', roleController.getRole);
router.post('/', roleController.createRole);
router.patch('/:id', roleController.updateRole);
router.delete('/:id', roleController.deleteRole);

export default router;
