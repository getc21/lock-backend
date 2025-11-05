const mongoose = require('mongoose');
require('dotenv').config();

// Esquemas
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  cost: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 5 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  location: { type: mongoose.Schema.Types.ObjectId, ref: 'Location' },
  barcode: String,
  image: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: String,
  phone: String,
  email: String,
  address: String,
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  address: String,
  phone: String,
  email: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Modelos
const Product = mongoose.model('Product', productSchema);
const Category = mongoose.model('Category', categorySchema);
const Supplier = mongoose.model('Supplier', supplierSchema);
const Store = mongoose.model('Store', storeSchema);
const Location = mongoose.model('Location', locationSchema);

// Productos adicionales para Santa Cruz
const santaCruzProductsData = [
  // Productos exclusivos para Santa Cruz
  { name: 'Tónico Facial Purificante', description: 'Tónico astringente para piel grasa', price: 22.50, cost: 11.25, stock: 20, category: 'Cuidado Facial', supplier: 'Beauty Supply Co.', location: 'Estante Principal', barcode: '7501234567921' },
  { name: 'Contorno de Ojos', description: 'Crema antiarrugas para contorno de ojos', price: 38.00, cost: 19.00, stock: 15, category: 'Cuidado Facial', supplier: 'Premium Beauty', location: 'Vitrina Frontal', barcode: '7501234567922' },
  { name: 'Delineador Líquido Negro', description: 'Delineador de larga duración', price: 18.50, cost: 9.25, stock: 25, category: 'Maquillaje', supplier: 'Cosmetics Wholesale', location: 'Mostrador', barcode: '7501234567923' },
  { name: 'Polvo Compacto', description: 'Polvo matificante con SPF', price: 32.00, cost: 16.00, stock: 18, category: 'Maquillaje', supplier: 'Beauty Trends', location: 'Vitrina Frontal', barcode: '7501234567924' },
  { name: 'Brillo Labial Transparente', description: 'Brillo con vitamina E', price: 16.00, cost: 8.00, stock: 30, category: 'Maquillaje', supplier: 'Global Cosmetics', location: 'Mostrador', barcode: '7501234567925' },
  { name: 'Champú Anticaspa', description: 'Champú medicado contra la caspa', price: 24.50, cost: 12.25, stock: 22, category: 'Cuidado Capilar', supplier: 'Premium Beauty', location: 'Estante Principal', barcode: '7501234567926' },
  { name: 'Crema para Peinar', description: 'Crema definidora de rizos', price: 19.99, cost: 10.00, stock: 28, category: 'Cuidado Capilar', supplier: 'Beauty Supply Co.', location: 'Estante Principal', barcode: '7501234567927' },
  { name: 'Serum Capilar Reparador', description: 'Tratamiento intensivo para cabello dañado', price: 45.00, cost: 22.50, stock: 12, category: 'Cuidado Capilar', supplier: 'Global Cosmetics', location: 'Vitrina Frontal', barcode: '7501234567928' },
  { name: 'Jabón Líquido Antibacterial', description: 'Jabón de manos con aroma a limón', price: 13.50, cost: 6.75, stock: 35, category: 'Cuidado Corporal', supplier: 'Beauty Trends', location: 'Estante Principal', barcode: '7501234567929' },
  { name: 'Crema Corporal Reafirmante', description: 'Crema con cafeína y centella asiática', price: 28.00, cost: 14.00, stock: 20, category: 'Cuidado Corporal', supplier: 'Premium Beauty', location: 'Vitrina Frontal', barcode: '7501234567930' },
  { name: 'Desodorante Roll-on', description: 'Protección 48 horas sin alcohol', price: 15.50, cost: 7.75, stock: 40, category: 'Cuidado Corporal', supplier: 'Beauty Supply Co.', location: 'Estante Principal', barcode: '7501234567931' },
  { name: 'Eau de Toilette Masculina', description: 'Fragancia fresca para hombre', price: 42.00, cost: 21.00, stock: 15, category: 'Fragancias', supplier: 'Global Cosmetics', location: 'Vitrina Frontal', barcode: '7501234567932' },
  { name: 'Spray Corporal Vanilla', description: 'Fragancia corporal dulce de vainilla', price: 19.50, cost: 9.75, stock: 25, category: 'Fragancias', supplier: 'Beauty Trends', location: 'Estante Principal', barcode: '7501234567933' },
  { name: 'Top Coat Brillante', description: 'Esmalte finalizador de alto brillo', price: 14.50, cost: 7.25, stock: 32, category: 'Uñas', supplier: 'Cosmetics Wholesale', location: 'Mostrador', barcode: '7501234567934' },
  { name: 'Aceite Cuticulas', description: 'Aceite nutritivo para cutículas', price: 11.00, cost: 5.50, stock: 28, category: 'Uñas', supplier: 'Beauty Supply Co.', location: 'Mostrador', barcode: '7501234567935' },
  { name: 'Kit Manicura Profesional', description: 'Set completo de herramientas', price: 35.00, cost: 17.50, stock: 10, category: 'Uñas', supplier: 'Premium Beauty', location: 'Vitrina Frontal', barcode: '7501234567936' },
  { name: 'Gel Reductor', description: 'Gel termogénico para abdomen', price: 55.00, cost: 27.50, stock: 12, category: 'Tratamientos', supplier: 'Global Cosmetics', location: 'Vitrina Frontal', barcode: '7501234567937' },
  { name: 'Mascarilla Detox Carbón', description: 'Mascarilla purificante de carbón activado', price: 18.99, cost: 9.50, stock: 22, category: 'Tratamientos', supplier: 'Beauty Trends', location: 'Almacén General', barcode: '7501234567938' },
  { name: 'Crema Blanqueadora', description: 'Crema aclarante de manchas', price: 65.00, cost: 32.50, stock: 8, category: 'Tratamientos', supplier: 'Premium Beauty', location: 'Vitrina Frontal', barcode: '7501234567939' },
  { name: 'Bálsamo Labial SPF 15', description: 'Protector labial con filtro solar', price: 9.50, cost: 4.75, stock: 45, category: 'Cuidado Facial', supplier: 'Beauty Supply Co.', location: 'Mostrador', barcode: '7501234567940' }
];

const distributeProducts = async () => {
  try {
    console.log('🚀 Iniciando distribución de productos...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp');
    console.log('✅ Conectado a MongoDB\n');

    // Obtener ambas tiendas
    const sucursalPrincipal = await Store.findOne({ name: 'Sucursal Principal' });
    const sucursalSantaCruz = await Store.findOne({ name: 'Sucursal Santa Cruz' });
    
    if (!sucursalPrincipal || !sucursalSantaCruz) {
      console.error('❌ No se encontraron ambas tiendas');
      return;
    }

    console.log(`📍 Sucursal Principal ID: ${sucursalPrincipal._id}`);
    console.log(`📍 Sucursal Santa Cruz ID: ${sucursalSantaCruz._id}\n`);

    // 1. Copiar algunos productos existentes a Santa Cruz (50% de los productos)
    console.log('📦 Copiando productos existentes a Sucursal Santa Cruz...');
    const existingProducts = await Product.find({ store: sucursalPrincipal._id }).populate('category supplier location');
    
    // Tomar la mitad de los productos para copiar a Santa Cruz
    const productsToCopy = existingProducts.slice(0, Math.ceil(existingProducts.length / 2));
    
    let copiedCount = 0;
    for (const product of productsToCopy) {
      // Verificar si ya existe en Santa Cruz
      const existsInSantaCruz = await Product.findOne({ 
        name: product.name, 
        store: sucursalSantaCruz._id 
      });
      
      if (existsInSantaCruz) {
        console.log(`   ⚠️ Ya existe en Santa Cruz: ${product.name}`);
        continue;
      }

      // Buscar o crear categoría equivalente en Santa Cruz
      let category = await Category.findOne({ 
        name: product.category.name, 
        store: sucursalSantaCruz._id 
      });
      if (!category) {
        category = await Category.create({
          name: product.category.name,
          description: product.category.description,
          store: sucursalSantaCruz._id
        });
      }

      // Buscar o crear proveedor equivalente en Santa Cruz
      let supplier = await Supplier.findOne({ 
        name: product.supplier.name, 
        store: sucursalSantaCruz._id 
      });
      if (!supplier) {
        supplier = await Supplier.create({
          name: product.supplier.name,
          contact: product.supplier.contact,
          phone: product.supplier.phone,
          email: product.supplier.email,
          address: product.supplier.address,
          store: sucursalSantaCruz._id
        });
      }

      // Buscar o crear ubicación equivalente en Santa Cruz
      let location = await Location.findOne({ 
        name: product.location.name, 
        store: sucursalSantaCruz._id 
      });
      if (!location) {
        location = await Location.create({
          name: product.location.name,
          description: product.location.description,
          store: sucursalSantaCruz._id
        });
      }

      // Crear producto en Santa Cruz con stock diferente
      await Product.create({
        name: product.name,
        description: product.description,
        price: product.price,
        cost: product.cost,
        stock: Math.floor(product.stock * 0.7), // 70% del stock original
        minStock: product.minStock,
        category: category._id,
        supplier: supplier._id,
        store: sucursalSantaCruz._id,
        location: location._id,
        barcode: product.barcode ? product.barcode.replace(/(\d+)$/, (match) => String(parseInt(match) + 1000)) : undefined,
        isActive: true
      });

      console.log(`   ✅ Copiado: ${product.name}`);
      copiedCount++;
    }

    // 2. Crear productos exclusivos para Santa Cruz
    console.log('\n🛍️ Creando productos exclusivos para Sucursal Santa Cruz...');
    
    let exclusiveCount = 0;
    for (const productData of santaCruzProductsData) {
      // Verificar si ya existe
      const existingProduct = await Product.findOne({ 
        name: productData.name, 
        store: sucursalSantaCruz._id 
      });

      if (existingProduct) {
        console.log(`   ⚠️ Producto ya existe: ${productData.name}`);
        continue;
      }

      // Buscar o crear referencias necesarias
      let category = await Category.findOne({ 
        name: productData.category, 
        store: sucursalSantaCruz._id 
      });
      if (!category) {
        category = await Category.create({
          name: productData.category,
          description: `Productos de ${productData.category}`,
          store: sucursalSantaCruz._id
        });
      }

      let supplier = await Supplier.findOne({ 
        name: productData.supplier, 
        store: sucursalSantaCruz._id 
      });
      if (!supplier) {
        supplier = await Supplier.create({
          name: productData.supplier,
          contact: 'Contacto General',
          phone: '555-0100',
          email: `info@${productData.supplier.toLowerCase().replace(/\s+/g, '')}.com`,
          store: sucursalSantaCruz._id
        });
      }

      let location = await Location.findOne({ 
        name: productData.location, 
        store: sucursalSantaCruz._id 
      });
      if (!location) {
        location = await Location.create({
          name: productData.location,
          description: `Ubicación ${productData.location}`,
          store: sucursalSantaCruz._id
        });
      }

      // Crear producto exclusivo
      await Product.create({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        cost: productData.cost,
        stock: productData.stock,
        minStock: 5,
        category: category._id,
        supplier: supplier._id,
        store: sucursalSantaCruz._id,
        location: location._id,
        barcode: productData.barcode,
        isActive: true
      });

      console.log(`   ✅ ${productData.name} - $${productData.price} (Stock: ${productData.stock})`);
      exclusiveCount++;
    }

    // 3. Mostrar resumen final
    console.log('\n📊 RESUMEN FINAL:');
    console.log('==================');
    
    const principalProductCount = await Product.countDocuments({ store: sucursalPrincipal._id });
    const santaCruzProductCount = await Product.countDocuments({ store: sucursalSantaCruz._id });
    
    console.log(`🏪 Sucursal Principal: ${principalProductCount} productos`);
    console.log(`🏪 Sucursal Santa Cruz: ${santaCruzProductCount} productos`);
    console.log(`📦 Productos copiados: ${copiedCount}`);
    console.log(`✨ Productos exclusivos creados: ${exclusiveCount}`);
    
    console.log('\n🎉 Distribución completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la distribución:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

distributeProducts();