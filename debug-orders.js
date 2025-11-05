const mongoose = require('mongoose');
require('dotenv').config();

const debugOrders = async () => {
  try {
    console.log('🔍 Debug de órdenes para reportes...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp');
    console.log('✅ Conectado a MongoDB\n');

    // Obtener una tienda para probar
    const stores = await mongoose.connection.db.collection('stores').find({}).toArray();
    const testStoreId = stores[0]._id;
    console.log(`🏪 Probando con tienda: ${stores[0].name} (ID: ${testStoreId})\n`);

    // 1. Verificar total de órdenes en la tienda
    const totalOrders = await mongoose.connection.db.collection('orders').countDocuments({ 
      storeId: new mongoose.Types.ObjectId(testStoreId) 
    });
    console.log(`📝 Total órdenes en la tienda: ${totalOrders}`);

    // 2. Verificar órdenes de octubre 2025
    const octoberStart = new Date('2025-10-01T00:00:00.000Z');
    const octoberEnd = new Date('2025-10-31T23:59:59.999Z');
    
    const octoberOrdersCreatedAt = await mongoose.connection.db.collection('orders').countDocuments({
      storeId: new mongoose.Types.ObjectId(testStoreId),
      createdAt: { $gte: octoberStart, $lte: octoberEnd }
    });
    
    const octoberOrdersOrderDate = await mongoose.connection.db.collection('orders').countDocuments({
      storeId: new mongoose.Types.ObjectId(testStoreId),
      orderDate: { $gte: octoberStart, $lte: octoberEnd }
    });
    
    console.log(`📅 Órdenes octubre 2025 (createdAt): ${octoberOrdersCreatedAt}`);
    console.log(`📅 Órdenes octubre 2025 (orderDate): ${octoberOrdersOrderDate}`);

    // 3. Verificar una orden ejemplo
    const exampleOrder = await mongoose.connection.db.collection('orders').findOne({
      storeId: new mongoose.Types.ObjectId(testStoreId)
    });
    
    if (exampleOrder) {
      console.log('\n📋 Ejemplo de orden:');
      console.log(`   _id: ${exampleOrder._id}`);
      console.log(`   orderDate: ${exampleOrder.orderDate}`);
      console.log(`   createdAt: ${exampleOrder.createdAt}`);
      console.log(`   totalOrden: ${exampleOrder.totalOrden}`);
      console.log(`   storeId: ${exampleOrder.storeId}`);
      console.log(`   items: ${exampleOrder.items?.length || 0}`);
      
      if (exampleOrder.items && exampleOrder.items.length > 0) {
        console.log(`   Primer item:`);
        console.log(`     productId: ${exampleOrder.items[0].productId}`);
        console.log(`     quantity: ${exampleOrder.items[0].quantity}`);
        console.log(`     price: ${exampleOrder.items[0].price}`);
      }
    }

    // 4. Verificar productos de la tienda
    const totalProducts = await mongoose.connection.db.collection('products').countDocuments({
      storeId: new mongoose.Types.ObjectId(testStoreId)
    });
    console.log(`\n📦 Total productos en la tienda: ${totalProducts}`);

    // 5. Probar consulta de reporte manualmente
    console.log('\n🔍 Simulando consulta de reporte...');
    
    const products = await mongoose.connection.db.collection('products').find({
      storeId: new mongoose.Types.ObjectId(testStoreId)
    }).limit(3).toArray();
    
    console.log(`📦 Productos encontrados: ${products.length}`);
    
    const orders = await mongoose.connection.db.collection('orders').find({
      storeId: new mongoose.Types.ObjectId(testStoreId),
      createdAt: { $gte: octoberStart, $lte: octoberEnd }
    }).toArray();
    
    console.log(`📝 Órdenes encontradas para reporte (createdAt): ${orders.length}`);
    
    // 6. Verificar si hay productos vendidos
    if (orders.length > 0 && products.length > 0) {
      const testProduct = products[0];
      console.log(`\n🧪 Probando con producto: ${testProduct.name} (ID: ${testProduct._id})`);
      
      let totalSold = 0;
      orders.forEach(order => {
        if (order.items) {
          order.items.forEach(item => {
            if (item.productId && item.productId.toString() === testProduct._id.toString()) {
              totalSold += item.quantity;
              console.log(`   ✅ Encontrada venta: ${item.quantity} unidades en orden ${order._id}`);
            }
          });
        }
      });
      
      console.log(`📊 Total vendido del producto '${testProduct.name}': ${totalSold} unidades`);
      console.log(`📊 Stock actual: ${testProduct.stock}`);
      
      if (totalSold > 0) {
        const rotationRate = totalSold / (testProduct.stock || 1);
        console.log(`📊 Tasa de rotación: ${rotationRate.toFixed(2)}`);
      } else {
        console.log('❌ No se encontraron ventas para este producto');
      }
    }

    // 7. Probar con orderDate en lugar de createdAt
    console.log('\n🔄 Probando con orderDate...');
    const ordersOrderDate = await mongoose.connection.db.collection('orders').find({
      storeId: new mongoose.Types.ObjectId(testStoreId),
      orderDate: { $gte: octoberStart, $lte: octoberEnd }
    }).toArray();
    
    console.log(`📝 Órdenes encontradas para reporte (orderDate): ${ordersOrderDate.length}`);

  } catch (error) {
    console.error('❌ Error durante debug:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

debugOrders();