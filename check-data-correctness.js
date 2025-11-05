const mongoose = require('mongoose');
require('dotenv').config();

const checkDataCorrectness = async () => {
  try {
    console.log('🔍 Verificando corrección de datos...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp');
    console.log('✅ Conectado a MongoDB\n');

    // Verificar productos
    console.log('📦 VERIFICANDO PRODUCTOS:');
    const products = await mongoose.connection.db.collection('products').find({}).limit(5).toArray();
    
    if (products.length > 0) {
      console.log('✅ Productos encontrados:', products.length);
      console.log('📋 Ejemplo de producto:');
      const example = products[0];
      console.log(`   Nombre: ${example.name}`);
      console.log(`   Precio venta: ${example.salePrice}`);
      console.log(`   Precio compra: ${example.purchasePrice}`);
      console.log(`   Stock: ${example.stock}`);
      console.log(`   Tienda: ${example.storeId}`);
      console.log(`   Categoría: ${example.categoryId}`);
      console.log(`   Proveedor: ${example.supplierId}`);
      console.log(`   Ubicación: ${example.locationId}`);
    } else {
      console.log('❌ No se encontraron productos');
    }

    // Verificar órdenes
    console.log('\n📝 VERIFICANDO ÓRDENES:');
    const orders = await mongoose.connection.db.collection('orders').find({}).limit(5).toArray();
    
    if (orders.length > 0) {
      console.log('✅ Órdenes encontradas:', orders.length);
      console.log('📋 Ejemplo de orden:');
      const example = orders[0];
      console.log(`   Fecha: ${example.orderDate || example.createdAt}`);
      console.log(`   Total: ${example.totalOrden}`);
      console.log(`   Método pago: ${example.paymentMethod}`);
      console.log(`   Tienda: ${example.storeId}`);
      console.log(`   Cliente: ${example.customerId}`);
      console.log(`   Items: ${example.items?.length || 0}`);
      if (example.items && example.items.length > 0) {
        console.log(`   Primer item - Producto: ${example.items[0].productId}, Cantidad: ${example.items[0].quantity}, Precio: ${example.items[0].price}`);
      }
    } else {
      console.log('❌ No se encontraron órdenes');
    }

    // Verificar categorías
    console.log('\n🏷️ VERIFICANDO CATEGORÍAS:');
    const categories = await mongoose.connection.db.collection('categories').find({}).limit(3).toArray();
    
    if (categories.length > 0) {
      console.log('✅ Categorías encontradas:', categories.length);
      categories.forEach(cat => {
        console.log(`   ${cat.name} (Tienda: ${cat.storeId})`);
      });
    } else {
      console.log('❌ No se encontraron categorías');
    }

    // Verificar conteos por tienda
    console.log('\n🏪 CONTEOS POR TIENDA:');
    const stores = await mongoose.connection.db.collection('stores').find({}).toArray();
    
    for (const store of stores) {
      console.log(`\n📍 ${store.name} (ID: ${store._id}):`);
      
      const productCount = await mongoose.connection.db.collection('products').countDocuments({ storeId: store._id });
      const orderCount = await mongoose.connection.db.collection('orders').countDocuments({ storeId: store._id });
      const customerCount = await mongoose.connection.db.collection('customers').countDocuments({ storeId: store._id });
      const categoryCount = await mongoose.connection.db.collection('categories').countDocuments({ storeId: store._id });
      
      console.log(`   📦 Productos: ${productCount}`);
      console.log(`   📝 Órdenes: ${orderCount}`);
      console.log(`   👥 Clientes: ${customerCount}`);
      console.log(`   🏷️ Categorías: ${categoryCount}`);
    }

    console.log('\n✅ Verificación completada');

  } catch (error) {
    console.error('❌ Error durante la verificación:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

checkDataCorrectness();