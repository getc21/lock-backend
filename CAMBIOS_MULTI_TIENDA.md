# Resumen de Cambios - Sistema Multi-Tienda para Productos

## Cambios Realizados

### Backend (Node.js/Express)

#### 1. **Nuevo Modelo: ProductStore** ✅
- **Archivo**: `src/models/ProductStore.ts`
- **Propósito**: Almacenar stock y precios específicos de cada tienda
- **Campos**:
  - `productId`: referencia al producto genérico
  - `storeId`: referencia a la tienda
  - `stock`: cantidad en stock
  - `salePrice`: precio de venta en esa tienda
  - `purchasePrice`: precio de compra en esa tienda
  - Índice único: (productId + storeId) para evitar duplicados

#### 2. **Modelo Product Actualizado** ✅
- **Cambios**:
  - ❌ Eliminado: `storeId`, `stock`, `salePrice`, `purchasePrice`
  - ✅ Mantiene: `name`, `description`, `categoryId`, `supplierId`, `locationId`, `foto`, `weight`, `expiryDate`
  - Ahora es completamente genérico/compartido entre tiendas

#### 3. **Controlador de Productos Actualizado** ✅

**createProduct** - Nueva lógica:
- Obtiene todas las tiendas asociadas al usuario
- Crea el producto genérico una sola vez
- Crea una entrada ProductStore para CADA tienda del usuario:
  - **Tienda actual (la que crea el producto)**: stock y precios completos
  - **Otras tiendas**: stock=0, salePrice=0, purchasePrice=0

**getAllProducts**:
- Obtiene ProductStore de la tienda consultada
- Combina datos de Product + ProductStore
- Retorna precios y stock específicos de esa tienda

**getProduct**:
- Similar a getAllProducts, pero para un producto específico
- Requiere `storeId` en query params

**updateStock**:
- Ahora actualiza ProductStore en lugar de Product
- Requiere `storeId` en el body

### Frontend (Flutter)

**Ya está listo** ✅
- El `product_provider.dart` ya envía `storeId` al crear productos
- El sistema recibe correctamente los datos y los envía al backend

## Flujo de Uso

### Crear un Producto
1. Usuario en tienda "A" crea un producto con:
   - Nombre, descripción, categoría, proveedor, ubicación, imagen
   - Stock: 50
   - Precio de venta: $100
   - Precio de compra: $60

2. Backend crea:
   - 1 documento `Product` con datos genéricos
   - N documentos `ProductStore`:
     - Tienda A: stock=50, salePrice=100, purchasePrice=60
     - Tienda B: stock=0, salePrice=0, purchasePrice=0
     - Tienda C: stock=0, salePrice=0, purchasePrice=0

3. Cuando tienda B quiere vender el mismo producto:
   - Ve el producto con stock=0
   - Debe actualizar su ProductStore con su propio stock y precios
   - Ahora puede vender: stock=30, salePrice=120 (su precio local)

## Cambios en las Requests

### Crear Producto
```
POST /api/products
{
  "name": "Shampoo",
  "description": "...",
  "purchasePrice": 60,
  "salePrice": 100,
  "categoryId": "123",
  "supplierId": "456",
  "locationId": "789",
  "storeId": "abc",  // Tienda actual
  "stock": 50,
  "expiryDate": "2025-12-31",
  "foto": "..."
}
```

### Obtener Productos
```
GET /api/products?storeId=abc
```

### Actualizar Stock
```
POST /api/products/:id/stock
{
  "quantity": 10,
  "operation": "add",  // or "subtract"
  "storeId": "abc"
}
```

## Próximas Consideraciones

1. **Actualizar Producto**: Necesita validar que solo se actualicen datos genéricos (nombre, descripción, categoría, etc.)
2. **Eliminar Producto**: Debe eliminar el Product y todos sus ProductStore
3. **Middleware**: Verificar que el usuario tenga acceso a la tienda especificada
4. **UI**: Mostrar al usuario que el producto está con stock/precios 0 en otras tiendas

## Ventajas del Sistema

✅ Un producto es único (no duplicado)
✅ Cada tienda puede tener su propio precio y stock
✅ Más eficiente en almacenamiento y actualizaciones
✅ Fácil de escalar a múltiples tiendas
✅ Separación clara entre datos genéricos y específicos de tienda
