const http = require('http');

// Configuración de la prueba
const testEndpoint = async () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/financial/analysis/periods-comparison?storeId=671e4d0dd3c5d4b3c01a0123&currentStartDate=2025-10-01&currentEndDate=2025-10-31&previousStartDate=2025-09-01&previousEndDate=2025-09-30',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NzFlNGQ5NWQzYzVkNGIzYzAxYTAxMjgiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MzA3NDA1NTIsImV4cCI6MTczMDc0NDE1Mn0.zMUIBJcBR8tI1K2cYj0LO8E5vOLXGSGTqTWKvXnyryI'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(data);
          console.log('\n🔍 Periods Comparison Analysis Test');
          console.log('=====================================');
          console.log(`Status Code: ${res.statusCode}`);
          console.log(`Status: ${jsonResponse.status}`);
          
          if (jsonResponse.status === 'success') {
            const { comparison, productComparisons } = jsonResponse.data;
            
            console.log('\n📊 COMPARISON SUMMARY:');
            console.log(`Sales Growth: ${comparison.salesGrowth}%`);
            console.log(`Orders Growth: ${comparison.ordersGrowth}%`);
            console.log(`Avg Order Value Growth: ${comparison.avgOrderValueGrowth}%`);
            
            console.log('\n🔵 CURRENT PERIOD:');
            console.log(`Total Sales: $${comparison.currentPeriod.totalSales}`);
            console.log(`Total Orders: ${comparison.currentPeriod.totalOrders}`);
            console.log(`Avg Order Value: $${comparison.currentPeriod.averageOrderValue}`);
            
            console.log('\n⚪ PREVIOUS PERIOD:');
            console.log(`Total Sales: $${comparison.previousPeriod.totalSales}`);
            console.log(`Total Orders: ${comparison.previousPeriod.totalOrders}`);
            console.log(`Avg Order Value: $${comparison.previousPeriod.averageOrderValue}`);
            
            console.log('\n🛍️ PRODUCT COMPARISONS:');
            productComparisons.slice(0, 5).forEach((product, index) => {
              console.log(`${index + 1}. ${product.productName}`);
              console.log(`   Current: $${product.currentSales} (${product.currentQuantity} units)`);
              console.log(`   Previous: $${product.previousSales} (${product.previousQuantity} units)`);
              console.log(`   Growth: ${product.growth}%`);
            });
            
            console.log('\n✅ Test completed successfully!');
          } else {
            console.log(`❌ Error: ${jsonResponse.message}`);
          }
          
          resolve(jsonResponse);
        } catch (error) {
          console.error('❌ Error parsing JSON:', error);
          console.log('Raw response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });
    
    req.end();
  });
};

// Ejecutar la prueba
testEndpoint().catch(console.error);