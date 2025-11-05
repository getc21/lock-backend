const mongoose = require('mongoose');
require('dotenv').config();

const checkProducts = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp');
    console.log('✅ Conectado a MongoDB');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, {strict: false}));
    
    const products = await Product.find().limit(3);
    
    console.log('\n📦 PRODUCTOS EN LA BASE DE DATOS:');
    products.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   Weight: ${product.weight || 'NO DEFINIDO'}`);
      console.log(`   Estructura completa:`, JSON.stringify(product, null, 2));
    });
    
    const totalProducts = await Product.countDocuments();
    const productsWithWeight = await Product.countDocuments({ weight: { $exists: true, $ne: null, $ne: '' } });
    
    console.log(`\n📊 RESUMEN:`);
    console.log(`Total de productos: ${totalProducts}`);
    console.log(`Productos con weight definido: ${productsWithWeight}`);
    console.log(`Productos sin weight: ${totalProducts - productsWithWeight}`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

checkProducts();