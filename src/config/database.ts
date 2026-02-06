import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp';
    
    // Configuración con timeouts para evitar bloqueos infinitos
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,      // 5 segundos para seleccionar servidor
      socketTimeoutMS: 45000,               // 45 segundos para operaciones
      connectTimeoutMS: 10000,              // 10 segundos para conectar
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,                      // Máximo 10 conexiones simultáneas
      minPoolSize: 2
    });
    
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// For PostgreSQL (alternative implementation)
// import { Pool } from 'pg';
// 
// export const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });
// 
// export const connectDatabase = async (): Promise<void> => {
//   try {
//     await pool.query('SELECT NOW()');
//   } catch (error) {
//     console.error('❌ PostgreSQL connection error:', error);
//     throw error;
//   }
// };
