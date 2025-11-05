const mongoose = require('mongoose');

// Configuración de la base de datos
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp';

async function checkDiscounts() {
  try {
    console.log('🔄 Conectando a MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conectado a MongoDB');

    // Obtener colecciones
    const discountsCollection = mongoose.connection.db.collection('discounts');
    const storesCollection = mongoose.connection.db.collection('stores');

    // Verificar descuentos
    console.log('\n📋 VERIFICANDO DESCUENTOS:');
    const allDiscounts = await discountsCollection.find({}).toArray();
    console.log(`Total de descuentos en BD: ${allDiscounts.length}`);
    
    if (allDiscounts.length > 0) {
      console.log('\n📄 DESCUENTOS ENCONTRADOS:');
      allDiscounts.forEach((discount, index) => {
        console.log(`${index + 1}. ${discount.name}`);
        console.log(`   - ID: ${discount._id}`);
        console.log(`   - Tipo: ${discount.type}`);
        console.log(`   - Valor: ${discount.value}`);
        console.log(`   - Activo: ${discount.isActive}`);
        console.log(`   - StoreId: ${discount.storeId || 'NO ASIGNADO'}`);
        console.log(`   - Creado: ${discount.createdAt}`);
        console.log('');
      });
    }

    // Verificar tiendas
    console.log('\n🏪 VERIFICANDO TIENDAS:');
    const allStores = await storesCollection.find({}).toArray();
    console.log(`Total de tiendas en BD: ${allStores.length}`);
    
    if (allStores.length > 0) {
      console.log('\n🏢 TIENDAS ENCONTRADAS:');
      allStores.forEach((store, index) => {
        console.log(`${index + 1}. ${store.name}`);
        console.log(`   - ID: ${store._id}`);
        console.log(`   - Activa: ${store.isActive}`);
        console.log('');
      });
    }

    // Contar descuentos por tienda
    console.log('\n📊 DESCUENTOS POR TIENDA:');
    for (const store of allStores) {
      const discountCount = await discountsCollection.countDocuments({ storeId: store._id });
      console.log(`${store.name}: ${discountCount} descuentos`);
    }

    // Contar descuentos sin tienda
    const discountsWithoutStore = await discountsCollection.countDocuments({ storeId: { $exists: false } });
    console.log(`Sin tienda asignada: ${discountsWithoutStore} descuentos`);

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

// Ejecutar verificación
checkDiscounts();