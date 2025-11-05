const mongoose = require('mongoose');

// Configuración de la base de datos
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp';

async function moveDiscountsToCurrentStore() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Obtener colecciones
    const discountsCollection = mongoose.connection.db.collection('discounts');
    const storesCollection = mongoose.connection.db.collection('stores');

    // Tienda destino (Sucursal Santa Cruz donde el usuario está operando)
    const targetStoreId = '690108925f4e5f352cb561d7';
    const targetStore = await storesCollection.findOne({ _id: new mongoose.Types.ObjectId(targetStoreId) });
    
    if (!targetStore) {
      console.log('❌ No se encontró la tienda destino');
      return;
    }

    console.log(`🎯 Moviendo descuentos a: ${targetStore.name} (${targetStoreId})`);

    // Mover todos los descuentos a la tienda actual
    const result = await discountsCollection.updateMany(
      { storeId: { $ne: new mongoose.Types.ObjectId(targetStoreId) } },
      { $set: { storeId: new mongoose.Types.ObjectId(targetStoreId) } }
    );

    console.log(`✅ Descuentos movidos: ${result.modifiedCount}`);

    // Verificar resultado
    const discountsInTargetStore = await discountsCollection.countDocuments({ 
      storeId: new mongoose.Types.ObjectId(targetStoreId) 
    });
    console.log(`📊 Total descuentos en ${targetStore.name}: ${discountsInTargetStore}`);

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar migración
moveDiscountsToCurrentStore();