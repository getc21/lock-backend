import dotenv from 'dotenv';
import path from 'path';

// Cargar .env desde la raíz del proyecto (no desde dist/)
// Intenta primero .env.production, luego .env
const envPath = path.resolve(__dirname, '../.env');
const envProductionPath = path.resolve(__dirname, '../.env.production');

// Intentar cargar .env.production primero
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: envProductionPath });
}

// Luego cargar .env (sobrescribe si existe)
dotenv.config({ path: envPath });

console.log(`📝 Loading environment: .env from ${envPath}`);
console.log(`📝 NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

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
  origin: function (origin, callback) {
    // En desarrollo, permitir cualquier origen
    // En producción, especificar orígenes permitidos
    if (process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      const allowedOrigins = [
        'https://naturalmarkets.net',
        'https://www.naturalmarkets.net',
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001',
        'http://10.0.2.2:3000', // Android emulator
        'http://10.0.2.2:3001',
      ];
      if (allowedOrigins.includes(origin || '')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Cache-Control', 'Pragma'],
  exposedHeaders: ['x-access-token', 'x-auth-token'],
  maxAge: 86400, // 24 horas
  optionsSuccessStatus: 200
};

// Middleware - CORS MUST come first, before helmet
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

// Helmet deshabilitado en desarrollo (más rápido)
if (process.env.NODE_ENV === 'production') {
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));
}

// Morgan: usar 'short' en lugar de 'dev' para menos logging
app.use(morgan(process.env.NODE_ENV === 'development' ? 'short' : 'combined'));

// Compresión deshabilitada en desarrollo local (más rápido)
if (process.env.NODE_ENV === 'production') {
  app.use(compression());
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ⭐ SERVIR ARCHIVOS ESTÁTICOS (uploads)
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath));
console.log(`📁 Uploads directory: ${uploadsPath}`);

// Permitir caché en GET (más rápido en desarrollo)
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else {
    // En desarrollo, permitir caché corta en GET
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', 'public, max-age=30'); // 30 segundos
    } else {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
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

