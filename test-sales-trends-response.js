const http = require('http');

function makeAuthenticatedRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDEwNGI1NDA4NmZiYmY3YWFkMTY4MCIsImVtYWlsIjoiYWRtaW5AYmVsbGV6YXBwLmNvbSIsInJvbGUiOiJhZG1pbiIsInVzZXJuYW1lIjoiYWRtaW4iLCJpYXQiOjE3NjIzNTA2NTAsImV4cCI6MTc2Mjk1NTQ1MH0.M80s5lyNDfKl8qR-YnpCo-7P2qpbGV3hVm8I5fZHIhg',
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
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
    
    req.end();
  });
}

async function testSalesTrendsResponse() {
  try {
    console.log('🚀 Probando respuesta del endpoint con autenticación...\n');
    
    const response = await makeAuthenticatedRequest('/api/financial/analysis/sales-trends?period=day&startDate=2025-10-01&endDate=2025-10-31&storeId=6901081d5f4e5f352cb561d5');
    
    console.log(`Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      const parsedData = JSON.parse(response.data);
      console.log('\n✅ Respuesta exitosa:');
      console.log('📊 Status:', parsedData.status);
      
      if (parsedData.data && parsedData.data.summary) {
        const summary = parsedData.data.summary;
        console.log('\n📈 Resumen recibido:');
        console.log(`  totalSales: ${summary.totalSales}`);
        console.log(`  totalRevenue: ${summary.totalRevenue}`);
        console.log(`  totalOrders: ${summary.totalOrders}`);
        console.log(`  averageDaily: ${summary.averageDaily}`);
        console.log(`  averageOrderValue: ${summary.averageOrderValue}`);
        console.log(`  growthRate: ${summary.growthRate}`);
        console.log(`  periodCount: ${summary.periodCount}`);
        console.log(`  periodsAnalyzed: ${summary.periodsAnalyzed}`);
        
        console.log(`\n📊 Trends: ${parsedData.data.trends?.length || 0} períodos`);
        
        // Verificar que los campos que espera el frontend estén presentes
        const requiredFields = ['totalSales', 'averageDaily', 'periodCount'];
        const missingFields = requiredFields.filter(field => summary[field] === undefined);
        
        if (missingFields.length === 0) {
          console.log('\n✅ Todos los campos requeridos por el frontend están presentes');
        } else {
          console.log('\n❌ Campos faltantes:', missingFields);
        }
      }
    } else {
      console.log('❌ Error en la respuesta');
      console.log(response.data);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSalesTrendsResponse();