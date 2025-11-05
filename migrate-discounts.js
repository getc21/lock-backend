const mongoose = require('mongoose');

// Configuración de la base de datos
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp';

async function migrateDiscounts() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Obtener colecciones
    const discountsCollection = mongoose.connection.db.collection('discounts');
    const storesCollection = mongoose.connection.db.collection('stores');

    // Verificar si hay descuentos sin storeId
    const discountsWithoutStore = await discountsCollection.countDocuments({ storeId: { $exists: false } });
    console.log(`📋 Descuentos sin storeId: ${discountsWithoutStore}`);

    if (discountsWithoutStore === 0) {
      console.log('✅ Todos los descuentos ya tienen storeId asignado');
      return;
    }

    // Obtener la primera tienda disponible
    const firstStore = await storesCollection.findOne({});
    if (!firstStore) {
      console.log('❌ No se encontraron tiendas en la base de datos');
      return;
    }

    console.log(`🏪 Asignando descuentos a la tienda: ${firstStore.name} (${firstStore._id})`);

    // Actualizar todos los descuentos sin storeId
    const result = await discountsCollection.updateMany(
      { storeId: { $exists: false } },
      { $set: { storeId: firstStore._id } }
    );

    console.log(`✅ Migración completada:`);
    console.log(`   - Descuentos actualizados: ${result.modifiedCount}`);
    console.log(`   - Descuentos coincidentes: ${result.matchedCount}`);

    // Verificar el resultado
    const remainingWithoutStore = await discountsCollection.countDocuments({ storeId: { $exists: false } });
    console.log(`📋 Descuentos restantes sin storeId: ${remainingWithoutStore}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar migración
migrateDiscounts();