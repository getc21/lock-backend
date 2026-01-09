# 📊 Sistema de Reportes de Gastos - Documentación

## Descripción General

Se ha implementado un sistema completo de reportes de gastos que permite:
- ✅ Registrar gastos (limpieza, servicios, mantenimientos, etc.)
- ✅ Generar reportes por período (diario, semanal, mensual, anual)
- ✅ Reportes con rango de fechas personalizado
- ✅ Análisis por categoría de gastos
- ✅ Comparación entre períodos

---

## Backend

### Nuevos Modelos

#### `ExpenseCategory.ts`
Categorías de gastos predefinidas para clasificar los egresos.

```typescript
{
  _id: ObjectId,
  name: string,              // "Limpieza", "Mantenimiento", etc.
  description?: string,
  icon?: string,
  storeId: ObjectId,         // Referencia a la tienda
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### `FinancialTransaction.ts` (Actualizado)
```typescript
{
  _id: ObjectId,
  date: Date,
  type: 'income' | 'expense',
  amount: number,
  description?: string,
  category?: string,
  categoryId?: ObjectId,     // NUEVO: Referencia a ExpenseCategory
  supplierId?: ObjectId,     // NUEVO: Proveedor del gasto
  supplierName?: string,     // NUEVO
  receipt?: string,          // NUEVO: Número de recibo
  status?: 'pending' | 'approved' | 'rejected',  // NUEVO
  approvedBy?: string,       // NUEVO
  approvalDate?: Date,       // NUEVO
  storeId: ObjectId,
  createdAt: Date,
  updatedAt: Date
}
```

### Nuevos Endpoints

#### Base URL: `/api/expenses`

##### 📊 Reportes

```bash
# Reporte por período
GET /api/expenses/reports?storeId=xxx&period=daily|weekly|monthly|yearly
```

**Parámetros:**
- `storeId` (requerido): ID de la tienda
- `period`: 'daily' | 'weekly' | 'monthly' | 'yearly'
- O usar `startDate` y `endDate` para rango personalizado

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "report": {
      "period": "monthly",
      "startDate": "2026-01-01T00:00:00Z",
      "endDate": "2026-01-31T23:59:59Z",
      "totalExpense": 2500.50,
      "expenseCount": 15,
      "averageExpense": 166.70,
      "byCategory": [
        {
          "name": "Limpieza",
          "icon": "broom",
          "total": 800.00,
          "count": 4,
          "items": [...]
        }
      ],
      "topExpenses": [...]
    }
  }
}
```

##### 🔄 Comparar Períodos

```bash
GET /api/expenses/reports/compare?storeId=xxx&period1Start=2026-01-01&period1End=2026-01-31&period2Start=2026-02-01&period2End=2026-02-28
```

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "period1": { "startDate": "...", "total": 2500.50, ... },
    "period2": { "startDate": "...", "total": 2750.00, ... },
    "comparison": {
      "difference": 249.50,
      "percentageChange": "9.98%",
      "trend": "increased"
    }
  }
}
```

##### 🏷️ Categorías de Gastos

```bash
# Obtener categorías
GET /api/expenses/categories?storeId=xxx

# Crear categoría
POST /api/expenses/categories
{
  "storeId": "xxx",
  "name": "Limpieza",
  "description": "Productos y servicios de limpieza",
  "icon": "broom"
}
```

##### 📋 CRUD de Gastos

```bash
# Obtener gastos
GET /api/expenses?storeId=xxx&categoryId=yyy&startDate=2026-01-01&endDate=2026-01-31

# Crear gasto
POST /api/expenses
{
  "storeId": "xxx",
  "amount": 150.00,
  "description": "Compra de escobas y trapeadores",
  "categoryId": "cat_123",
  "supplierName": "Distribuidora ABC",
  "receipt": "FAC-2026-001",
  "status": "approved"
}

# Actualizar gasto
PATCH /api/expenses/:id
{
  "amount": 150.00,
  "status": "approved"
}

# Eliminar gasto
DELETE /api/expenses/:id
```

---

## Frontend

### Estructura de Carpetas

```
lib/features/expenses/
├── expense_report_page.dart      # Página de reportes
└── expense_form_page.dart        # Formulario de nuevo gasto

lib/shared/providers/riverpod/
└── expense_notifier.dart         # State management
```

### Páginas Disponibles

#### 1. **Página de Reportes** (`/expenses/report`)

Permite visualizar:
- ✅ Resumen general de gastos
- ✅ Filtros por período (hoy, semana, mes, año, personalizado)
- ✅ Desglose por categoría
- ✅ Principales gastos
- ✅ Gráficas y porcentajes

```dart
final expenseState = ref.watch(expenseProvider);
await ref.read(expenseProvider.notifier).loadExpenseReport(
  storeId: store['_id'],
  period: 'monthly'  // o startDate/endDate
);
```

#### 2. **Página de Nuevo Gasto** (`/expenses/new`)

Formulario completo con:
- Monto (requerido)
- Categoría
- Descripción
- Proveedor
- Número de recibo
- Estado (aprobado/pendiente/rechazado)

### Riverpod State Management

```dart
class ExpenseState {
  List<Map<String, dynamic>> expenses;    // Gastos listados
  List<Map<String, dynamic>> categories;  // Categorías disponibles
  ExpenseReport? report;                  // Reporte actual
  bool isLoading;
  String? error;
}

// Usar en widgets
final expenseState = ref.watch(expenseProvider);
```

#### Métodos Disponibles

```dart
// Cargar categorías
await ref.read(expenseProvider.notifier).loadCategories(storeId);

// Crear gasto
await ref.read(expenseProvider.notifier).createExpense(
  storeId: '...',
  amount: 150.00,
  categoryId: 'cat_123',
  description: 'Compra de limpieza',
  supplierName: 'ABC Inc'
);

// Obtener reporte
await ref.read(expenseProvider.notifier).loadExpenseReport(
  storeId: '...',
  period: 'monthly'  // daily, weekly, monthly, yearly
);

// O con rango personalizado
await ref.read(expenseProvider.notifier).loadExpenseReport(
  storeId: '...',
  startDate: DateTime(2026, 1, 1),
  endDate: DateTime(2026, 1, 31)
);

// Actualizar gasto
await ref.read(expenseProvider.notifier).updateExpense(
  expenseId: '...',
  amount: 160.00,
  status: 'approved'
);

// Eliminar gasto
await ref.read(expenseProvider.notifier).deleteExpense(expenseId, storeId);
```

---

## Rutas en la Aplicación

```
/expenses                    → Redirect a /expenses/report
/expenses/report            → Página de reportes de gastos
/expenses/new               → Formulario para nuevo gasto
```

---

## Ejemplos de Uso

### 1. Obtener Reporte Mensual en Backend

```bash
curl -X GET 'http://localhost:3000/api/expenses/reports?storeId=123&period=monthly' \
  -H 'Authorization: Bearer token_here'
```

### 2. Registrar un Gasto en Frontend

```dart
// En un widget cualquiera
final expenseNotifier = ref.read(expenseProvider.notifier);

await expenseNotifier.createExpense(
  storeId: store['_id'],
  amount: 250.00,
  description: 'Servicio de mantenimiento de AC',
  categoryId: 'maintenance_cat_id',
  supplierName: 'Técnicos HVAC S.A.'
);
```

### 3. Generar Reporte Personalizado

```dart
// Usuario selecciona fechas: 15 enero - 28 enero
await ref.read(expenseProvider.notifier).loadExpenseReport(
  storeId: store['_id'],
  startDate: DateTime(2026, 1, 15),
  endDate: DateTime(2026, 1, 28)
);

// El reporte incluirá:
// - Total gastos en ese período
// - Desglose por categoría
// - Promedio por gasto
// - Top 10 gastos más grandes
```

---

## Categorías Predefinidas Recomendadas

Se puede precargar las siguientes categorías:

```json
[
  { "name": "Limpieza", "icon": "broom", "description": "Productos y servicios de limpieza" },
  { "name": "Mantenimiento", "icon": "wrench", "description": "Reparaciones y mantenimiento" },
  { "name": "Servicios", "icon": "briefcase", "description": "Servicios profesionales" },
  { "name": "Suministros", "icon": "package", "description": "Materiales y suministros" },
  { "name": "Utilidades", "icon": "bolt", "description": "Agua, luz, internet, etc." },
  { "name": "Nómina", "icon": "dollar-sign", "description": "Salarios y beneficios" },
  { "name": "Impuestos", "icon": "file-text", "description": "Impuestos y licencias" },
  { "name": "Otros", "icon": "dots", "description": "Otros gastos" }
]
```

---

## Próximas Mejoras Sugeridas

1. ✅ Exportar reportes a PDF
2. ✅ Gráficas comparativas entre períodos
3. ✅ Alertas de gastos que excedan presupuesto
4. ✅ Aprobación de gastos por roles
5. ✅ Auditoría de cambios en gastos
6. ✅ Integración con proveedores

---

## Notas Técnicas

- **Timestamps**: Todas las transacciones incluyen `createdAt` y `updatedAt`
- **Índices**: Optimizados para búsquedas por fecha, tipo y tienda
- **Validación**: Campo `amount` con valor mínimo de 0
- **Seguridad**: Todos los endpoints requieren JWT token
- **Multi-tienda**: Cada gasto está asociado a una tienda específica

