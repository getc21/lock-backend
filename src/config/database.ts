import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp';
    
    await mongoose.connect(mongoUri);
    
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
