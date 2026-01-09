import express from 'express';
import * as expenseController from '../controllers/expense.controller';
import { authenticateToken } from '../middleware/auth';
import { validateStoreAccessIfProvided } from '../middleware/storePermission';

const router = express.Router();

router.use(authenticateToken);

// 📊 RUTAS DE REPORTES (DEBEN IR PRIMERO)
router.get('/reports', validateStoreAccessIfProvided, expenseController.getExpenseReport);
router.get('/reports/compare', validateStoreAccessIfProvided, expenseController.compareExpensePeriods);

// 🏷️ CATEGORÍAS DE GASTOS
router.get('/categories', validateStoreAccessIfProvided, expenseController.getExpenseCategories);
router.post('/categories', validateStoreAccessIfProvided, expenseController.createExpenseCategory);

// 📋 GASTOS CRUD
router.get('/', validateStoreAccessIfProvided, expenseController.getExpenses);
router.post('/', validateStoreAccessIfProvided, expenseController.createExpense);
router.patch('/:id', validateStoreAccessIfProvided, expenseController.updateExpense);
router.delete('/:id', validateStoreAccessIfProvided, expenseController.deleteExpense);

export default router;
