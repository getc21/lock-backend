// test-mongodb-connection.js
// Ejecutar con: node test-mongodb-connection.js

const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.time('⏱️  Conexión a MongoDB');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bellezapp';
    console.log(`📍 Intentando conectar a: ${mongoUri}`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    console.timeEnd('⏱️  Conexión a MongoDB');
    console.log('✅ MongoDB conectado correctamente');
    
    // Test simple query
    const admin = mongoose.connection.db.admin();
    const status = await admin.serverStatus();
    console.log('🟢 MongoDB Server Status: OK');
    console.log(`   - Uptime: ${status.uptime} segundos`);
    console.log(`   - Conexiones activas: ${status.connections.current}`);
    
    await mongoose.disconnect();
    console.log('✅ Desconectado correctamente');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('\n💡 Soluciones:');
    console.log('   1. Verifica que MongoDB esté corriendo:');
    console.log('      - Windows: mongod (en terminal)');
    console.log('      - O usa MongoDB Atlas (cloud)');
    console.log('   2. Verifica MONGODB_URI en .env');
    console.log('   3. Verifica que el puerto 27017 no esté bloqueado');
    process.exit(1);
  }
}

testConnection();
