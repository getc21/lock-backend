// test-api-latency.js
// Ejecutar con: node test-api-latency.js

const http = require('http');

async function testLatency(path, method = 'GET') {
  return new Promise((resolve) => {
    const baseUrl = 'http://localhost:3000';
    const url = new URL(path, baseUrl);
    
    const startTime = Date.now();
    
    const req = http.request(url, { method }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const latency = Date.now() - startTime;
        resolve({
          path,
          method,
          status: res.statusCode,
          latency,
          headers: res.headers
        });
      });
    });
    
    req.on('error', (err) => {
      const latency = Date.now() - startTime;
      resolve({
        path,
        method,
        status: 'ERROR',
        latency,
        error: err.message
      });
    });
    
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testeando latencia de endpoints...\n');
  
  const endpoints = [
    '/health',
    '/api/auth/login',
    '/api/products',
    '/api/customers',
    '/api/stores'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    process.stdout.write(`Testing ${endpoint}... `);
    const result = await testLatency(endpoint);
    results.push(result);
    
    const status = result.status === 'ERROR' 
      ? '❌' 
      : result.status === 200 
      ? '✅' 
      : '⚠️ ';
    
    console.log(`${status} ${result.latency}ms`);
  }
  
  console.log('\n📊 Resumen:');
  console.log('═'.repeat(60));
  
  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  const maxLatency = Math.max(...results.map(r => r.latency));
  const minLatency = Math.min(...results.map(r => r.latency));
  
  console.log(`Promedio: ${avgLatency.toFixed(2)}ms`);
  console.log(`Mínimo:   ${minLatency}ms`);
  console.log(`Máximo:   ${maxLatency}ms`);
  
  console.log('\n📈 Evaluación:');
  if (avgLatency < 200) {
    console.log('✅ Excelente: <200ms (muy rápido)');
  } else if (avgLatency < 500) {
    console.log('⚠️  Aceptable: 200-500ms (podría mejorar)');
  } else if (avgLatency < 1000) {
    console.log('❌ Lento: 500-1000ms (mejora urgente)');
  } else {
    console.log('❌❌ MUY Lento: >1000ms (problema crítico)');
  }
  
  console.log('\n💡 Si es lento, verifica:');
  console.log('   1. ¿Está activado NODE_ENV=development en .env?');
  console.log('   2. ¿Hay muchos procesos ralentizando?');
  console.log('   3. ¿Las queries a MongoDB son pesadas?');
  console.log('   4. ¿Hay middleware bloqueante?');
}

// Esperar a que el servidor esté listo
setTimeout(runTests, 500);
