import mongoose from 'mongoose';
import { Store } from '../models/Store';
import { User } from '../models/User';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { ProductStore } from '../models/ProductStore';
import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { ExpenseCategory } from '../models/ExpenseCategory';
import { FinancialTransaction } from '../models/FinancialTransaction';
import { Role } from '../models/Role';
import { Supplier } from '../models/Supplier';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bellezapp';

async function cleanDatabase() {
  try {
    console.log('🧹 Limpiando base de datos...');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    await Promise.all([
      Store.deleteMany({}),
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      ProductStore.deleteMany({}),
      Customer.deleteMany({}),
      Order.deleteMany({}),
      ExpenseCategory.deleteMany({}),
      FinancialTransaction.deleteMany({}),
      Role.deleteMany({}),
      Supplier.deleteMany({}),
    ]);

    console.log('✅ Base de datos limpiada correctamente');
    console.log('🎉 Todas las colecciones han sido vaciadas');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanDatabase();
