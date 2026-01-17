import dotenv from 'dotenv';
dotenv.config();

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
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

const app: Application = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: function(origin: any, callback: any) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8000',
      'http://localhost:8080',
      'https://bellezapp-frontend.netlify.app',
      'https://bellezapp-frontend.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Error handling
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;

