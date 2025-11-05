# 📊 Endpoints de Reportes Avanzados - Bellezapp Backend

## Nuevos Endpoints Agregados

He agregado **4 nuevos endpoints** para reportes avanzados que el sistema necesitaba:

### 1. 📦 Análisis de Rotación de Inventario
**GET** `/api/financial/analysis/inventory-rotation`

Analiza qué tan rápido se mueven los productos en el inventario.

**Parámetros:**
- `storeId` (string): ID de la tienda
- `startDate` (string): Fecha de inicio (formato: YYYY-MM-DD)
- `endDate` (string): Fecha de fin (formato: YYYY-MM-DD)
- `period` (string, opcional): Período de análisis (default: 'monthly')

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "period": {
      "startDate": "2025-11-01",
      "endDate": "2025-11-30"
    },
    "summary": {
      "totalProducts": 10,
      "fastMovingProducts": 3,
      "slowMovingProducts": 2,
      "averageRotationRate": 1.5
    },
    "products": [
      {
        "productId": "...",
        "productName": "Jabón de manzana",
        "category": "Cuidado Personal",
        "currentStock": 50,
        "totalSold": 75,
        "rotationRate": 1.5,
        "daysToSellStock": 20,
        "status": "normal"
      }
    ]
  }
}
```

### 2. 💰 Análisis de Rentabilidad por Producto
**GET** `/api/financial/analysis/profitability`

Analiza la rentabilidad de cada producto considerando costos y precios.

**Parámetros:**
- `storeId` (string): ID de la tienda
- `startDate` (string): Fecha de inicio
- `endDate` (string): Fecha de fin

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "period": {
      "startDate": "2025-11-01",
      "endDate": "2025-11-30"
    },
    "summary": {
      "totalRevenue": 5000.00,
      "totalProfit": 1500.00,
      "averageProfitMargin": 30.00,
      "productCount": 10
    },
    "products": [
      {
        "productId": "...",
        "productName": "Producto A",
        "category": "Categoría",
        "totalRevenue": 1000.00,
        "totalCost": 700.00,
        "totalProfit": 300.00,
        "profitMargin": 30.00,
        "totalQuantity": 100,
        "orderCount": 15,
        "averagePrice": 10.00,
        "revenuePercentage": 20.00
      }
    ]
  }
}
```

### 3. 📈 Análisis de Tendencias de Ventas
**GET** `/api/financial/analysis/sales-trends`

Analiza las tendencias de ventas por período de tiempo.

**Parámetros:**
- `storeId` (string): ID de la tienda
- `period` (string): Período de agrupación ('hourly', 'daily', 'weekly', 'monthly')
- `startDate` (string): Fecha de inicio
- `endDate` (string): Fecha de fin

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "period": {
      "type": "daily",
      "startDate": "2025-11-01",
      "endDate": "2025-11-30"
    },
    "summary": {
      "totalRevenue": 15000.00,
      "totalOrders": 150,
      "averageOrderValue": 100.00,
      "growthRate": 15.5,
      "periodsAnalyzed": 30
    },
    "trends": [
      {
        "period": "2025-11-1",
        "orderCount": 5,
        "totalRevenue": 500.00,
        "totalItems": 25,
        "averageOrderValue": 100.00
      }
    ]
  }
}
```

### 4. 🔄 Comparación de Períodos
**GET** `/api/financial/analysis/periods-comparison`

Compara métricas entre dos períodos de tiempo.

**Parámetros:**
- `storeId` (string): ID de la tienda
- `currentStartDate` (string): Inicio del período actual
- `currentEndDate` (string): Fin del período actual
- `previousStartDate` (string): Inicio del período anterior
- `previousEndDate` (string): Fin del período anterior

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "comparison": {
      "current": {
        "period": {
          "startDate": "2025-11-01",
          "endDate": "2025-11-15"
        },
        "stats": {
          "totalRevenue": 7500.00,
          "totalOrders": 75,
          "totalItems": 300,
          "averageOrderValue": 100.00
        }
      },
      "previous": {
        "period": {
          "startDate": "2025-10-01",
          "endDate": "2025-10-15"
        },
        "stats": {
          "totalRevenue": 6000.00,
          "totalOrders": 60,
          "totalItems": 240,
          "averageOrderValue": 100.00
        }
      },
      "changes": {
        "revenueChange": 25.00,
        "ordersChange": 25.00,
        "itemsChange": 25.00,
        "averageOrderValueChange": 0.00
      }
    }
  }
}
```

## Autenticación

Todos los endpoints requieren autenticación con JWT token:

```bash
Authorization: Bearer <tu_jwt_token>
```

## Ejemplos de Uso

### Obtener token de autenticación:
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@bellezapp.com",
  "password": "admin123"
}
```

### Ejemplo completo:
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@bellezapp.com", "password": "admin123"}'

# 2. Usar el token obtenido
curl -X GET "http://localhost:3000/api/financial/analysis/inventory-rotation?storeId=690108925f4e5f352cb561d7&startDate=2025-11-01&endDate=2025-11-30" \
  -H "Authorization: Bearer <tu_token_aqui>"
```

## Estado de Implementación

✅ **Completado:**
- Análisis de rotación de inventario
- Análisis de rentabilidad por producto
- Análisis de tendencias de ventas
- Comparación de períodos
- Rutas agregadas al router
- Autenticación JWT integrada
- Filtrado por tienda (multi-store)

## Notas Técnicas

1. **Filtrado por tienda**: Todos los endpoints respetan el sistema multi-tienda
2. **Validación de fechas**: Se validan los parámetros de fecha requeridos
3. **Manejo de errores**: Respuestas consistentes con el patrón de la API
4. **Performance**: Optimizadas las consultas con agregaciones de MongoDB
5. **Tipos de datos**: Todos los cálculos mantienen precisión decimal

## Frontend Integration

Para integrar estos endpoints en Flutter:

1. **Actualiza el FinancialProvider** para incluir estos métodos
2. **Crea controladores** para manejar el estado de los reportes
3. **Añade las páginas de UI** correspondientes
4. **Integra con la navegación** existente

Los endpoints están listos para ser consumidos por tu aplicación Flutter. El mensaje "Reportes avanzados requieren endpoints adicionales" ya no debería aparecer.