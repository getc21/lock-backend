import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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

interface IProduct {
  _id: mongoose.Types.ObjectId;
  basePrice: number;
  name?: string;
  description?: string;
  categoryId?: mongoose.Types.ObjectId;
  images?: string[];
  barcode?: string;
  isActive?: boolean;
}

interface IStore {
  _id: mongoose.Types.ObjectId;
}

interface IProductStore {
  _id: mongoose.Types.ObjectId;
  price: number;
  productId: mongoose.Types.ObjectId;
}

interface IOrder {
  _id: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
  total: number;
  status: string;
  createdAt: Date;
}

interface ICustomer {
  _id: mongoose.Types.ObjectId;
  storeId: mongoose.Types.ObjectId;
}

// Datos de ejemplo
const storeNames = ['Belleza Premium', 'Spa Lujo', 'Centro de Estética'];
const categoryNames = ['Skincare', 'Haircare', 'Makeup', 'Fragrances', 'Tratamientos'];
const productTemplates = [
  { name: 'Crema Facial Hidratante', basePrice: 45 },
  { name: 'Serum Vitamina C', basePrice: 55 },
  { name: 'Mascarilla Purificante', basePrice: 35 },
  { name: 'Limpiador Facial', basePrice: 28 },
  { name: 'Shampoo Premium', basePrice: 25 },
  { name: 'Acondicionador Intenso', basePrice: 28 },
  { name: 'Tratamiento Capilar', basePrice: 40 },
  { name: 'Máscara de Pestañas', basePrice: 32 },
  { name: 'Labial Matte', basePrice: 18 },
  { name: 'Perfume Floral', basePrice: 85 },
  { name: 'Perfume Fresco', basePrice: 80 },
  { name: 'Exfoliante Corporal', basePrice: 22 },
  { name: 'Loción Hidratante', basePrice: 20 },
  { name: 'Jabón Facial', basePrice: 15 },
  { name: 'Tónico Facial', basePrice: 30 },
];
const firstNames = ['María', 'Carlos', 'Ana', 'Juan', 'Laura', 'Pedro', 'Sofia', 'Diego', 'Rosa', 'Miguel'];
const lastNames = ['García', 'López', 'Martínez', 'Rodríguez', 'Pérez', 'González', 'Sánchez', 'Torres', 'Flores', 'Ramírez'];

const expenseCategoryNames = ['Suministros', 'Servicios', 'Mantenimiento', 'Publicidad', 'Transporte', 'Utilities', 'Salarios'];

async function seedDatabase() {
  try {
    console.log('🌱 Iniciando seed de base de datos...');
    
    await mongoose.connect(MONGO_URI);
    console.log('✅ Conectado a MongoDB');

    // Limpiar datos existentes
    console.log('🧹 Limpiando datos existentes...');
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

    // Crear roles
    console.log('👥 Creando roles...');
    const roles = await Role.create([
      { name: 'admin', description: 'Administrador del sistema' },
      { name: 'manager', description: 'Gerente de tienda' },
      { name: 'employee', description: 'Empleado' },
    ]);
    const adminRole = roles[0];
    const managerRole = roles[1];
    const employeeRole = roles[2];

    // Crear tiendas
    console.log('🏪 Creando tiendas...');
    const stores = await Store.create(
      storeNames.map((name, i) => ({
        name,
        description: `${name} - Tienda especializada en productos de belleza y cuidado`,
        phone: `555-000${i}`,
        email: `${name.toLowerCase().replace(/\s/g, '')}@bellezapp.com`,
        address: `Calle Principal ${100 + i}`,
        city: 'Ciudad Central',
        state: 'Estado',
        zipCode: `2800${i}`,
        country: 'País',
        isActive: true,
      }))
    );
    console.log(`✅ ${stores.length} tiendas creadas`);

    // Crear categorías generales
    console.log('📁 Creando categorías...');
    const categories = await Category.create(
      categoryNames.map((name) => ({
        name,
        description: `Categoría de ${name}`,
        image: `category-${name.toLowerCase()}.jpg`,
      }))
    );
    console.log(`✅ ${categories.length} categorías creadas`);

    // Crear proveedores
    console.log('🏭 Creando proveedores...');
    const suppliers = await Supplier.create([
      { name: 'Proveedor Premium', contactName: 'Juan García', email: 'info@premium.com', phone: '555-1111' },
      { name: 'Distribuidora Central', contactName: 'María López', email: 'ventas@central.com', phone: '555-2222' },
      { name: 'Importadora Beauty', contactName: 'Carlos Rodríguez', email: 'compras@beauty.com', phone: '555-3333' },
    ]);
    console.log(`✅ ${suppliers.length} proveedores creados`);

    // Crear productos
    console.log('📦 Creando productos...');
    const products = await Product.create(
      productTemplates.map((template, i) => {
        const expiryDate = new Date();
        expiryDate.setFullYear(expiryDate.getFullYear() + 2);
        const basePrice = template.basePrice;
        
        return {
          name: template.name,
          description: `Producto premium de alta calidad - ${template.name}`,
          categoryId: categories[i % categories.length]._id,
          price: basePrice,
          purchasePrice: basePrice * 0.6,
          images: [`product-${i}.jpg`],
          barcode: `BARCODE-${String(i).padStart(5, '0')}`,
          storeId: stores[i % stores.length]._id,
          supplierId: suppliers[i % suppliers.length]._id,
          expiryDate,
          isActive: true,
        };
      })
    );
    console.log(`✅ ${products.length} productos creados`);

    // Crear ProductStore (relación producto-tienda)
    console.log('🔗 Creando relaciones Producto-Tienda...');
    const productStores: any[] = [];
    for (const store of stores) {
      for (const product of products) {
        const basePrice = (product as any).basePrice || 50;
        const purchasePrice = basePrice * 0.6;
        const salePrice = basePrice * 1.5;
        
        productStores.push({
          storeId: store._id,
          productId: product._id,
          quantity: Math.floor(Math.random() * 100) + 10,
          minQuantity: 5,
          purchasePrice,
          salePrice,
          barcode: `${store._id}-${product._id}`,
        });
      }
    }
    await ProductStore.create(productStores);
    console.log(`✅ ${productStores.length} relaciones Producto-Tienda creadas`);

    // Crear usuarios
    console.log('👨‍💼 Creando usuarios...');
    const users: any[] = [];
    // Admin
    users.push({
      firstName: 'Admin',
      lastName: 'Sistema',
      username: 'admin',
      email: 'admin@bellezapp.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      phone: '555-0000',
      role: 'admin',
      isActive: true,
    });

    // Manager y empleados para cada tienda
    for (const store of stores as IStore[]) {
      users.push({
        firstName: 'Gerente',
        lastName: (store as any).name,
        username: `manager-${(store._id).toString().slice(-6)}`,
        email: `manager-${(store._id).toString()}@bellezapp.com`,
        passwordHash: await bcrypt.hash('manager123', 10),
        phone: `555-${(store._id).toString().slice(-4)}`,
        role: 'manager',
        storeId: store._id,
        isActive: true,
      });

      for (let i = 0; i < 3; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        users.push({
          firstName,
          lastName,
          username: `employee-${(store._id).toString().slice(-6)}-${i}`,
          email: `employee-${(store._id).toString()}-${i}@bellezapp.com`,
          passwordHash: await bcrypt.hash('employee123', 10),
          phone: `555-${Math.floor(Math.random() * 10000)}`,
          role: 'employee',
          storeId: store._id,
          isActive: true,
        });
      }
    }
    const createdUsers = await User.create(users);
    console.log(`✅ ${createdUsers.length} usuarios creados`);

    // Crear clientes
    console.log('🛍️ Creando clientes...');
    const customers: any = [];
    for (const store of stores as IStore[]) {
      for (let i = 0; i < 15; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        customers.push({
          name: `${firstName} ${lastName}`,
          email: `customer-${(store._id).toString()}-${i}@example.com`,
          phone: `555-${Math.floor(Math.random() * 10000000)}`,
          address: `Calle ${i} ${(store as any).address}`,
          city: 'Ciudad Central',
          state: 'Estado',
          zipCode: '28000',
          country: 'País',
          storeId: store._id,
          notes: 'Cliente frecuente',
          isActive: true,
        });
      }
    }
    const createdCustomers = await Customer.create(customers) as unknown as any[];
    console.log(`✅ ${createdCustomers.length} clientes creados`);

    // Crear órdenes
    console.log('📋 Creando órdenes...');
    const orders: any[] = [];
    const today = new Date();
    for (const store of stores as IStore[]) {
      const storeCustomers = createdCustomers.filter(c => 
        (c.storeId as mongoose.Types.ObjectId).toString() === store._id.toString()
      ) as ICustomer[];
      const storeProducts = await ProductStore.find({ storeId: store._id });
      
      for (let i = 0; i < 30; i++) {
        const orderDate = new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        const items: any[] = [];
        const itemCount = Math.floor(Math.random() * 5) + 1;
        
        for (let j = 0; j < itemCount; j++) {
          const productStore = storeProducts[Math.floor(Math.random() * storeProducts.length)].toObject() as unknown as IProductStore;
          const quantity = Math.floor(Math.random() * 5) + 1;
          const price = productStore.price || 50;
          items.push({
            productId: productStore.productId,
            quantity,
            price,
            subtotal: price * quantity,
          });
        }
        
        const subtotal = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
        const tax = subtotal * 0.1;
        const total = subtotal + tax;

        orders.push({
          storeId: store._id,
          customerId: storeCustomers[Math.floor(Math.random() * storeCustomers.length)]._id,
          items,
          subtotal,
          tax,
          totalOrden: total,
          status: ['completed', 'pending', 'cancelled'][Math.floor(Math.random() * 3)],
          paymentMethod: ['efectivo', 'tarjeta', 'transferencia'][Math.floor(Math.random() * 3)],
          orderDate: orderDate,
          createdAt: orderDate,
        });
      }
    }
    const createdOrders = await Order.create(orders);
    console.log(`✅ ${createdOrders.length} órdenes creadas`);

    // Crear categorías de gastos
    console.log('💰 Creando categorías de gastos...');
    const expenseCategoriesData: any[] = [];
    for (const store of stores) {
      for (const name of expenseCategoryNames) {
        expenseCategoriesData.push({
          name: `${name} - ${(store as any).name}`,
          description: `Categoría de gastos: ${name}`,
          icon: `icon-${name.toLowerCase()}`,
          storeId: store._id,
        });
      }
    }
    const expenseCategories = await ExpenseCategory.create(expenseCategoriesData);
    console.log(`✅ ${expenseCategories.length} categorías de gastos creadas`);

    // Crear transacciones financieras (gastos e ingresos)
    console.log('💵 Creando transacciones financieras...');
    const transactions: any[] = [];
    for (const store of stores as IStore[]) {
      const storeOrders = createdOrders.filter(o => 
        (o.storeId as mongoose.Types.ObjectId).toString() === store._id.toString()
      ) as unknown as IOrder[];
      
      // Ingresos de órdenes
      for (const order of storeOrders) {
        if (order.status === 'completed') {
          transactions.push({
            type: 'income',
            amount: (order as any).totalOrden,
            description: `Orden completada - Total: $${((order as any).totalOrden).toFixed(2)}`,
            date: order.createdAt,
            storeId: store._id,
          });
        }
      }
      
      // Gastos
      for (let i = 0; i < 20; i++) {
        const expenseDate = new Date(today.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
        transactions.push({
          type: 'expense',
          amount: Math.floor(Math.random() * 500) + 50,
          description: `Gasto operacional`,
          categoryId: expenseCategories[Math.floor(Math.random() * expenseCategories.length)]._id,
          date: expenseDate,
          storeId: store._id,
        });
      }
    }
    const createdTransactions = await FinancialTransaction.create(transactions);
    console.log(`✅ ${createdTransactions.length} transacciones creadas`);

    // Resumen
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE SEED');
    console.log('='.repeat(50));
    console.log(`✅ Tiendas: ${stores.length}`);
    console.log(`✅ Usuarios: ${createdUsers.length}`);
    console.log(`✅ Clientes: ${createdCustomers.length}`);
    console.log(`✅ Categorías: ${categories.length}`);
    console.log(`✅ Proveedores: ${suppliers.length}`);
    console.log(`✅ Productos: ${products.length}`);
    console.log(`✅ ProductStore: ${productStores.length}`);
    console.log(`✅ Órdenes: ${createdOrders.length}`);
    console.log(`✅ Categorías Gastos: ${expenseCategories.length}`);
    console.log(`✅ Transacciones: ${createdTransactions.length}`);
    console.log('='.repeat(50));
    console.log(`🎉 TOTAL ITEMS: ${
      stores.length + createdUsers.length + createdCustomers.length + 
      categories.length + suppliers.length + products.length + productStores.length + 
      createdOrders.length + expenseCategories.length + createdTransactions.length
    }`);
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedDatabase();
