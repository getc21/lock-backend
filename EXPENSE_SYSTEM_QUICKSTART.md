# 🚀 GUÍA DE INTEGRACIÓN - SISTEMA DE GASTOS

## Pasos para Poner en Funcionamiento

### Paso 1: Backend - Iniciar Servidor

```bash
# Terminal 1 - Backend
cd bellezapp-backend
npm install  # Si no instalaste aún
npm run dev
# Debe mostrar: "Server running on port 3000"
```

### Paso 2: Frontend - Iniciar App

```bash
# Terminal 2 - Frontend
cd bellezapp-frontend
flutter pub get  # Si no obtuviste dependencias
flutter run -d chrome
# Debe abrir la app en navegador
```

### Paso 3: Verificar Base de Datos

Asegúrate que MongoDB esté ejecutándose:

```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

---

## Uso Práctico

### A. Registrar Primer Gasto

1. **Iniciar sesión** en la app
2. **Ir a Menú Principal** → Busca link a "Gastos" o "Expenses"
3. **Clic en "/expenses/new"**
4. **Completar formulario:**
   ```
   Monto:        150.00
   Categoría:    Limpieza
   Descripción:  Compra de artículos de limpieza
   Proveedor:    Distribuidora ABC
   Recibo:       FAC-2026-001
   Estado:       Aprobado
   ```
5. **Clic en "Registrar Gasto"**
6. Verás confirmación: "Gasto registrado exitosamente"

### B. Ver Reporte de Gastos

1. **Ir a `/expenses/report`**
2. **Seleccionar período:**
   - Hoy
   - Semana
   - Mes (predeterminado)
   - Año
   - Personalizado (elige fechas)

3. **Ver información:**
   ```
   ┌─ RESUMEN ─────────────────────────┐
   │ Total:       $2,500.50             │
   │ Promedio:      $166.70             │
   │ Categorías:         3              │
   └────────────────────────────────────┘
   
   ┌─ POR CATEGORÍA ────────────────────┐
   │ Limpieza      $800.00  (32%)       │
   │ Servicios     $1,200   (48%)       │
   │ Suministros   $500.50  (20%)       │
   └────────────────────────────────────┘
   
   ┌─ PRINCIPALES GASTOS ───────────────┐
   │ 15/01 - Servicio HVAC  $350 - Técnicos S.A. │
   │ 10/01 - Limpieza profunda $250 - Limpiadores ABC │
   │ ...                                │
   └────────────────────────────────────┘
   ```

---

## API - Ejemplos con CURL

### Crear Categoría

```bash
curl -X POST http://localhost:3000/api/expenses/categories \
  -H "Authorization: Bearer <tu_token_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "6715c4xxxxxx",
    "name": "Limpieza",
    "description": "Productos y servicios de limpieza",
    "icon": "broom"
  }'
```

### Registrar Gasto

```bash
curl -X POST http://localhost:3000/api/expenses \
  -H "Authorization: Bearer <tu_token_jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "6715c4xxxxxx",
    "amount": 150.50,
    "categoryId": "cat_12345",
    "description": "Compra de escobas y trapeadores",
    "supplierName": "Distribuidora ABC",
    "receipt": "FAC-2026-001",
    "status": "approved"
  }'
```

### Obtener Reporte Mensual

```bash
curl -X GET "http://localhost:3000/api/expenses/reports?storeId=6715c4xxxxxx&period=monthly" \
  -H "Authorization: Bearer <tu_token_jwt>"
```

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "report": {
      "period": "monthly",
      "startDate": "2026-01-01T00:00:00.000Z",
      "endDate": "2026-01-31T23:59:59.000Z",
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

### Obtener Reporte Personalizado

```bash
curl -X GET "http://localhost:3000/api/expenses/reports?storeId=6715c4xxxxxx&startDate=2026-01-15&endDate=2026-01-28" \
  -H "Authorization: Bearer <tu_token_jwt>"
```

### Comparar Períodos

```bash
curl -X GET "http://localhost:3000/api/expenses/reports/compare?storeId=6715c4xxxxxx&period1Start=2026-01-01&period1End=2026-01-31&period2Start=2026-02-01&period2End=2026-02-28" \
  -H "Authorization: Bearer <tu_token_jwt>"
```

---

## Obtener JWT Token para Testing

Si necesitas probar los endpoints con curl:

```bash
# 1. Hacer login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin_password"
  }'

# Respuesta contiene token:
# {
#   "status": "success",
#   "token": "eyJhbGciOiJIUzI1NiIs..."
# }

# 2. Usar el token en requests posteriores
token="eyJhbGciOiJIUzI1NiIs..."
```

---

## Postman Collection (Opcional)

Crea una colección con estas requests:

```
Bellezapp - Expenses
├── Auth
│   └── POST Login
├── Expenses
│   ├── GET List
│   ├── POST Create
│   ├── PATCH Update
│   └── DELETE Delete
├── Reports
│   ├── GET Monthly Report
│   ├── GET Custom Date Range
│   └── GET Compare Periods
└── Categories
    ├── GET All
    └── POST Create
```

---

## Troubleshooting

### Error: "Cannot connect to database"
```bash
# Verificar MongoDB está corriendo
mongod --version  # Muestra versión si está instalado

# En Windows, iniciar servicio
net start MongoDB

# En macOS
brew services start mongodb-community
```

### Error: "Invalid token"
- Asegúrate que incluyes `Authorization: Bearer <token>`
- El token debe estar sin comillas adicionales
- Token podría haber expirado (JWT_EXPIRES_IN)

### Error: "storeId is required"
- Todos los endpoints de gastos requieren `storeId`
- Verifica que estés enviando el ID correcto de la tienda

### Categorías no aparecen en el formulario
- Primero debes crear categorías con: `POST /api/expenses/categories`
- O cargar las predeterminadas

---

## Estructura de Carpetas Actual

```
bellezapp-backend/
├── src/
│   ├── controllers/
│   │   └── expense.controller.ts      ← Lógica de gastos
│   ├── models/
│   │   ├── ExpenseCategory.ts         ← Categorías
│   │   └── FinancialTransaction.ts    ← Transacciones (actualizado)
│   ├── routes/
│   │   ├── expense.routes.ts          ← Rutas de gastos
│   │   └── ...
│   └── server.ts                      ← Actualizado
└── EXPENSE_SYSTEM_DOCUMENTATION.md    ← Documentación completa

bellezapp-frontend/
├── lib/
│   ├── features/
│   │   └── expenses/
│   │       ├── expense_report_page.dart    ← Reportes
│   │       └── expense_form_page.dart      ← Formulario
│   └── shared/
│       └── providers/riverpod/
│           ├── expense_notifier.dart       ← State management
│           └── app_router.dart             ← Rutas (actualizado)
```

---

## Checklist de Verificación

- [ ] MongoDB está ejecutándose
- [ ] Backend iniciado con `npm run dev`
- [ ] Frontend iniciado con `flutter run -d chrome`
- [ ] Puedes iniciar sesión
- [ ] Puedes acceder a `/expenses/report`
- [ ] Puedes ir a `/expenses/new`
- [ ] Puedes registrar un gasto
- [ ] El gasto aparece en el reporte
- [ ] Cambias período y se actualiza el reporte

---

## Logs Útiles para Debug

**Backend:**
```
$ npm run dev
🚀 Server running on port 3000
📊 Database connected
```

**Frontend:**
```
Launching lib/main.dart on Chrome in debug mode...
✓ Built build/web
🌐 Web app running at: http://localhost:XXXX
```

---

## Próximos Pasos

1. ✅ **Creador categorías predefinidas** en la base de datos
2. ✅ **Integrar en Dashboard** widget con últimos gastos
3. ✅ **Agregar gráficas** con Chart.js o fl_chart
4. ✅ **Exportar PDF** con reportes
5. ✅ **Sistema de aprobación** por rol

---

**¿Preguntas?** Consulta `EXPENSE_SYSTEM_DOCUMENTATION.md` para más detalles.

