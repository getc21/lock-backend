// const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

// Datos de prueba para el login
const loginData = {
    email: 'admin@bellezapp.com',
    password: 'admin123'
};

async function testAdvancedReports() {
    try {
        console.log('🔐 Haciendo login...');
        
        // 1. Login para obtener token
        const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const loginResult = await loginResponse.json();
        
        if (!loginResult.token) {
            console.error('❌ Error en login:', loginResult);
            return;
        }

        console.log('✅ Login exitoso');
        const token = loginResult.token;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // 2. Probar endpoint de rotación de inventario
        console.log('\n📊 Probando análisis de rotación de inventario...');
        const rotationResponse = await fetch(`${BASE_URL}/financial/analysis/inventory-rotation?storeId=690108925f4e5f352cb561d7&startDate=2025-11-01&endDate=2025-11-30`, {
            headers
        });

        if (rotationResponse.ok) {
            const rotationData = await rotationResponse.json();
            console.log('✅ Análisis de rotación:', JSON.stringify(rotationData, null, 2));
        } else {
            console.log('❌ Error en rotación:', rotationResponse.status, await rotationResponse.text());
        }

        // 3. Probar endpoint de rentabilidad
        console.log('\n💰 Probando análisis de rentabilidad...');
        const profitabilityResponse = await fetch(`${BASE_URL}/financial/analysis/profitability?storeId=690108925f4e5f352cb561d7&startDate=2025-11-01&endDate=2025-11-30`, {
            headers
        });

        if (profitabilityResponse.ok) {
            const profitabilityData = await profitabilityResponse.json();
            console.log('✅ Análisis de rentabilidad:', JSON.stringify(profitabilityData, null, 2));
        } else {
            console.log('❌ Error en rentabilidad:', profitabilityResponse.status, await profitabilityResponse.text());
        }

        // 4. Probar endpoint de tendencias de ventas
        console.log('\n📈 Probando análisis de tendencias de ventas...');
        const trendsResponse = await fetch(`${BASE_URL}/financial/analysis/sales-trends?storeId=690108925f4e5f352cb561d7&period=daily&startDate=2025-11-01&endDate=2025-11-30`, {
            headers
        });

        if (trendsResponse.ok) {
            const trendsData = await trendsResponse.json();
            console.log('✅ Análisis de tendencias:', JSON.stringify(trendsData, null, 2));
        } else {
            console.log('❌ Error en tendencias:', trendsResponse.status, await trendsResponse.text());
        }

        // 5. Probar endpoint de comparación de períodos
        console.log('\n🔄 Probando comparación de períodos...');
        const comparisonResponse = await fetch(`${BASE_URL}/financial/analysis/periods-comparison?storeId=690108925f4e5f352cb561d7&currentStartDate=2025-11-01&currentEndDate=2025-11-15&previousStartDate=2025-10-01&previousEndDate=2025-10-15`, {
            headers
        });

        if (comparisonResponse.ok) {
            const comparisonData = await comparisonResponse.json();
            console.log('✅ Comparación de períodos:', JSON.stringify(comparisonData, null, 2));
        } else {
            console.log('❌ Error en comparación:', comparisonResponse.status, await comparisonResponse.text());
        }

        console.log('\n🎉 Pruebas completadas!');

    } catch (error) {
        console.error('💥 Error general:', error);
    }
}

// Ejecutar las pruebas
testAdvancedReports();