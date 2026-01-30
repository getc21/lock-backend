import { Router } from 'express';
import returnsController from '../controllers/returns.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * GESTIÓN DE DEVOLUCIONES Y CAMBIOS
 * Rutas profesionales para sistema contable
 */

// Ruta de prueba SIN autenticación para diagnosticar
router.get('/test/debug', (req, res) => {
  console.log('✓ DEBUG: /api/returns/test/debug fue llamado');
  res.json({ 
    status: 'OK', 
    message: 'Returns endpoint is working without auth',
    timestamp: new Date().toISOString()
  });
});

// Ruta de prueba sin autenticación
router.get('/health', (req, res) => {
  console.log('✓ DEBUG: /api/returns/health fue llamado');
  res.json({ status: 'ok', message: 'Returns endpoint is working' });
});

// Crear solicitud de devolución
router.post('/request', authenticateToken, returnsController.createReturnRequest);

// Aprobar solicitud de devolución
router.patch('/:returnRequestId/approve', authenticateToken, returnsController.approveReturnRequest);

// Procesar devolución y generar reembolso
router.patch('/:returnRequestId/process', authenticateToken, returnsController.processReturnAndRefund);

// Rechazar solicitud de devolución
router.patch('/:returnRequestId/reject', authenticateToken, returnsController.rejectReturnRequest);

// Obtener devoluciones con filtros
router.get('/', authenticateToken, returnsController.getReturnsWithFilters);

// Obtener reporte de auditoría
router.get('/audit/report', authenticateToken, returnsController.getAuditReport);

export default router;
