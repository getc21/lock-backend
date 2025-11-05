const mongoose = require('mongoose');

// Definir el schema del cliente
const customerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  email: String,
  address: String,
  notes: String,
  lastPurchase: Date,
  totalSpent: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  loyaltyPoints: { type: Number, default: 0 },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true }
}, { timestamps: true });

const Customer = mongoose.model('Customer', customerSchema);

// Schema de tienda para obtener IDs existentes
const storeSchema = new mongoose.Schema({
  name: String,
  description: String
}, { timestamps: true });

const Store = mongoose.model('Store', storeSchema);

async function testCustomerData() {
  try {
    // Conectar a MongoDB
    await mongoose.connect('mongodb://localhost:27017/bellezapp');
    
    console.log('Conectado a MongoDB');

    // Buscar tiendas existentes
    const stores = await Store.find({});
    console.log(`📍 Tiendas encontradas: ${stores.length}`);
    
    if (stores.length === 0) {
      console.log('❌ No hay tiendas en la base de datos. Creando una tienda de prueba...');
      const newStore = await Store.create({
        name: 'Tienda Principal',
        description: 'Tienda de prueba para datos'
      });
      stores.push(newStore);
      console.log(`✅ Tienda creada: ${newStore.name} (ID: ${newStore._id})`);
    }

    const firstStoreId = stores[0]._id;
    console.log(`🏪 Usando tienda: ${stores[0].name} (ID: ${firstStoreId})`);

    // Crear clientes de prueba con storeId
    const testCustomers = [
      {
        name: 'María García',
        phone: '555-0001',
        email: 'maria@email.com',
        totalSpent: 250.50,
        totalOrders: 5,
        loyaltyPoints: 250,
        lastPurchase: new Date('2024-10-30'),
        storeId: firstStoreId
      },
      {
        name: 'Juan Pérez',
        phone: '555-0002',
        email: 'juan@email.com',
        totalSpent: 150.75,
        totalOrders: 3,
        loyaltyPoints: 150,
        lastPurchase: new Date('2024-10-29'),
        storeId: firstStoreId
      },
      {
        name: 'Ana López',
        phone: '555-0003',
        email: 'ana@email.com',
        totalSpent: 75.25,
        totalOrders: 2,
        loyaltyPoints: 75,
        lastPurchase: new Date('2024-10-28'),
        storeId: firstStoreId
      }
    ];

    // Limpiar clientes existentes
    await Customer.deleteMany({});
    console.log('🧹 Clientes existentes eliminados');

    // Insertar clientes de prueba
    const insertedCustomers = await Customer.insertMany(testCustomers);
    console.log(`✅ ${insertedCustomers.length} clientes de prueba creados con storeId:`);
    
    insertedCustomers.forEach(customer => {
      console.log(`- ${customer.name}: $${customer.totalSpent}, ${customer.loyaltyPoints} puntos (Tienda: ${customer.storeId})`);
    });

    // Verificar los datos
    const allCustomers = await Customer.find({}).populate('storeId', 'name');
    console.log('\n📊 Verificación de datos:');
    allCustomers.forEach(customer => {
      console.log(`${customer.name}:`);
      console.log(`  Total gastado: $${customer.totalSpent}`);
      console.log(`  Total órdenes: ${customer.totalOrders}`);
      console.log(`  Puntos lealtad: ${customer.loyaltyPoints}`);
      console.log(`  Última compra: ${customer.lastPurchase}`);
      console.log(`  Tienda: ${customer.storeId?.name || customer.storeId}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Desconectado de MongoDB');
  }
}

testCustomerData();