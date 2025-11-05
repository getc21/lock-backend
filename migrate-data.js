const mongoose = require('mongoose');
require('dotenv').config();

// Esquemas CORRECTOS según la aplicación
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  sku: { type: String, trim: true, unique: true, sparse: true },
  barcode: { type: String, trim: true, unique: true, sparse: true },
  purchasePrice: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, required: true, min: 0 },
  weight: { type: String, trim: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  foto: { type: String },
  stock: { type: Number, required: true, default: 0, min: 0 },
  expiryDate: { type: Date, required: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true }
}, { timestamps: true });

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderDate: { type: Date, required: true, default: Date.now },
  totalOrden: { type: Number, required: true, min: 0 },
  paymentMethod: { 
    type: String, 
    enum: ['efectivo', 'tarjeta', 'transferencia', 'otro'], 
    default: 'efectivo' 
  },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  items: [orderItemSchema],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: String,
  phone: String,
  email: String,
  address: String,
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  address: String,
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
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

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: String,
  lastName: String,
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Modelos
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Category = mongoose.model('Category', categorySchema);
const Supplier = mongoose.model('Supplier', supplierSchema);
const Location = mongoose.model('Location', locationSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Store = mongoose.model('Store', storeSchema);
const User = mongoose.model('User', userSchema);

// Mapeo de métodos de pago
const paymentMethodMapping = {
  'cash': 'efectivo',
  'card': 'tarjeta',
  'transfer': 'transferencia',
  'mixed': 'otro'
};

const migrateData = async () => {
  try {
    console.log('🔄 Iniciando migración de datos...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp');
    console.log('✅ Conectado a MongoDB\n');

    // 1. Limpiar datos antiguos con esquema incorrecto
    console.log('🧹 Limpiando datos con esquema incorrecto...');
    
    // Buscar productos con esquema incorrecto (tienen 'price' en lugar de 'salePrice')
    const incorrectProducts = await mongoose.connection.db.collection('products').find({
      price: { $exists: true },
      salePrice: { $exists: false }
    }).toArray();
    
    console.log(`   📦 Productos con esquema incorrecto encontrados: ${incorrectProducts.length}`);
    
    if (incorrectProducts.length > 0) {
      await mongoose.connection.db.collection('products').deleteMany({
        price: { $exists: true },
        salePrice: { $exists: false }
      });
      console.log('   ✅ Productos incorrectos eliminados');
    }

    // Buscar órdenes con esquema incorrecto
    const incorrectOrders = await mongoose.connection.db.collection('orders').find({
      total: { $exists: true },
      totalOrden: { $exists: false }
    }).toArray();
    
    console.log(`   📝 Órdenes con esquema incorrecto encontradas: ${incorrectOrders.length}`);
    
    if (incorrectOrders.length > 0) {
      await mongoose.connection.db.collection('orders').deleteMany({
        total: { $exists: true },
        totalOrden: { $exists: false }
      });
      console.log('   ✅ Órdenes incorrectas eliminadas');
    }

    // Limpiar categorías, proveedores, ubicaciones y clientes incorrectos
    const incorrectCategories = await mongoose.connection.db.collection('categories').find({
      store: { $exists: true },
      storeId: { $exists: false }
    }).toArray();
    
    if (incorrectCategories.length > 0) {
      await mongoose.connection.db.collection('categories').deleteMany({
        store: { $exists: true },
        storeId: { $exists: false }
      });
      console.log(`   ✅ ${incorrectCategories.length} categorías incorrectas eliminadas`);
    }

    const incorrectSuppliers = await mongoose.connection.db.collection('suppliers').find({
      store: { $exists: true },
      storeId: { $exists: false }
    }).toArray();
    
    if (incorrectSuppliers.length > 0) {
      await mongoose.connection.db.collection('suppliers').deleteMany({
        store: { $exists: true },
        storeId: { $exists: false }
      });
      console.log(`   ✅ ${incorrectSuppliers.length} proveedores incorrectos eliminados`);
    }

    const incorrectLocations = await mongoose.connection.db.collection('locations').find({
      store: { $exists: true },
      storeId: { $exists: false }
    }).toArray();
    
    if (incorrectLocations.length > 0) {
      await mongoose.connection.db.collection('locations').deleteMany({
        store: { $exists: true },
        storeId: { $exists: false }
      });
      console.log(`   ✅ ${incorrectLocations.length} ubicaciones incorrectas eliminadas`);
    }

    const incorrectCustomers = await mongoose.connection.db.collection('customers').find({
      store: { $exists: true },
      storeId: { $exists: false }
    }).toArray();
    
    if (incorrectCustomers.length > 0) {
      await mongoose.connection.db.collection('customers').deleteMany({
        store: { $exists: true },
        storeId: { $exists: false }
      });
      console.log(`   ✅ ${incorrectCustomers.length} clientes incorrectos eliminados`);
    }

    // 2. Recrear datos con esquema correcto
    console.log('\n🛠️ Recreando datos con esquema correcto...');
    
    // Obtener tiendas
    const stores = await Store.find({});
    console.log(`📍 Tiendas encontradas: ${stores.length}`);

    for (const store of stores) {
      console.log(`\n🏪 Procesando: ${store.name} (ID: ${store._id})`);
      
      // Crear categorías
      const categories = [
        { name: 'Cuidado Facial', description: 'Productos para el cuidado del rostro' },
        { name: 'Maquillaje', description: 'Productos de maquillaje y cosméticos' },
        { name: 'Cuidado Capilar', description: 'Productos para el cuidado del cabello' },
        { name: 'Cuidado Corporal', description: 'Productos para el cuidado del cuerpo' },
        { name: 'Fragancias', description: 'Perfumes y fragancias' },
        { name: 'Uñas', description: 'Productos para el cuidado de uñas' },
        { name: 'Tratamientos', description: 'Tratamientos especializados' }
      ];

      const createdCategories = {};
      for (const cat of categories) {
        const existingCategory = await Category.findOne({ name: cat.name, storeId: store._id });
        if (!existingCategory) {
          const newCategory = await Category.create({
            name: cat.name,
            description: cat.description,
            storeId: store._id
          });
          createdCategories[cat.name] = newCategory._id;
        } else {
          createdCategories[cat.name] = existingCategory._id;
        }
      }

      // Crear proveedores
      const suppliers = [
        { name: 'Beauty Supply Co.', contact: 'Contacto Beauty', phone: '555-0101', email: 'info@beautysupply.com' },
        { name: 'Premium Beauty', contact: 'Contacto Premium', phone: '555-0102', email: 'ventas@premiumbeauty.com' },
        { name: 'Cosmetics Wholesale', contact: 'Contacto Wholesale', phone: '555-0103', email: 'pedidos@cosmeticswholesale.com' },
        { name: 'Beauty Trends', contact: 'Contacto Trends', phone: '555-0104', email: 'info@beautytrends.com' },
        { name: 'Global Cosmetics', contact: 'Contacto Global', phone: '555-0105', email: 'ventas@globalcosmetics.com' }
      ];

      const createdSuppliers = {};
      for (const sup of suppliers) {
        const existingSupplier = await Supplier.findOne({ name: sup.name, storeId: store._id });
        if (!existingSupplier) {
          const newSupplier = await Supplier.create({
            name: sup.name,
            contact: sup.contact,
            phone: sup.phone,
            email: sup.email,
            storeId: store._id
          });
          createdSuppliers[sup.name] = newSupplier._id;
        } else {
          createdSuppliers[sup.name] = existingSupplier._id;
        }
      }

      // Crear ubicaciones
      const locations = [
        { name: 'Estante Principal', description: 'Ubicación principal en el estante central' },
        { name: 'Vitrina Frontal', description: 'Vitrina principal del mostrador' },
        { name: 'Mostrador', description: 'Área del mostrador de ventas' },
        { name: 'Almacén General', description: 'Área de almacenamiento general' }
      ];

      const createdLocations = {};
      for (const loc of locations) {
        const existingLocation = await Location.findOne({ name: loc.name, storeId: store._id });
        if (!existingLocation) {
          const newLocation = await Location.create({
            name: loc.name,
            description: loc.description,
            storeId: store._id
          });
          createdLocations[loc.name] = newLocation._id;
        } else {
          createdLocations[loc.name] = existingLocation._id;
        }
      }

      // Crear productos con esquema correcto
      const productsData = store.name === 'Sucursal Principal' ? [
        // Productos para Sucursal Principal
        { name: 'Crema Hidratante Facial', description: 'Crema hidratante para todo tipo de piel', purchasePrice: 15.00, salePrice: 25.00, stock: 50, category: 'Cuidado Facial', supplier: 'Beauty Supply Co.', location: 'Vitrina Frontal', barcode: '7501234567890' },
        { name: 'Limpiador Facial Espumoso', description: 'Limpiador suave con espuma natural', purchasePrice: 10.00, salePrice: 18.99, stock: 35, category: 'Cuidado Facial', supplier: 'Premium Beauty', location: 'Estante Principal', barcode: '7501234567891' },
        { name: 'Sérum Vitamina C', description: 'Sérum antioxidante con vitamina C pura', purchasePrice: 25.00, salePrice: 45.00, stock: 25, category: 'Cuidado Facial', supplier: 'Global Cosmetics', location: 'Vitrina Frontal', barcode: '7501234567892' },
        { name: 'Protector Solar SPF 50', description: 'Protección solar de amplio espectro', purchasePrice: 18.00, salePrice: 32.50, stock: 40, category: 'Cuidado Facial', supplier: 'Beauty Trends', location: 'Mostrador', barcode: '7501234567893' },
        { name: 'Mascarilla de Arcilla', description: 'Mascarilla purificante de arcilla bentonita', purchasePrice: 8.00, salePrice: 15.99, stock: 30, category: 'Cuidado Facial', supplier: 'Beauty Supply Co.', location: 'Estante Principal', barcode: '7501234567894' },
        
        { name: 'Base de Maquillaje Líquida', description: 'Base de cobertura media a completa', purchasePrice: 20.00, salePrice: 38.00, stock: 28, category: 'Maquillaje', supplier: 'Cosmetics Wholesale', location: 'Vitrina Frontal', barcode: '7501234567895' },
        { name: 'Corrector de Ojeras', description: 'Corrector de alta cobertura', purchasePrice: 12.00, salePrice: 22.50, stock: 35, category: 'Maquillaje', supplier: 'Premium Beauty', location: 'Mostrador', barcode: '7501234567896' },
        { name: 'Paleta de Sombras', description: 'Paleta de 12 sombras neutras', purchasePrice: 18.00, salePrice: 38.00, stock: 20, category: 'Maquillaje', supplier: 'Beauty Trends', location: 'Vitrina Frontal', barcode: '7501234567897' },
        { name: 'Máscara de Pestañas', description: 'Máscara voluminizadora resistente al agua', purchasePrice: 8.00, salePrice: 16.99, stock: 45, category: 'Maquillaje', supplier: 'Global Cosmetics', location: 'Mostrador', barcode: '7501234567898' },
        { name: 'Labial Mate', description: 'Labial de larga duración acabado mate', purchasePrice: 6.00, salePrice: 12.50, stock: 60, category: 'Maquillaje', supplier: 'Beauty Supply Co.', location: 'Mostrador', barcode: '7501234567899' },
        { name: 'Rubor en Polvo', description: 'Rubor compacto de larga duración', purchasePrice: 10.00, salePrice: 26.00, stock: 32, category: 'Maquillaje', supplier: 'Cosmetics Wholesale', location: 'Vitrina Frontal', barcode: '7501234567900' },
        
        { name: 'Shampoo Reparador', description: 'Shampoo para cabello dañado con keratina', purchasePrice: 12.00, salePrice: 22.99, stock: 38, category: 'Cuidado Capilar', supplier: 'Premium Beauty', location: 'Estante Principal', barcode: '7501234567901' },
        { name: 'Acondicionador Hidratante', description: 'Acondicionador nutritivo para cabello seco', purchasePrice: 12.00, salePrice: 20.00, stock: 42, category: 'Cuidado Capilar', supplier: 'Beauty Supply Co.', location: 'Estante Principal', barcode: '7501234567902' },
        { name: 'Mascarilla Capilar', description: 'Tratamiento intensivo para cabello maltratado', purchasePrice: 15.00, salePrice: 32.00, stock: 25, category: 'Cuidado Capilar', supplier: 'Global Cosmetics', location: 'Almacén General', barcode: '7501234567903' },
        { name: 'Aceite para Cabello', description: 'Aceite nutritivo de argán y coco', purchasePrice: 14.00, salePrice: 28.50, stock: 30, category: 'Cuidado Capilar', supplier: 'Beauty Trends', location: 'Vitrina Frontal', barcode: '7501234567904' },
        { name: 'Spray Termoprotector', description: 'Protector térmico para peinado', purchasePrice: 8.00, salePrice: 18.00, stock: 35, category: 'Cuidado Capilar', supplier: 'Cosmetics Wholesale', location: 'Estante Principal', barcode: '7501234567905' }
      ] : [
        // Productos para Sucursal Santa Cruz (diferentes productos)
        { name: 'Tónico Facial Purificante', description: 'Tónico astringente para piel grasa', purchasePrice: 11.25, salePrice: 22.50, stock: 20, category: 'Cuidado Facial', supplier: 'Beauty Supply Co.', location: 'Estante Principal', barcode: '7501234567921' },
        { name: 'Contorno de Ojos', description: 'Crema antiarrugas para contorno de ojos', purchasePrice: 19.00, salePrice: 38.00, stock: 15, category: 'Cuidado Facial', supplier: 'Premium Beauty', location: 'Vitrina Frontal', barcode: '7501234567922' },
        { name: 'Delineador Líquido Negro', description: 'Delineador de larga duración', purchasePrice: 9.25, salePrice: 18.50, stock: 25, category: 'Maquillaje', supplier: 'Cosmetics Wholesale', location: 'Mostrador', barcode: '7501234567923' },
        { name: 'Polvo Compacto', description: 'Polvo matificante con SPF', purchasePrice: 16.00, salePrice: 32.00, stock: 18, category: 'Maquillaje', supplier: 'Beauty Trends', location: 'Vitrina Frontal', barcode: '7501234567924' },
        { name: 'Brillo Labial Transparente', description: 'Brillo con vitamina E', purchasePrice: 8.00, salePrice: 16.00, stock: 30, category: 'Maquillaje', supplier: 'Global Cosmetics', location: 'Mostrador', barcode: '7501234567925' },
        { name: 'Champú Anticaspa', description: 'Champú medicado contra la caspa', purchasePrice: 12.25, salePrice: 24.50, stock: 22, category: 'Cuidado Capilar', supplier: 'Premium Beauty', location: 'Estante Principal', barcode: '7501234567926' },
        { name: 'Crema para Peinar', description: 'Crema definidora de rizos', purchasePrice: 10.00, salePrice: 19.99, stock: 28, category: 'Cuidado Capilar', supplier: 'Beauty Supply Co.', location: 'Estante Principal', barcode: '7501234567927' },
        { name: 'Serum Capilar Reparador', description: 'Tratamiento intensivo para cabello dañado', purchasePrice: 22.50, salePrice: 45.00, stock: 12, category: 'Cuidado Capilar', supplier: 'Global Cosmetics', location: 'Vitrina Frontal', barcode: '7501234567928' },
        { name: 'Jabón Líquido Antibacterial', description: 'Jabón de manos con aroma a limón', purchasePrice: 6.75, salePrice: 13.50, stock: 35, category: 'Cuidado Corporal', supplier: 'Beauty Trends', location: 'Estante Principal', barcode: '7501234567929' },
        { name: 'Crema Corporal Reafirmante', description: 'Crema con cafeína y centella asiática', purchasePrice: 14.00, salePrice: 28.00, stock: 20, category: 'Cuidado Corporal', supplier: 'Premium Beauty', location: 'Vitrina Frontal', barcode: '7501234567930' },
        { name: 'Desodorante Roll-on', description: 'Protección 48 horas sin alcohol', purchasePrice: 7.75, salePrice: 15.50, stock: 40, category: 'Cuidado Corporal', supplier: 'Beauty Supply Co.', location: 'Estante Principal', barcode: '7501234567931' },
        { name: 'Eau de Toilette Masculina', description: 'Fragancia fresca para hombre', purchasePrice: 21.00, salePrice: 42.00, stock: 15, category: 'Fragancias', supplier: 'Global Cosmetics', location: 'Vitrina Frontal', barcode: '7501234567932' },
        { name: 'Spray Corporal Vanilla', description: 'Fragancia corporal dulce de vainilla', purchasePrice: 9.75, salePrice: 19.50, stock: 25, category: 'Fragancias', supplier: 'Beauty Trends', location: 'Estante Principal', barcode: '7501234567933' },
        { name: 'Top Coat Brillante', description: 'Esmalte finalizador de alto brillo', purchasePrice: 7.25, salePrice: 14.50, stock: 32, category: 'Uñas', supplier: 'Cosmetics Wholesale', location: 'Mostrador', barcode: '7501234567934' },
        { name: 'Aceite Cuticulas', description: 'Aceite nutritivo para cutículas', purchasePrice: 5.50, salePrice: 11.00, stock: 28, category: 'Uñas', supplier: 'Beauty Supply Co.', location: 'Mostrador', barcode: '7501234567935' }
      ];

      let productCount = 0;
      for (const prodData of productsData) {
        const existingProduct = await Product.findOne({ 
          name: prodData.name, 
          storeId: store._id 
        });

        if (!existingProduct) {
          // Calcular fecha de expiración (6 meses a partir de ahora)
          const expiryDate = new Date();
          expiryDate.setMonth(expiryDate.getMonth() + 6);

          await Product.create({
            name: prodData.name,
            description: prodData.description,
            purchasePrice: prodData.purchasePrice,
            salePrice: prodData.salePrice,
            stock: prodData.stock,
            categoryId: createdCategories[prodData.category],
            supplierId: createdSuppliers[prodData.supplier],
            locationId: createdLocations[prodData.location],
            storeId: store._id,
            barcode: prodData.barcode,
            expiryDate: expiryDate
          });
          productCount++;
        }
      }
      console.log(`   ✅ ${productCount} productos creados con esquema correcto`);

      // Crear clientes
      const customerNames = [
        'María González', 'Ana Rodríguez', 'Carmen López', 'Isabel Martín', 'Elena García',
        'Laura Sánchez', 'Patricia Ruiz', 'Sofía Jiménez', 'Lucía Hernández', 'Paula Moreno',
        'Andrea Muñoz', 'Clara Álvarez', 'Beatriz Romero', 'Natalia Gutierrez', 'Cristina Navarro'
      ];

      const createdCustomers = [];
      let customerCount = 0;
      for (let i = 0; i < customerNames.length; i++) {
        const existingCustomer = await Customer.findOne({ 
          name: customerNames[i], 
          storeId: store._id 
        });

        if (!existingCustomer) {
          const customer = await Customer.create({
            name: customerNames[i],
            email: `${customerNames[i].toLowerCase().replace(/\s+/g, '.')}@email.com`,
            phone: `591-${Math.floor(Math.random() * 90000000) + 60000000}`,
            address: `Dirección ${i + 1}, ${store.name}`,
            storeId: store._id
          });
          createdCustomers.push(customer);
          customerCount++;
        }
      }
      console.log(`   ✅ ${customerCount} clientes creados`);

      // Crear órdenes con esquema correcto
      const products = await Product.find({ storeId: store._id });
      const customers = await Customer.find({ storeId: store._id });
      
      if (products.length > 0 && customers.length > 0) {
        let orderCount = 0;
        for (let i = 1; i <= 50; i++) { // 50 órdenes por tienda
          // Fecha aleatoria en octubre 2025
          const startDate = new Date('2025-10-01T08:00:00.000Z');
          const endDate = new Date('2025-10-31T20:00:00.000Z');
          const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
          const orderDate = new Date(randomTime);

          // Seleccionar cliente aleatorio
          const customer = customers[Math.floor(Math.random() * customers.length)];

          // Generar items (1-3 productos)
          const itemCount = Math.floor(Math.random() * 3) + 1;
          const orderItems = [];
          let totalOrden = 0;

          for (let j = 0; j < itemCount; j++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const quantity = Math.floor(Math.random() * 3) + 1;
            const price = product.salePrice;

            orderItems.push({
              productId: product._id,
              quantity,
              price
            });

            totalOrden += quantity * price;
          }

          // Método de pago aleatorio
          const paymentMethods = ['efectivo', 'tarjeta', 'transferencia'];
          const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

          await Order.create({
            orderDate,
            totalOrden: Math.round(totalOrden * 100) / 100,
            paymentMethod,
            customerId: customer._id,
            storeId: store._id,
            items: orderItems,
            createdAt: orderDate,
            updatedAt: orderDate
          });

          orderCount++;
        }
        console.log(`   ✅ ${orderCount} órdenes creadas con esquema correcto`);
      }
    }

    // Resumen final
    console.log('\n📊 RESUMEN FINAL:');
    console.log('==================');
    
    for (const store of stores) {
      const productCount = await Product.countDocuments({ storeId: store._id });
      const orderCount = await Order.countDocuments({ storeId: store._id });
      const customerCount = await Customer.countDocuments({ storeId: store._id });
      
      console.log(`🏪 ${store.name}:`);
      console.log(`   📦 Productos: ${productCount}`);
      console.log(`   📝 Órdenes: ${orderCount}`);
      console.log(`   👥 Clientes: ${customerCount}`);
      console.log('   ' + '-'.repeat(30));
    }
    
    console.log('🎉 Migración completada exitosamente!');
    console.log('✅ Todos los datos ahora usan el esquema correcto de la aplicación');

  } catch (error) {
    console.error('❌ Error durante la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

migrateData();