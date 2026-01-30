import { Router } from 'express';
import auditController from '../controllers/financial-audit.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * AUDITORÍA FINANCIERA Y CONTABILIDAD PROFESIONAL
 * Rutas para reportes, reconciliación y trazabilidad
 */

// Reconciliación contable
router.get('/audit/reconciliation', authenticateToken, auditController.getFinancialReconciliation);

// Reporte de cambios y devoluciones
router.get('/audit/returns-and-refunds', authenticateToken, auditController.getReturnsAndRefundsReport);

// Reporte completo de auditoría
router.get('/audit/trail', authenticateToken, auditController.getComprehensiveAuditTrail);

// Reporte de integridad contable
router.get('/audit/integrity', authenticateToken, auditController.getAccountingIntegrityReport);

// Exportar datos de auditoría
router.get('/audit/export', authenticateToken, auditController.exportAuditDataForExternal);

export default router;
