const http = require('http');

// Función para hacer petición HTTP
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function testSalesTrendsEndpoint() {
  try {
    console.log('🚀 Probando endpoint de sales trends...\n');
    
    // Test 1: Sin parámetros de fecha
    console.log('📊 Test 1: Sin parámetros de fecha');
    const response1 = await makeRequest('http://localhost:3000/api/financial/analysis/sales-trends?period=daily');
    console.log(`Status: ${response1.statusCode}`);
    console.log(`Response: ${response1.data}\n`);
    
    // Test 2: Con fechas de ejemplo (últimos 30 días)
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log('📊 Test 2: Con fechas de últimos 30 días');
    console.log(`Fechas: ${startDate} a ${endDate}`);
    const response2 = await makeRequest(`http://localhost:3000/api/financial/analysis/sales-trends?period=daily&startDate=${startDate}&endDate=${endDate}`);
    console.log(`Status: ${response2.statusCode}`);
    console.log(`Response: ${response2.data}\n`);
    
    // Test 3: Con storeId específico
    console.log('📊 Test 3: Con storeId específico');
    const storeId = '6901081d5f4e5f352cb561d5'; // De los datos de muestra
    const response3 = await makeRequest(`http://localhost:3000/api/financial/analysis/sales-trends?period=daily&startDate=${startDate}&endDate=${endDate}&storeId=${storeId}`);
    console.log(`Status: ${response3.statusCode}`);
    console.log(`Response: ${response3.data}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSalesTrendsEndpoint();