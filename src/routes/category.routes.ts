import express from 'express';
import * as categoryController from '../controllers/category.controller';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { processImageUpload } from '../services/image.service';

const router = express.Router();

router.use(authenticateToken);

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategory);
router.post(
  '/', 
  upload.single('foto'),
  processImageUpload('categories'),
  categoryController.createCategory
);
router.patch(
  '/:id', 
  upload.single('foto'),
  processImageUpload('categories'),
  categoryController.updateCategory
);
router.delete('/:id', categoryController.deleteCategory);

export default router;
