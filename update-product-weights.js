const mongoose = require('mongoose');
require('dotenv').config();

const updateProductWeights = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp');
    console.log('✅ Conectado a MongoDB');
    
    const Product = mongoose.model('Product', new mongoose.Schema({}, {strict: false}));
    
    // Obtener productos sin weight definido
    const productsWithoutWeight = await Product.find({
      $or: [
        { weight: { $exists: false } },
        { weight: null },
        { weight: '' }
      ]
    });
    
    console.log(`📦 Encontrados ${productsWithoutWeight.length} productos sin tamaño definido`);
    
    if (productsWithoutWeight.length === 0) {
      console.log('✅ Todos los productos ya tienen tamaño definido');
      mongoose.disconnect();
      return;
    }
    
    // Función para generar pesos apropiados según el tipo de producto
    const generateWeight = (productName) => {
      const name = productName.toLowerCase();
      
      if (name.includes('shampoo') || name.includes('champú')) {
        return Math.random() > 0.5 ? '250ml' : '500ml';
      } else if (name.includes('perfume') || name.includes('fragancia')) {
        return Math.random() > 0.5 ? '50ml' : '100ml';
      } else if (name.includes('crema') || name.includes('locion') || name.includes('loción')) {
        return Math.random() > 0.5 ? '100ml' : '200ml';
      } else if (name.includes('jabon') || name.includes('jabón')) {
        return Math.random() > 0.5 ? '100g' : '150g';
      } else if (name.includes('maquillaje') || name.includes('labial') || name.includes('rimel')) {
        return Math.random() > 0.5 ? '15g' : '30g';
      } else if (name.includes('aceite')) {
        return Math.random() > 0.5 ? '30ml' : '60ml';
      } else if (name.includes('polvo') || name.includes('talco')) {
        return Math.random() > 0.5 ? '100g' : '200g';
      } else {
        // Valores genéricos para productos de belleza
        const weights = ['50g', '100g', '150g', '200g', '30ml', '50ml', '100ml', '200ml', '250ml'];
        return weights[Math.floor(Math.random() * weights.length)];
      }
    };
    
    let updated = 0;
    
    for (const product of productsWithoutWeight) {
      const newWeight = generateWeight(product.name);
      
      await Product.updateOne(
        { _id: product._id },
        { $set: { weight: newWeight } }
      );
      
      console.log(`✅ ${product.name}: ${newWeight}`);
      updated++;
    }
    
    console.log(`\n🎉 Actualizados ${updated} productos con valores de tamaño`);
    
    // Verificar los cambios
    const totalProducts = await Product.countDocuments();
    const productsWithWeight = await Product.countDocuments({ 
      weight: { $exists: true, $ne: null, $ne: '' } 
    });
    
    console.log(`\n📊 RESUMEN FINAL:`);
    console.log(`Total de productos: ${totalProducts}`);
    console.log(`Productos con weight definido: ${productsWithWeight}`);
    console.log(`Productos sin weight: ${totalProducts - productsWithWeight}`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
  }
};

updateProductWeights();