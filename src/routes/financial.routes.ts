import express from 'express';
import * as financialController from '../controllers/financial.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

// 📊 RUTAS PARA REPORTES AVANZADOS (DEBEN IR ANTES DE LAS RUTAS DINÁMICAS)
router.get('/analysis/inventory-rotation', financialController.getInventoryRotationAnalysis);
router.get('/analysis/profitability', financialController.getProfitabilityAnalysis);
router.get('/analysis/sales-trends', financialController.getSalesTrendsAnalysis);
router.get('/analysis/periods-comparison', financialController.getPeriodsComparison);

// Rutas básicas
router.get('/', financialController.getAllTransactions);
router.get('/report', financialController.getFinancialReport);
router.post('/', financialController.createTransaction);
router.patch('/:id', financialController.updateTransaction);
router.delete('/:id', financialController.deleteTransaction);

// Ruta dinámica (DEBE IR AL FINAL)
router.get('/:id', financialController.getTransaction);

export default router;
