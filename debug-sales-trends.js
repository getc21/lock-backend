const mongoose = require('mongoose');
require('dotenv').config();

// Schema simplificado del Order
const orderSchema = new mongoose.Schema({
  totalOrden: Number,
  createdAt: Date,
  storeId: String,
  items: [{
    quantity: Number,
    price: Number
  }]
});

const Order = mongoose.model('Order', orderSchema);

async function debugSalesTrends() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp');
    console.log('✅ Conectado a MongoDB');

    // Contar total de órdenes
    const totalOrders = await Order.countDocuments();
    console.log(`📊 Total de órdenes en la base de datos: ${totalOrders}`);

    // Obtener algunas órdenes de muestra
    const sampleOrders = await Order.find().limit(5);
    console.log('\n📦 Órdenes de muestra:');
    sampleOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. ID: ${order._id}`);
      console.log(`     totalOrden: ${order.totalOrden} (tipo: ${typeof order.totalOrden})`);
      console.log(`     createdAt: ${order.createdAt}`);
      console.log(`     storeId: ${order.storeId}`);
      console.log(`     items: ${order.items?.length || 0} items`);
      if (order.items && order.items.length > 0) {
        const totalItemsValue = order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
        console.log(`     Valor calculado de items: ${totalItemsValue}`);
      }
      console.log('');
    });

    // Verificar órdenes por período reciente
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 30); // Últimos 30 días

    const recentOrders = await Order.find({
      createdAt: { $gte: recentDate }
    });
    
    console.log(`📅 Órdenes de los últimos 30 días: ${recentOrders.length}`);
    
    if (recentOrders.length > 0) {
      const totalRevenue = recentOrders.reduce((sum, order) => sum + (order.totalOrden || 0), 0);
      console.log(`💰 Ingresos totales últimos 30 días: ${totalRevenue}`);
      console.log(`📊 Promedio por orden: ${totalRevenue / recentOrders.length}`);
    }

    // Verificar diferentes campos que podrían contener el total
    const firstOrder = await Order.findOne();
    if (firstOrder) {
      console.log('\n🔍 Estructura completa de la primera orden:');
      console.log(JSON.stringify(firstOrder.toObject(), null, 2));
    }

    await mongoose.disconnect();
    console.log('\n✅ Desconectado de MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugSalesTrends();