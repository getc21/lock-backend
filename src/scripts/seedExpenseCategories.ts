import mongoose from 'mongoose';
import { ExpenseCategory } from '../models/ExpenseCategory';
import { connectDatabase } from '../config/database';

const DEFAULT_CATEGORIES = [
  {
    name: 'Limpieza',
    description: 'Productos y servicios de limpieza',
    icon: 'broom'
  },
  {
    name: 'Mantenimiento',
    description: 'Reparaciones y mantenimiento de equipos',
    icon: 'wrench'
  },
  {
    name: 'Servicios',
    description: 'Servicios profesionales y consultoría',
    icon: 'briefcase'
  },
  {
    name: 'Suministros',
    description: 'Materiales y suministros de oficina',
    icon: 'package'
  },
  {
    name: 'Utilidades',
    description: 'Servicios de agua, luz, internet, etc.',
    icon: 'bolt'
  },
  {
    name: 'Nómina',
    description: 'Salarios y beneficios de empleados',
    icon: 'dollar-sign'
  },
  {
    name: 'Impuestos',
    description: 'Impuestos, licencias y permisos',
    icon: 'file-text'
  },
  {
    name: 'Marketing',
    description: 'Publicidad y materiales promocionales',
    icon: 'megaphone'
  },
  {
    name: 'Otros',
    description: 'Otros gastos no clasificados',
    icon: 'dots'
  }
];

async function seedExpenseCategories() {
  try {
    await connectDatabase();
    console.log('✅ Database connected');

    // Para cada tienda existente, crear las categorías
    const stores = await mongoose.connection.collection('stores').find({}).toArray();
    
    if (stores.length === 0) {
      console.log('⚠️  No stores found. Creating default categories for demo...');
      // Crear una tienda demo si no existe
      const storeCollection = mongoose.connection.collection('stores');
      const store = await storeCollection.insertOne({
        name: 'Tienda Principal',
        address: 'Calle Principal 123',
        phone: '555-0000',
        email: 'info@store.com',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      stores.push({ _id: store.insertedId });
    }

    let createdCount = 0;
    for (const store of stores) {
      for (const category of DEFAULT_CATEGORIES) {
        const exists = await ExpenseCategory.findOne({
          name: category.name,
          storeId: store._id
        });

        if (!exists) {
          await ExpenseCategory.create({
            ...category,
            storeId: store._id,
            isActive: true
          });
          createdCount++;
        }
      }
    }

    console.log(`✅ Seeding completado: ${createdCount} categorías creadas`);
    
    // Mostrar resumen
    const allCategories = await ExpenseCategory.find({});
    console.log(`📊 Total de categorías en la BD: ${allCategories.length}`);
    console.log(`🏪 Total de tiendas: ${stores.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante seeding:', error);
    process.exit(1);
  }
}

seedExpenseCategories();
