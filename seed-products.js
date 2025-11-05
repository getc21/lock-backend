const mongoose = require('mongoose');
require('dotenv').config();

// Conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp');
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
};

// Esquemas (definidos directamente aquí para simplicidad)
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

// Datos de productos de belleza
const beautyCategoriesData = [
  { name: 'Cuidado Facial', description: 'Productos para el cuidado del rostro' },
  { name: 'Maquillaje', description: 'Productos de maquillaje y cosmética' },
  { name: 'Cuidado Capilar', description: 'Productos para el cabello' },
  { name: 'Cuidado Corporal', description: 'Productos para el cuerpo' },
  { name: 'Fragancias', description: 'Perfumes y colonias' },
  { name: 'Uñas', description: 'Productos para el cuidado de uñas' },
  { name: 'Tratamientos', description: 'Tratamientos especiales de belleza' }
];

const beautySuppliersData = [
  { name: 'Beauty Supply Co.', contact: 'Ana García', phone: '555-0101', email: 'ana@beautysupply.com' },
  { name: 'Cosmetics Wholesale', contact: 'Carlos Ruiz', phone: '555-0102', email: 'carlos@cosmeticswh.com' },
  { name: 'Premium Beauty', contact: 'María López', phone: '555-0103', email: 'maria@premiumbeauty.com' },
  { name: 'Global Cosmetics', contact: 'José Martínez', phone: '555-0104', email: 'jose@globalcosmetics.com' },
  { name: 'Beauty Trends', contact: 'Laura Sánchez', phone: '555-0105', email: 'laura@beautytrends.com' }
];

const beautyLocationsData = [
  { name: 'Estante Principal', description: 'Productos más vendidos' },
  { name: 'Vitrina Frontal', description: 'Productos premium en exhibición' },
  { name: 'Almacén General', description: 'Stock principal' },
  { name: 'Área de Descuentos', description: 'Productos en promoción' },
  { name: 'Mostrador', description: 'Productos de impulso' }
];

const beautyProductsData = [
  // Cuidado Facial
  { name: 'Crema Hidratante Facial', description: 'Crema hidratante para todo tipo de piel', price: 29.99, cost: 15.00, stock: 25, category: 'Cuidado Facial', supplier: 'Beauty Supply Co.', location: 'Estante Principal', barcode: '7501234567890' },
  { name: 'Limpiador Facial Espumoso', description: 'Gel limpiador suave para rostro', price: 19.99, cost: 10.00, stock: 30, category: 'Cuidado Facial', supplier: 'Premium Beauty', location: 'Estante Principal', barcode: '7501234567891' },
  { name: 'Sérum Vitamina C', description: 'Sérum antioxidante con vitamina C', price: 45.00, cost: 22.50, stock: 15, category: 'Cuidado Facial', supplier: 'Global Cosmetics', location: 'Vitrina Frontal', barcode: '7501234567892' },
  { name: 'Protector Solar SPF 50', description: 'Protector solar facial de amplio espectro', price: 35.00, cost: 18.00, stock: 20, category: 'Cuidado Facial', supplier: 'Beauty Supply Co.', location: 'Estante Principal', barcode: '7501234567893' },
  { name: 'Mascarilla de Arcilla', description: 'Mascarilla purificante de arcilla verde', price: 25.00, cost: 12.50, stock: 18, category: 'Cuidado Facial', supplier: 'Premium Beauty', location: 'Almacén General', barcode: '7501234567894' },

  // Maquillaje
  { name: 'Base de Maquillaje Líquida', description: 'Base de cobertura media a completa', price: 42.00, cost: 21.00, stock: 22, category: 'Maquillaje', supplier: 'Cosmetics Wholesale', location: 'Vitrina Frontal', barcode: '7501234567895' },
  { name: 'Corrector de Ojeras', description: 'Corrector de alta cobertura', price: 28.00, cost: 14.00, stock: 28, category: 'Maquillaje', supplier: 'Beauty Trends', location: 'Vitrina Frontal', barcode: '7501234567896' },
  { name: 'Paleta de Sombras', description: 'Paleta de 12 sombras neutras', price: 38.00, cost: 19.00, stock: 16, category: 'Maquillaje', supplier: 'Global Cosmetics', location: 'Vitrina Frontal', barcode: '7501234567897' },
  { name: 'Máscara de Pestañas', description: 'Máscara voluminizadora resistente al agua', price: 24.00, cost: 12.00, stock: 35, category: 'Maquillaje', supplier: 'Beauty Supply Co.', location: 'Mostrador', barcode: '7501234567898' },
  { name: 'Labial Mate', description: 'Labial de larga duración acabado mate', price: 22.00, cost: 11.00, stock: 40, category: 'Maquillaje', supplier: 'Beauty Trends', location: 'Mostrador', barcode: '7501234567899' },
  { name: 'Rubor en Polvo', description: 'Rubor compacto de larga duración', price: 26.00, cost: 13.00, stock: 20, category: 'Maquillaje', supplier: 'Cosmetics Wholesale', location: 'Vitrina Frontal', barcode: '7501234567900' },

  // Cuidado Capilar
  { name: 'Shampoo Reparador', description: 'Shampoo para cabello dañado', price: 18.50, cost: 9.25, stock: 32, category: 'Cuidado Capilar', supplier: 'Premium Beauty', location: 'Estante Principal', barcode: '7501234567901' },
  { name: 'Acondicionador Hidratante', description: 'Acondicionador para cabello seco', price: 20.00, cost: 10.00, stock: 28, category: 'Cuidado Capilar', supplier: 'Premium Beauty', location: 'Estante Principal', barcode: '7501234567902' },
  { name: 'Mascarilla Capilar', description: 'Tratamiento intensivo para cabello', price: 32.00, cost: 16.00, stock: 15, category: 'Cuidado Capilar', supplier: 'Global Cosmetics', location: 'Almacén General', barcode: '7501234567903' },
  { name: 'Aceite para Cabello', description: 'Aceite nutritivo de argán', price: 28.50, cost: 14.25, stock: 22, category: 'Cuidado Capilar', supplier: 'Beauty Supply Co.', location: 'Estante Principal', barcode: '7501234567904' },
  { name: 'Spray Termoprotector', description: 'Protector térmico para peinado', price: 24.50, cost: 12.25, stock: 25, category: 'Cuidado Capilar', supplier: 'Beauty Trends', location: 'Estante Principal', barcode: '7501234567905' },

  // Cuidado Corporal
  { name: 'Loción Corporal Hidratante', description: 'Loción hidratante de absorción rápida', price: 16.99, cost: 8.50, stock: 30, category: 'Cuidado Corporal', supplier: 'Beauty Supply Co.', location: 'Estante Principal', barcode: '7501234567906' },
  { name: 'Gel de Ducha Aromático', description: 'Gel de ducha con fragancia floral', price: 14.50, cost: 7.25, stock: 35, category: 'Cuidado Corporal', supplier: 'Premium Beauty', location: 'Estante Principal', barcode: '7501234567907' },
  { name: 'Exfoliante Corporal', description: 'Scrub exfoliante con sal marina', price: 22.00, cost: 11.00, stock: 18, category: 'Cuidado Corporal', supplier: 'Global Cosmetics', location: 'Almacén General', barcode: '7501234567908' },
  { name: 'Crema para Manos', description: 'Crema nutritiva para manos secas', price: 12.50, cost: 6.25, stock: 45, category: 'Cuidado Corporal', supplier: 'Beauty Trends', location: 'Mostrador', barcode: '7501234567909' },
  { name: 'Aceite Corporal', description: 'Aceite hidratante con vitamina E', price: 26.00, cost: 13.00, stock: 20, category: 'Cuidado Corporal', supplier: 'Cosmetics Wholesale', location: 'Vitrina Frontal', barcode: '7501234567910' },

  // Fragancias
  { name: 'Perfume Floral 50ml', description: 'Fragancia floral de larga duración', price: 65.00, cost: 32.50, stock: 12, category: 'Fragancias', supplier: 'Global Cosmetics', location: 'Vitrina Frontal', barcode: '7501234567911' },
  { name: 'Colonia Fresca 100ml', description: 'Fragancia fresca y ligera', price: 48.00, cost: 24.00, stock: 15, category: 'Fragancias', supplier: 'Premium Beauty', location: 'Vitrina Frontal', barcode: '7501234567912' },
  { name: 'Body Splash Frutal', description: 'Fragancia corporal con aroma frutal', price: 22.50, cost: 11.25, stock: 25, category: 'Fragancias', supplier: 'Beauty Trends', location: 'Estante Principal', barcode: '7501234567913' },

  // Uñas
  { name: 'Esmalte de Uñas Rojo', description: 'Esmalte de larga duración color rojo', price: 15.00, cost: 7.50, stock: 30, category: 'Uñas', supplier: 'Beauty Supply Co.', location: 'Mostrador', barcode: '7501234567914' },
  { name: 'Base Protectora', description: 'Base fortalecedora para uñas', price: 18.00, cost: 9.00, stock: 25, category: 'Uñas', supplier: 'Cosmetics Wholesale', location: 'Mostrador', barcode: '7501234567915' },
  { name: 'Removedor de Esmalte', description: 'Quitaesmalte sin acetona', price: 12.00, cost: 6.00, stock: 35, category: 'Uñas', supplier: 'Beauty Trends', location: 'Estante Principal', barcode: '7501234567916' },
  { name: 'Lima de Uñas Profesional', description: 'Lima de doble cara para manicura', price: 8.50, cost: 4.25, stock: 50, category: 'Uñas', supplier: 'Beauty Supply Co.', location: 'Mostrador', barcode: '7501234567917' },

  // Tratamientos
  { name: 'Crema Antiarrugas', description: 'Crema antiedad con retinol', price: 89.99, cost: 45.00, stock: 8, category: 'Tratamientos', supplier: 'Global Cosmetics', location: 'Vitrina Frontal', barcode: '7501234567918' },
  { name: 'Sérum Antioxidante', description: 'Tratamiento intensivo antioxidante', price: 75.00, cost: 37.50, stock: 10, category: 'Tratamientos', supplier: 'Premium Beauty', location: 'Vitrina Frontal', barcode: '7501234567919' },
  { name: 'Mascarilla Facial de Colágeno', description: 'Mascarilla hidrogel con colágeno', price: 12.99, cost: 6.50, stock: 40, category: 'Tratamientos', supplier: 'Beauty Trends', location: 'Área de Descuentos', barcode: '7501234567920' }
];

// Función principal para crear los productos
const seedProducts = async () => {
  try {
    console.log('🚀 Iniciando seed de productos...');

    // Obtener o crear la primera tienda
    let store = await Store.findOne();
    if (!store) {
      store = await Store.create({
        name: 'BellezApp Store',
        description: 'Tienda principal de productos de belleza',
        address: 'Av. Principal 123',
        phone: '555-0100',
        email: 'info@bellezapp.com'
      });
      console.log('✅ Tienda creada:', store.name);
    } else {
      console.log('✅ Usando tienda existente:', store.name);
    }

    const storeId = store._id;

    // Crear categorías
    console.log('📁 Creando categorías...');
    const categories = {};
    for (const catData of beautyCategoriesData) {
      let category = await Category.findOne({ name: catData.name, store: storeId });
      if (!category) {
        category = await Category.create({
          ...catData,
          store: storeId
        });
      }
      categories[catData.name] = category._id;
      console.log(`   ✓ ${catData.name}`);
    }

    // Crear proveedores
    console.log('🏢 Creando proveedores...');
    const suppliers = {};
    for (const suppData of beautySuppliersData) {
      let supplier = await Supplier.findOne({ name: suppData.name, store: storeId });
      if (!supplier) {
        supplier = await Supplier.create({
          ...suppData,
          store: storeId
        });
      }
      suppliers[suppData.name] = supplier._id;
      console.log(`   ✓ ${suppData.name}`);
    }

    // Crear ubicaciones
    console.log('📍 Creando ubicaciones...');
    const locations = {};
    for (const locData of beautyLocationsData) {
      let location = await Location.findOne({ name: locData.name, store: storeId });
      if (!location) {
        location = await Location.create({
          ...locData,
          store: storeId
        });
      }
      locations[locData.name] = location._id;
      console.log(`   ✓ ${locData.name}`);
    }

    // Crear productos
    console.log('🛍️ Creando productos...');
    let createdCount = 0;
    let skippedCount = 0;

    for (const productData of beautyProductsData) {
      // Verificar si el producto ya existe
      const existingProduct = await Product.findOne({ 
        name: productData.name, 
        store: storeId 
      });

      if (existingProduct) {
        console.log(`   ⚠️ Producto ya existe: ${productData.name}`);
        skippedCount++;
        continue;
      }

      // Crear el producto
      const product = await Product.create({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        cost: productData.cost,
        stock: productData.stock,
        minStock: 5,
        category: categories[productData.category],
        supplier: suppliers[productData.supplier],
        store: storeId,
        location: locations[productData.location],
        barcode: productData.barcode,
        isActive: true
      });

      console.log(`   ✅ ${product.name} - $${product.price} (Stock: ${product.stock})`);
      createdCount++;
    }

    console.log('\n🎉 Seed completado exitosamente!');
    console.log(`📊 Estadísticas:`);
    console.log(`   • Productos creados: ${createdCount}`);
    console.log(`   • Productos existentes: ${skippedCount}`);
    console.log(`   • Categorías: ${Object.keys(categories).length}`);
    console.log(`   • Proveedores: ${Object.keys(suppliers).length}`);
    console.log(`   • Ubicaciones: ${Object.keys(locations).length}`);

  } catch (error) {
    console.error('❌ Error durante el seed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

// Ejecutar el seed
const runSeed = async () => {
  await connectDB();
  await seedProducts();
};

runSeed();