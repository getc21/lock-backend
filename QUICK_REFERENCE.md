# Sistema de Reportes de Gastos - Referencia Rápida

## 🎯 ¿Qué Se Implementó?

Sistema completo para **registrar, categorizar y reportar gastos** (limpieza, servicios, mantenimientos, etc.) con reportes por período.

---

## 📊 Reportes Disponibles

### Períodos
- **Hoy** - Gastos de hoy
- **Semana** - Últimos 7 días
- **Mes** - Mes actual ← Predeterminado
- **Año** - Año actual
- **Personalizado** - Seleccionar fechas

### Información Incluida
```
Total Gastos      → $2,500.50
Transacciones     → 15 gastos
Promedio          → $166.70 por gasto
Por Categoría     → Desglose y porcentajes
Top Gastos        → 10 mayores egresos
```

---

## 📍 Rutas Frontend

| Ruta | Descripción |
|------|------------|
| `/expenses` | Redirecciona a reportes |
| `/expenses/report` | 📊 Ver reportes con filtros |
| `/expenses/new` | ➕ Registrar nuevo gasto |

---

## 🔌 Endpoints Backend

**Base:** `/api/expenses`

### GET /reports
```bash
# Mensual
?storeId=xxx&period=monthly

# Personalizado
?storeId=xxx&startDate=2026-01-01&endDate=2026-01-31

# Respuesta incluye
- totalExpense
- expenseCount
- averageExpense
- byCategory[]
- topExpenses[]
```

### POST /
Registrar gasto
```json
{
  "storeId": "xxx",
  "amount": 150.00,
  "categoryId": "cat_123",
  "description": "Compra de limpieza",
  "supplierName": "ABC Inc",
  "status": "approved"
}
```

### PATCH /:id
Actualizar gasto

### DELETE /:id
Eliminar gasto

### GET /categories
Obtener categorías

### POST /categories
Crear categoría

---

## 💾 Modelos BD

### ExpenseCategory
```
{
  _id: ObjectId,
  name: string,              // "Limpieza", "Servicios", etc.
  description: string,
  icon: string,
  storeId: ObjectId,
  isActive: boolean
}
```

### FinancialTransaction (actualizado)
```
{
  _id: ObjectId,
  type: 'income' | 'expense',
  amount: number,
  description: string,
  categoryId: ObjectId,       ← NUEVO
  supplierId: ObjectId,       ← NUEVO
  supplierName: string,       ← NUEVO
  receipt: string,            ← NUEVO
  status: 'approved' | ...,   ← NUEVO
  approvedBy: string,         ← NUEVO
  storeId: ObjectId,
  date: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎨 Widgets Frontend

### ExpenseReportPage
Página completa de reportes con:
- Filtros por período
- Resumen de gastos
- Desglose por categoría
- Top 10 gastos

### ExpenseFormPage
Formulario para registrar gastos con campos:
- Monto ✅ Requerido
- Categoría
- Descripción
- Proveedor
- Recibo
- Estado

### ExpensesWidget
Widget para dashboard que muestra:
- Gastos de hoy
- Total y promedio
- Top 3 categorías

---

## 🚀 Cómo Iniciar

### Backend
```bash
npm run dev
# → Server running on port 3000
```

### Frontend
```bash
flutter run -d chrome
# → App running on http://localhost:XXXX
```

### Seed Categorías (Recomendado)
```bash
npx ts-node src/scripts/seedExpenseCategories.ts
# → ✅ Seeding completado: 9 categorías creadas
```

---

## 📋 Categorías Predefinidas

1. Limpieza
2. Mantenimiento
3. Servicios
4. Suministros
5. Utilidades
6. Nómina
7. Impuestos
8. Marketing
9. Otros

---

## 🧪 Testing Rápido

### Con curl
```bash
# Login (obtener token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'

# Crear gasto
curl -X POST http://localhost:3000/api/expenses \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storeId":"store_id",
    "amount":150,
    "description":"Limpieza"
  }'

# Obtener reporte
curl http://localhost:3000/api/expenses/reports \
  -H "Authorization: Bearer TOKEN" \
  -d "storeId=store_id&period=monthly"
```

---

## 📂 Archivos Creados

### Backend
- `src/models/ExpenseCategory.ts`
- `src/controllers/expense.controller.ts`
- `src/routes/expense.routes.ts`
- `src/scripts/seedExpenseCategories.ts`
- `src/server.ts` (actualizado)

### Frontend
- `lib/features/expenses/expense_report_page.dart`
- `lib/features/expenses/expense_form_page.dart`
- `lib/shared/widgets/expenses_widget.dart`
- `lib/shared/providers/riverpod/expense_notifier.dart`
- `lib/shared/config/app_router.dart` (actualizado)
- `lib/shared/widgets/dashboard_layout.dart` (actualizado)

### Documentación
- `EXPENSE_SYSTEM_DOCUMENTATION.md`
- `EXPENSE_SYSTEM_QUICKSTART.md`
- `EXPENSE_REPORT_IMPLEMENTATION.md`
- `IMPLEMENTATION_COMPLETE.md`

---

## ✅ Características

✅ Reportes por período (diario, semanal, mensual, anual, personalizado)
✅ Gastos categorizados
✅ Comparación entre períodos
✅ Búsquedas y filtros
✅ UI intuitiva y responsive
✅ Multi-tienda
✅ Auditoría (aprobaciones)
✅ Documentación completa

---

## 🔗 Menú de Navegación

Nuevo elemento agregado a `dashboard_layout.dart`:
```
📊 Gastos → /expenses/report
```

Posicionado entre "Clientes" y "Tiendas"

---

## 💡 Ejemplo de Uso

1. **Ver reportes de hoy:**
   - Click en "Gastos" del menú
   - Seleccionar "Hoy"
   - Ver total de gastos y desglose

2. **Registrar un gasto:**
   - Click en "Registrar Nuevo Gasto"
   - Llenar: Monto $150, Categoría "Limpieza", Descripción "Escobas"
   - Click "Registrar Gasto"
   - ¡Listo! Aparecerá en reportes

3. **Ver reporte mensual:**
   - Click en "Gastos" del menú
   - Seleccionar "Mes" (ya seleccionado)
   - Ver tabla con todos los gastos del mes

---

## 🔑 Archivo API Key

No se requiere clave especial. Solo JWT token de autenticación.

---

## 📊 SQL/Mongoose

### Crear colección (automático)
MongoDB crea colecciones al insertar datos.

### Crear índices (automático)
Incluidos en esquemas Mongoose.

---

## ⚡ Performance

- Índices en: `date`, `type`, `storeId`, `categoryId`, `status`
- Queries optimizadas con lean()
- Paginación soportada
- Caché con Riverpod

---

## 🎯 Próximas Mejoras Opcionales

- [ ] Exportar PDF
- [ ] Gráficas Chart.js
- [ ] Alertas presupuesto
- [ ] Aprobación por roles
- [ ] Historial cambios
- [ ] Importar Excel

---

## 📞 Documentación Completa

Ver archivos:
- `EXPENSE_SYSTEM_DOCUMENTATION.md` - Especificación técnica
- `EXPENSE_SYSTEM_QUICKSTART.md` - Guía inicio rápido
- `IMPLEMENTATION_COMPLETE.md` - Resumen implementación

---

**Estado:** ✅ Completado y Listo  
**Fecha:** Enero 8, 2026  
**Versión:** 1.0.0

