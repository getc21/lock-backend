import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';

// Import POS routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import roleRoutes from './routes/role.routes';
import storeRoutes from './routes/store.routes';
import categoryRoutes from './routes/category.routes';
import supplierRoutes from './routes/supplier.routes';
import locationRoutes from './routes/location.routes';
import productRoutes from './routes/product.routes';
import customerRoutes from './routes/customer.routes';
import discountRoutes from './routes/discount.routes';
import orderRoutes from './routes/order.routes';
import cashRoutes from './routes/cash.routes';
import financialRoutes from './routes/financial.routes';
import expenseRoutes from './routes/expense.routes';

// Import accounting and audit routes
import returnsRoutes from './routes/returns.routes';
import auditRoutes from './routes/audit.routes';
import quotationRoutes from './routes/quotation.routes';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

// CORS Configuration
const corsOptions = {
  origin: '*', // Temporarily allow all origins for debugging
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['x-access-token', 'x-auth-token'],
  maxAge: 3600,
  optionsSuccessStatus: 200
};

// Middleware - CORS MUST come first, before helmet
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(morgan('dev'));
app.use(compression()); // ✅ Compresión GZIP para respuestas
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Deshabilitar caché para API - siempre retornar datos frescos
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Bellezapp POS Backend is running' });
});

// POS API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/expenses', expenseRoutes);

// Professional Accounting & Audit Routes
app.use('/api/returns', returnsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/quotations', quotationRoutes);

// Error handling
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    await connectDatabase();
    console.log(`✓ Attempting to start server on port ${PORT}...`);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server successfully running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

