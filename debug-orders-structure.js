const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/bellezapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schemas simples para debugging
const OrderSchema = new mongoose.Schema({
  items: [{ 
    productId: mongoose.Schema.Types.ObjectId,
    quantity: Number, 
    price: Number 
  }],
  storeId: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  orderDate: Date
});

const ProductSchema = new mongoose.Schema({
  name: String,
  storeId: mongoose.Schema.Types.ObjectId,
  stock: Number
});

const Order = mongoose.model('Order', OrderSchema);
const Product = mongoose.model('Product', ProductSchema);

async function debugOrderStructure() {
  console.log('🔍 Debugging order structure...');
  
  const storeId = '6901081d5f4e5f352cb561d5';
  
  // Obtener una orden específica
  const sampleOrder = await Order.findOne({ storeId }).lean();
  
  if (sampleOrder) {
    console.log('📋 Sample order structure:');
    console.log('  Order ID:', sampleOrder._id);
    console.log('  Items count:', sampleOrder.items.length);
    console.log('  First item:', JSON.stringify(sampleOrder.items[0], null, 2));
    console.log('  All items:');
    sampleOrder.items.forEach((item, index) => {
      console.log(`    Item ${index + 1}:`, {
        productId: item.productId,
        productIdType: typeof item.productId,
        quantity: item.quantity,
        price: item.price
      });
    });
  }
  
  // Buscar un producto específico
  const jabonProduct = await Product.findOne({ name: 'Jabon', storeId }).lean();
  console.log('\n🧼 Jabon product:');
  console.log('  Product ID:', jabonProduct?._id);
  console.log('  Product ID type:', typeof jabonProduct?._id);
  
  // Buscar órdenes con ese producto
  if (jabonProduct) {
    const ordersWithJabon = await Order.find({
      storeId,
      'items.productId': jabonProduct._id
    }).lean();
    
    console.log(`\n📦 Orders containing Jabon: ${ordersWithJabon.length}`);
    
    ordersWithJabon.forEach((order, index) => {
      const jabonItems = order.items.filter(item => 
        item.productId.toString() === jabonProduct._id.toString()
      );
      console.log(`  Order ${index + 1} (${order._id}): ${jabonItems.length} jabon items`);
      jabonItems.forEach(item => {
        console.log(`    - Quantity: ${item.quantity}, Price: ${item.price}`);
      });
    });
  }
  
  // Probar con populate
  console.log('\n🔗 Testing with populate...');
  const populatedOrders = await Order.find({ storeId }).populate('items.productId').limit(3);
  
  populatedOrders.forEach((order, index) => {
    console.log(`\nPopulated Order ${index + 1}:`);
    console.log('  Items with population:');
    order.items.forEach((item, itemIndex) => {
      console.log(`    Item ${itemIndex + 1}:`, {
        productId: item.productId,
        productIdIsObject: typeof item.productId === 'object',
        productName: item.productId?.name || 'Not populated',
        quantity: item.quantity
      });
    });
  });
  
  mongoose.disconnect();
}

debugOrderStructure().catch(console.error);