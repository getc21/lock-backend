const mongoose = require('mongoose');
require('dotenv').config();

// Esquemas básicos
const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'card', 'transfer', 'mixed'], 
    default: 'cash' 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'cancelled'], 
    default: 'completed' 
  },
  notes: String,
  cashRegister: { type: mongoose.Schema.Types.ObjectId, ref: 'CashRegister' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  address: String,
  phone: String,
  email: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
const Store = mongoose.model('Store', storeSchema);

const analyzeOrders = async () => {
  try {
    console.log('📊 Analizando órdenes creadas...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp');
    console.log('✅ Conectado a MongoDB\n');

    const stores = await Store.find({});
    
    console.log('📈 ANÁLISIS DETALLADO POR TIENDA:');
    console.log('═'.repeat(60));

    for (const store of stores) {
      console.log(`\n🏪 ${store.name.toUpperCase()}`);
      console.log('─'.repeat(40));

      // Estadísticas básicas
      const totalOrders = await Order.countDocuments({ store: store._id });
      const completedOrders = await Order.countDocuments({ store: store._id, status: 'completed' });
      const cancelledOrders = await Order.countDocuments({ store: store._id, status: 'cancelled' });

      console.log(`📦 Total órdenes: ${totalOrders}`);
      console.log(`✅ Completadas: ${completedOrders} (${((completedOrders/totalOrders)*100).toFixed(1)}%)`);
      console.log(`❌ Canceladas: ${cancelledOrders} (${((cancelledOrders/totalOrders)*100).toFixed(1)}%)`);

      // Ingresos
      const revenueStats = await Order.aggregate([
        { $match: { store: store._id, status: 'completed' } },
        { 
          $group: { 
            _id: null, 
            totalRevenue: { $sum: '$total' },
            avgOrderValue: { $avg: '$total' },
            maxOrder: { $max: '$total' },
            minOrder: { $min: '$total' }
          } 
        }
      ]);

      if (revenueStats.length > 0) {
        const stats = revenueStats[0];
        console.log(`💰 Ingresos totales: $${stats.totalRevenue.toFixed(2)}`);
        console.log(`📊 Ticket promedio: $${stats.avgOrderValue.toFixed(2)}`);
        console.log(`🔝 Venta más alta: $${stats.maxOrder.toFixed(2)}`);
        console.log(`🔻 Venta más baja: $${stats.minOrder.toFixed(2)}`);
      }

      // Métodos de pago
      const paymentMethods = await Order.aggregate([
        { $match: { store: store._id, status: 'completed' } },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
        { $sort: { count: -1 } }
      ]);

      console.log(`\n💳 Métodos de pago:`);
      paymentMethods.forEach(method => {
        const percentage = ((method.count / completedOrders) * 100).toFixed(1);
        console.log(`   ${method._id}: ${method.count} órdenes (${percentage}%) - $${method.revenue.toFixed(2)}`);
      });

      // Distribución por fechas (primeros 5 días con más ventas)
      const dailySales = await Order.aggregate([
        { $match: { store: store._id, status: 'completed' } },
        { 
          $group: { 
            _id: { 
              day: { $dayOfMonth: '$createdAt' },
              month: { $month: '$createdAt' },
              year: { $year: '$createdAt' }
            },
            orders: { $sum: 1 },
            revenue: { $sum: '$total' }
          } 
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]);

      console.log(`\n📅 Top 5 días con mayores ventas:`);
      dailySales.forEach((day, index) => {
        console.log(`   ${index + 1}. ${day._id.day}/${day._id.month}/${day._id.year}: ${day.orders} órdenes - $${day.revenue.toFixed(2)}`);
      });

      // Productos más vendidos (top 5)
      const topProducts = await Order.aggregate([
        { $match: { store: store._id, status: 'completed' } },
        { $unwind: '$items' },
        { 
          $group: { 
            _id: '$items.product',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: '$items.subtotal' },
            orderCount: { $sum: 1 }
          } 
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: 5 },
        { 
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' }
      ]);

      console.log(`\n🏆 Top 5 productos más vendidos:`);
      topProducts.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.product.name}: ${item.totalQuantity} unidades - $${item.totalRevenue.toFixed(2)}`);
      });
    }

    // Comparativa entre tiendas
    console.log(`\n\n🔄 COMPARATIVA ENTRE TIENDAS:`);
    console.log('═'.repeat(50));
    
    const comparison = await Order.aggregate([
      { $match: { status: 'completed' } },
      { 
        $group: { 
          _id: '$store',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          avgTicket: { $avg: '$total' }
        } 
      },
      { 
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: '_id',
          as: 'store'
        }
      },
      { $unwind: '$store' },
      { $sort: { totalRevenue: -1 } }
    ]);

    comparison.forEach((store, index) => {
      console.log(`${index + 1}. ${store.store.name}:`);
      console.log(`   📦 Órdenes: ${store.totalOrders}`);
      console.log(`   💰 Ingresos: $${store.totalRevenue.toFixed(2)}`);
      console.log(`   📊 Ticket promedio: $${store.avgTicket.toFixed(2)}`);
      console.log('');
    });

    console.log('🎯 ¡Datos perfectos para probar los reportes avanzados!');

  } catch (error) {
    console.error('❌ Error durante el análisis:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

analyzeOrders();