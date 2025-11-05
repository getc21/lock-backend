const mongoose = require('mongoose');
require('dotenv').config();

const storeSchema = new mongoose.Schema({
  name: String,
  description: String,
  address: String,
  phone: String,
  email: String,
  isActive: Boolean
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' }
}, { timestamps: true });

const Store = mongoose.model('Store', storeSchema);
const Product = mongoose.model('Product', productSchema);

const checkStores = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp');
    console.log('✅ Conectado a MongoDB\n');
    
    // Listar todas las tiendas
    const stores = await Store.find({});
    console.log('🏪 TIENDAS DISPONIBLES:');
    console.log('=====================');
    for (const store of stores) {
      const productCount = await Product.countDocuments({ store: store._id });
      console.log(`📍 ${store.name}`);
      console.log(`   ID: ${store._id}`);
      console.log(`   Descripción: ${store.description || 'Sin descripción'}`);
      console.log(`   Productos: ${productCount}`);
      console.log(`   Activa: ${store.isActive ? 'Sí' : 'No'}`);
      console.log('-------------------');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

checkStores();