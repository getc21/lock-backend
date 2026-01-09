# ❓ Preguntas Frecuentes - Sistema de Gastos

## 🚀 Instalación y Configuración

### P: ¿Cómo inicio el sistema?

**R:** 
```bash
# Terminal 1: Backend
cd bellezapp-backend
npm run dev

# Terminal 2: Frontend
cd bellezapp-frontend
flutter run -d chrome
```

### P: ¿Necesito cargar las categorías predefinidas?

**R:** Es opcional pero recomendado. Ejecuta:
```bash
cd bellezapp-backend
npx ts-node src/scripts/seedExpenseCategories.ts
```

Esto carga 9 categorías automáticamente. Si no lo haces, puedes crearlas manualmente en la app.

### P: ¿Qué versión de Node/Flutter necesito?

**R:** 
- Node.js 18+
- Flutter 3.0+
- MongoDB 6.0+

### P: ¿MongoDB está instalado?

**R:** Verifica con:
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

---

## 📊 Reportes

### P: ¿Qué períodos de reporte hay?

**R:** 
- Hoy (últimas 24 horas)
- Semana (últimos 7 días)
- Mes (mes actual) ← Predeterminado
- Año (año actual)
- Personalizado (selecciona fechas)

### P: ¿Cómo veo el reporte?

**R:** Ir a **Menú → Gastos** o `/expenses/report`

### P: ¿Puedo comparar dos períodos?

**R:** Sí, con la API:
```bash
GET /api/expenses/reports/compare?storeId=xxx&period1Start=...&period1End=...&period2Start=...&period2End=...
```

### P: ¿Qué información incluye el reporte?

**R:**
- Total de gastos
- Cantidad de transacciones
- Promedio por gasto
- Desglose por categoría
- Porcentajes
- Top 10 gastos

---

## 💰 Registrar Gastos

### P: ¿Dónde registro un nuevo gasto?

**R:** Click en el menú → "Gastos" → "Registrar Nuevo Gasto"  
O ir directamente a `/expenses/new`

### P: ¿Qué campos son requeridos?

**R:** Solo el **Monto**. Los demás son opcionales.

### P: ¿Puedo registrar un gasto sin categoría?

**R:** Sí, pero se recomienda categorizar para mejor análisis.

### P: ¿Cómo editar o eliminar un gasto?

**R:** Aún no hay UI para ello (próxima versión). Puedes usar la API:
```bash
PATCH /api/expenses/:id   (actualizar)
DELETE /api/expenses/:id  (eliminar)
```

### P: ¿Qué es el campo "Estado"?

**R:** Indica si el gasto está:
- **Aprobado** - Contabilizado en reportes
- **Pendiente** - Esperando aprobación
- **Rechazado** - No se cuenta en totales

---

## 🏷️ Categorías

### P: ¿Cómo agrego una nueva categoría?

**R:** 
**Frontend:** Aún no hay UI (se agregará)

**API:**
```bash
POST /api/expenses/categories
{
  "storeId": "xxx",
  "name": "Servicios Médicos",
  "description": "Servicios de salud ocupacional",
  "icon": "hospital"
}
```

### P: ¿Puedo modificar categorías?

**R:** Aún no hay UI. Puedes usar la base de datos directamente.

### P: ¿Cuáles son las categorías predefinidas?

**R:** Si ejecutaste el seed, tienes:
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

## 🔐 Seguridad y Permisos

### P: ¿Necesito autenticación?

**R:** Sí. Todos los endpoints requieren JWT token (excepto login/register).

### P: ¿Puedo ver gastos de otras tiendas?

**R:** No. Solo ves gastos de tu tienda actual.

### P: ¿Hay control de roles?

**R:** Aún no (próxima versión). Por ahora todos los usuarios autenticados pueden ver/crear gastos.

### P: ¿Quién puede aprobar gastos?

**R:** Actualmente se aprueba automáticamente. Control de aprobación en próxima versión.

---

## 🐛 Solución de Problemas

### P: "Connection refused" en backend

**R:** 
- MongoDB no está corriendo
- Puerto 3000 en uso

```bash
# Inicia MongoDB
mongod  # o net start MongoDB en Windows

# O usa diferente puerto
PORT=3001 npm run dev
```

### P: "storeId is required" en error

**R:** 
- No enviaste storeId en request
- O tu tienda actual no está seleccionada

```bash
# Asegúrate que en Frontend tienes tienda seleccionada
# Dashboard → Selector de tienda en top
```

### P: No veo categorías en el formulario

**R:** 
- No ejecutaste el seed
- O la tienda no tiene categorías creadas

```bash
# Solución 1: Ejecutar seed
npx ts-node src/scripts/seedExpenseCategories.ts

# Solución 2: Crear manualmente por API
POST /api/expenses/categories
```

### P: El reporte muestra "No hay datos"

**R:** 
- No hay gastos registrados en ese período
- O la tienda está mal seleccionada

Registra algunos gastos y recarga.

### P: Error "Invalid token"

**R:** 
- Token expiró (JWT_EXPIRES_IN = 7d)
- Token malformado
- Falta "Bearer " en header

```bash
# Correcto
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

# Incorrecto
Authorization: eyJhbGciOiJIUzI1NiIs...
Authorization: Bearer
```

### P: CORS error en frontend

**R:** Backend permite CORS. Si persiste:
```typescript
// En server.ts
const corsOptions = {
  origin: 'http://localhost:XXXX',  // Tu frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
};
```

---

## 📱 Interfaz

### P: ¿Dónde está el menú de gastos?

**R:** En el sidebar izquierdo, entre "Clientes" y "Tiendas"

### P: ¿Puedo cambiar el idioma?

**R:** No. Actualmente solo español.

### P: ¿El widget de gastos aparece en dashboard?

**R:** Aún no se agregó. Puedes agregarlo manualmente:

```dart
import '../../shared/widgets/expenses_widget.dart';

// En DashboardPage, agrega:
ExpensesWidget(),
```

### P: ¿Hay reportes en PDF?

**R:** No (próxima versión). Por ahora puedes:
- Tomar screenshot
- Exportar datos via API
- Usar herramientas del navegador

---

## 🔄 Integración

### P: ¿Cómo integro el widget de gastos en Dashboard?

**R:**
```dart
// 1. Importa
import '../../shared/widgets/expenses_widget.dart';

// 2. En build(), agrega:
Column(
  children: [
    // ... otros widgets
    ExpensesWidget(),  // ← Aquí
  ],
)

// 3. Guarda y hot-reload
```

### P: ¿Puedo usar esto en una app móvil?

**R:** Sí, el código es compatible. Pero la UI se ve mejor en web.

### P: ¿Funciona offline?

**R:** No. Requiere conexión a MongoDB.

---

## 📊 Datos y Analytics

### P: ¿Qué información se exporta?

**R:** Actualmente:
- Lista de gastos (JSON via API)
- Reportes generados

Próximamente: PDF, Excel, CSV

### P: ¿Hay gráficas?

**R:** Solo en reportes (barras por categoría). Gráficas avanzadas: próxima versión.

### P: ¿Puedo hacer análisis históricos?

**R:** Sí, con la API comparando períodos:
```bash
GET /api/expenses/reports/compare
```

---

## 💼 Negocios

### P: ¿Cuántos gastos puedo registrar?

**R:** Ilimitados. MongoDB soporta millones de registros.

### P: ¿Qué pasa si elimino un gasto?

**R:** Se elimina del reporte. No hay papelera de reciclaje.

### P: ¿Puedo recuperar gastos eliminados?

**R:** No. Usa backups de MongoDB si es necesario.

### P: ¿Hay historial de cambios?

**R:** No (próxima versión). Pero cada gasto tiene `createdAt` y `updatedAt`.

---

## 🚀 Optimización

### P: El reporte carga lento

**R:** 
- Si tienes muchos gastos (>10,000), es normal
- Los índices están optimizados
- Frontend cachea datos con Riverpod

### P: ¿Puedo mejorar performance?

**R:**
- Limpia datos antiguos
- Agrega más RAM
- Usa MongoDB Atlas (nube)

### P: ¿Cuál es el máximo de gastos por período?

**R:** Teóricamente ilimitado, pero UI muestra top 10.

---

## 🆘 Contacto y Soporte

### P: ¿Hay más documentación?

**R:** Sí, revisa estos archivos:
- `EXPENSE_SYSTEM_DOCUMENTATION.md` - Técnica completa
- `EXPENSE_SYSTEM_QUICKSTART.md` - Guía inicio rápido
- `IMPLEMENTATION_COMPLETE.md` - Resumen
- `QUICK_REFERENCE.md` - Referencia rápida

### P: ¿Dónde reporto bugs?

**R:** Abre una issue en GitHub (si aplica)

### P: ¿Hay roadmap de mejoras?

**R:** Sí, en `IMPLEMENTATION_COMPLETE.md` bajo "Próximas Mejoras"

---

## ✅ Checklist de Confirmación

Antes de reportar un problema, verifica:
- [ ] MongoDB está corriendo
- [ ] Backend inició sin errores
- [ ] Frontend cargó correctamente
- [ ] Estoy autenticado
- [ ] Tengo una tienda seleccionada
- [ ] Estoy en la ruta correcta (`/expenses/report`)
- [ ] Recargué la página (Ctrl+R)

Si todo ✓ y aún hay problema, contacta soporte.

---

**¿Tu pregunta no está aquí?**

Consulta la documentación completa en los archivos .md o abre una issue.

---

**Última actualización:** Enero 8, 2026

