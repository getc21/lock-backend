import { Router } from 'express';
import * as auditController from '../controllers/audit.controller';
import financialAuditController from '../controllers/financial-audit.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * AUDITORÍA FINANCIERA Y CONTABILIDAD PROFESIONAL
 * Rutas para reportes, reconciliación y trazabilidad
 */

// ⭐ RUTAS DE COMPROBANTES/RECIBOS
// Nota: Las rutas más específicas deben ir primero
router.get('/receipts/stats', authenticateToken, auditController.getReceiptStats);
router.get('/receipts/date-range', authenticateToken, auditController.getReceiptsByDateRange);
router.get('/receipts/:receiptNumber/:storeId', authenticateToken, auditController.getReceipt);

// Reconciliación contable
router.get('/reconciliation', authenticateToken, financialAuditController.getFinancialReconciliation);

// Reporte de cambios y devoluciones
router.get('/returns-and-refunds', authenticateToken, financialAuditController.getReturnsAndRefundsReport);

// Reporte completo de auditoría
router.get('/trail', authenticateToken, financialAuditController.getComprehensiveAuditTrail);

// Reporte de integridad contable
router.get('/integrity', authenticateToken, financialAuditController.getAccountingIntegrityReport);

// Exportar datos de auditoría
router.get('/export', authenticateToken, financialAuditController.exportAuditDataForExternal);

export default router;
