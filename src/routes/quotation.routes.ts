import { Router } from 'express';
import {
  getAllQuotations,
  getQuotation,
  createQuotation,
  convertQuotationToOrder,
  deleteQuotation
} from '../controllers/quotation.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Obtener todas las cotizaciones
router.get('/', getAllQuotations);

// Obtener una cotización específica
router.get('/:id', getQuotation);

// Crear una nueva cotización
router.post('/', createQuotation);

// Convertir cotización a orden
router.post('/:quotationId/convert', convertQuotationToOrder);

// Cancelar cotización
router.delete('/:quotationId', deleteQuotation);

export default router;
