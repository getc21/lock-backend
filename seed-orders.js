const mongoose = require('mongoose');
require('dotenv').config();

// Esquemas
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

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: String,
  phone: String,
  address: String,
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

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
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const cashRegisterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  currentBalance: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Modelos
const Order = mongoose.model('Order', orderSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Product = mongoose.model('Product', productSchema);
const Store = mongoose.model('Store', storeSchema);
const User = mongoose.model('User', userSchema);
const CashRegister = mongoose.model('CashRegister', cashRegisterSchema);

// Datos para clientes
const customerNames = [
  'María González', 'Ana Rodríguez', 'Carmen López', 'Isabel Martín', 'Elena García',
  'Laura Sánchez', 'Patricia Ruiz', 'Sofía Jiménez', 'Lucía Hernández', 'Paula Moreno',
  'Andrea Muñoz', 'Clara Álvarez', 'Beatriz Romero', 'Natalia Gutierrez', 'Cristina Navarro',
  'Pilar Vázquez', 'Mónica Serrano', 'Teresa Ramos', 'Eva Blanco', 'Raquel Castro',
  'Silvia Ortega', 'Victoria Delgado', 'Amparo Peña', 'Dolores Herrera', 'Rosa Medina',
  'Inés Cortés', 'Remedios Luna', 'Esperanza Vargas', 'Gloria Aguilar', 'Rocío Jiménez',
  'Mercedes Santos', 'Concepción Moya', 'Josefa Torres', 'Encarna Rubio', 'Marisol Prieto',
  'Alejandra Molina', 'Verónica Campos', 'Nuria Iglesias', 'Marta Cano', 'Sandra Gallego',
  'Carlos Fernández', 'José Luis García', 'Antonio Martínez', 'Francisco López', 'Manuel Sánchez',
  'David Ruiz', 'Javier Jiménez', 'Daniel González', 'Miguel Hernández', 'Luis Moreno'
];

const paymentMethods = ['cash', 'card', 'transfer', 'mixed'];
const orderStatuses = ['completed', 'completed', 'completed', 'completed', 'cancelled']; // 80% completed, 20% cancelled

// Función para generar fecha aleatoria en octubre 2025
const getRandomOctoberDate = () => {
  const startDate = new Date('2025-10-01T08:00:00.000Z');
  const endDate = new Date('2025-10-31T20:00:00.000Z');
  const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
  return new Date(randomTime);
};

// Función para generar número de orden único
const generateOrderNumber = (date, index) => {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const sequence = index.toString().padStart(4, '0');
  return `ORD${year}${month}${day}${sequence}`;
};

// Función para calcular impuestos (IVA 13% en Bolivia)
const calculateTax = (subtotal) => {
  return Math.round(subtotal * 0.13 * 100) / 100;
};

const seedOrders = async () => {
  try {
    console.log('🚀 Iniciando creación de órdenes para octubre 2025...');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp');
    console.log('✅ Conectado a MongoDB\n');

    // Obtener tiendas
    const stores = await Store.find({});
    if (stores.length < 2) {
      console.error('❌ Se necesitan al menos 2 tiendas');
      return;
    }

    console.log('🏪 Tiendas encontradas:');
    stores.forEach(store => {
      console.log(`   📍 ${store.name} (ID: ${store._id})`);
    });

    let totalOrdersCreated = 0;

    // Procesar cada tienda
    for (const store of stores) {
      console.log(`\n🛍️ Procesando órdenes para: ${store.name}`);
      console.log('═'.repeat(50));

      // Obtener productos de la tienda
      const products = await Product.find({ store: store._id, isActive: true });
      if (products.length === 0) {
        console.log(`   ⚠️ No hay productos en ${store.name}, saltando...`);
        continue;
      }

      // Obtener o crear usuarios para la tienda
      let users = await User.find({ store: store._id });
      if (users.length === 0) {
        console.log(`   👤 Creando usuario por defecto para ${store.name}...`);
        const defaultUser = await User.create({
          username: `admin_${store.name.toLowerCase().replace(/\s+/g, '_')}`,
          email: `admin@${store.name.toLowerCase().replace(/\s+/g, '')}.com`,
          password: 'hashedpassword123',
          firstName: 'Admin',
          lastName: store.name,
          store: store._id,
          isActive: true
        });
        users = [defaultUser];
      }

      // Obtener o crear caja registradora
      let cashRegister = await CashRegister.findOne({ store: store._id });
      if (!cashRegister) {
        console.log(`   💰 Creando caja registradora para ${store.name}...`);
        cashRegister = await CashRegister.create({
          name: `Caja Principal ${store.name}`,
          store: store._id,
          currentBalance: 5000,
          isActive: true
        });
      }

      // Crear clientes para la tienda
      console.log(`   👥 Verificando clientes para ${store.name}...`);
      const existingCustomers = await Customer.find({ store: store._id });
      let customers = [...existingCustomers];

      if (customers.length < 20) {
        const customersToCreate = 20 - customers.length;
        console.log(`   👥 Creando ${customersToCreate} clientes adicionales...`);
        
        for (let i = 0; i < customersToCreate; i++) {
          const customerIndex = existingCustomers.length + i;
          if (customerIndex < customerNames.length) {
            const customer = await Customer.create({
              name: customerNames[customerIndex],
              email: `${customerNames[customerIndex].toLowerCase().replace(/\s+/g, '.')}@email.com`,
              phone: `591-${Math.floor(Math.random() * 90000000) + 60000000}`,
              address: `Dirección ${customerIndex + 1}, ${store.name}`,
              store: store._id,
              isActive: true
            });
            customers.push(customer);
          }
        }
      }

      // Crear 100 órdenes para esta tienda
      console.log(`   📦 Creando 100 órdenes para ${store.name}...`);
      let storeOrdersCreated = 0;

      for (let i = 1; i <= 100; i++) {
        try {
          const orderDate = getRandomOctoberDate();
          const orderNumber = generateOrderNumber(orderDate, totalOrdersCreated + i);

          // Verificar si ya existe esta orden
          const existingOrder = await Order.findOne({ orderNumber });
          if (existingOrder) {
            console.log(`     ⚠️ Orden ${orderNumber} ya existe, saltando...`);
            continue;
          }

          // Seleccionar cliente aleatorio
          const customer = customers[Math.floor(Math.random() * customers.length)];
          const user = users[Math.floor(Math.random() * users.length)];

          // Generar items de la orden (1-5 productos)
          const itemCount = Math.floor(Math.random() * 5) + 1;
          const orderItems = [];
          let subtotal = 0;

          for (let j = 0; j < itemCount; j++) {
            const product = products[Math.floor(Math.random() * products.length)];
            const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 unidades
            const price = product.price;
            const itemSubtotal = quantity * price;

            orderItems.push({
              product: product._id,
              quantity,
              price,
              subtotal: itemSubtotal
            });

            subtotal += itemSubtotal;
          }

          // Calcular descuentos aleatorios (0-20%)
          const discountPercent = Math.random() * 0.2; // 0-20%
          const discount = Math.round(subtotal * discountPercent * 100) / 100;
          const subtotalAfterDiscount = subtotal - discount;

          // Calcular impuestos
          const tax = calculateTax(subtotalAfterDiscount);
          const total = subtotalAfterDiscount + tax;

          // Seleccionar método de pago y estado
          const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
          const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];

          // Crear la orden
          const order = await Order.create({
            orderNumber,
            customer: customer._id,
            store: store._id,
            items: orderItems,
            subtotal,
            tax,
            discount,
            total,
            paymentMethod,
            status,
            notes: Math.random() > 0.7 ? `Orden procesada el ${orderDate.toLocaleDateString()}` : '',
            cashRegister: cashRegister._id,
            user: user._id,
            createdAt: orderDate,
            updatedAt: orderDate
          });

          storeOrdersCreated++;
          if (storeOrdersCreated % 20 === 0) {
            console.log(`     ✅ ${storeOrdersCreated}/100 órdenes creadas...`);
          }

        } catch (error) {
          console.log(`     ❌ Error creando orden ${i}: ${error.message}`);
        }
      }

      console.log(`   🎉 Completado: ${storeOrdersCreated} órdenes creadas para ${store.name}`);
      totalOrdersCreated += storeOrdersCreated;
    }

    // Resumen final
    console.log('\n📊 RESUMEN FINAL DE ÓRDENES:');
    console.log('═'.repeat(40));
    
    for (const store of stores) {
      const storeOrderCount = await Order.countDocuments({ store: store._id });
      const completedOrders = await Order.countDocuments({ store: store._id, status: 'completed' });
      const cancelledOrders = await Order.countDocuments({ store: store._id, status: 'cancelled' });
      
      console.log(`🏪 ${store.name}:`);
      console.log(`   📦 Total órdenes: ${storeOrderCount}`);
      console.log(`   ✅ Completadas: ${completedOrders}`);
      console.log(`   ❌ Canceladas: ${cancelledOrders}`);
      
      if (storeOrderCount > 0) {
        const totalRevenue = await Order.aggregate([
          { $match: { store: store._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$total' } } }
        ]);
        
        if (totalRevenue.length > 0) {
          console.log(`   💰 Ingresos totales: $${totalRevenue[0].total.toFixed(2)}`);
        }
      }
      console.log('   ' + '-'.repeat(30));
    }
    
    const totalOrdersInDb = await Order.countDocuments({});
    console.log(`\n🎯 Total de órdenes en la base de datos: ${totalOrdersInDb}`);
    console.log(`🎉 Proceso completado exitosamente!`);

  } catch (error) {
    console.error('❌ Error durante la creación de órdenes:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

seedOrders();