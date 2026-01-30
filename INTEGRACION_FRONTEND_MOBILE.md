# Integración del Sistema de Retornos - Frontend y Mobile

## Resumen de Cambios Realizados

Se ha implementado un sistema completo de gestión de devoluciones, cambios y reembolsos en:
- **lock-frontend** (Flutter Web con Riverpod)
- **lock-movil** (Flutter Mobile con GetX)

## Estructura Creada

### Frontend (lock-frontend) - Riverpod Architecture

```
lib/features/returns/
├── models/
│   └── return_models.dart          # Enums y modelos Dart
├── services/
│   └── returns_service.dart        # Servicio API + Providers Riverpod
├── pages/
│   ├── returns_list_page.dart      # Lista de devoluciones
│   └── create_return_page.dart     # Crear nueva devolución
```

**Archivos creados:**
1. `return_models.dart` (250 líneas)
   - Enums: ReturnStatus, ReturnType, ReturnReasonCategory, RefundMethod
   - Models: ReturnItem, ReturnRequest, AuditReport, etc.
   - JSON serialization (toJson/fromJson)

2. `returns_service.dart` (200 líneas)
   - ReturnsService: Métodos para API calls
   - Providers Riverpod: returnsProvider, pendingReturnsProvider, createReturnProvider
   - StateNotifier para crear devoluciones

3. `returns_list_page.dart` (220 líneas)
   - Lista de devoluciones con resumen
   - FilterOs por estado, tipo, etc.
   - Tarjetas con acciones (Ver, Aprobar, Procesar)

4. `create_return_page.dart` (350 líneas)
   - Formulario completo para crear devolución
   - Selección de artículos con diálogo modal
   - Cálculo automático de total
   - Validación de datos

### Mobile (lock-movil) - GetX Architecture

```
lib/
├── models/returns/
│   └── return_models.dart          # Enums y modelos Dart
├── services/returns/
│   └── returns_service.dart        # Servicio API puro
├── controllers/returns/
│   └── returns_controller.dart     # GetX Controller
└── pages/
    └── returns_list_page.dart      # Lista de devoluciones
```

**Archivos creados:**
1. `return_models.dart` (180 líneas)
   - Mismo contenido que frontend pero optimizado para mobile

2. `returns_service.dart` (180 líneas)
   - ReturnsService: Métodos para API calls
   - URL base: `http://192.168.0.48:3000/api`

3. `returns_controller.dart` (280 líneas)
   - GetX Controller con estado reactivo
   - getStatusColor() para UI
   - Métodos: fetchReturns, createReturnRequest, approveReturnRequest, etc.
   - Estado: returns, isLoading, error, summary

4. `returns_list_page.dart` (280 líneas)
   - Lista responsive para mobile
   - GridView de resumen (2 columnas)
   - Tarjetas optimizadas para pantalla pequeña
   - Pull to refresh

## Próximos Pasos de Integración

### 1. Frontend (lock-frontend)

**Agregar rutas en Go Router:**
```dart
// En tu router/app_routes.dart
GoRoute(
  path: '/returns',
  builder: (context, state) => const ReturnsListPage(storeId: 'tu-tienda-id'),
),
GoRoute(
  path: '/returns/create',
  builder: (context, state) {
    final orderId = state.pathParameters['orderId'];
    return CreateReturnPage(
      orderId: orderId!,
      customerName: state.extra as String,
      storeId: 'tu-tienda-id',
    );
  },
),
```

**Integrar interceptor de autenticación:**
```dart
// En returns_service.dart, actualizar:
final returnsServiceProvider = Provider((ref) {
  final authToken = ref.watch(authTokenProvider); // tu provider de token
  final dio = Dio()
    ..interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          options.headers['Authorization'] = 'Bearer $authToken';
          return handler.next(options);
        },
      ),
    );
  return ReturnsService(dio);
});
```

**Actualizar URLs según ambiente:**
```dart
final baseUrl = const String.fromEnvironment('API_BASE_URL', 
  defaultValue: 'http://localhost:3000/api');
```

### 2. Mobile (lock-movil)

**Registrar rutas en GetX:**
```dart
// En lib/routes/app_routes.dart
class AppRoutes {
  static const String returns = '/returns';
  static const String createReturn = '/returns/create';
  
  static final routes = [
    GetPage(
      name: returns,
      page: () => ReturnsListPage(storeId: 'tu-tienda-id'),
    ),
    GetPage(
      name: createReturn,
      page: () {
        final orderId = Get.arguments['orderId'];
        return CreateReturnPage(
          orderId: orderId,
          customerName: Get.arguments['customerName'],
          storeId: Get.arguments['storeId'],
        );
      },
    ),
  ];
}
```

**Integrar con autenticación:**
```dart
// En ReturnsService
final authToken = Get.find<AuthController>().token.value;
dio.options.headers['Authorization'] = 'Bearer $authToken';
```

**Agregar página de creación (create_return_page.dart):**
```dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import '../../controllers/returns/returns_controller.dart';
import '../../models/returns/return_models.dart';

class CreateReturnPage extends StatelessWidget {
  final String orderId;
  final String customerName;
  final String storeId;
  final ReturnsController controller = Get.find();

  CreateReturnPage({
    required this.orderId,
    required this.customerName,
    required this.storeId,
    Key? key,
  }) : super(key: key);

  // ... implementación similar a frontend
}
```

## APIs Backend Utilizadas

El sistema se conecta a estos endpoints del backend:

### Retornos
- `POST /api/returns/request` - Crear solicitud de devolución
- `PATCH /api/returns/:id/approve` - Aprobar devolución
- `PATCH /api/returns/:id/process` - Procesar reembolso
- `PATCH /api/returns/:id/reject` - Rechazar devolución
- `GET /api/returns` - Listar devoluciones con filtros
- `GET /api/returns/audit/report` - Reporte de auditoría

### Auditoría Financiera
- `GET /api/audit/reconciliation` - Reconciliación contable
- `GET /api/audit/returns-and-refunds` - Reporte de retornos/reembolsos
- `GET /api/audit/trail` - Registro de auditoría
- `GET /api/audit/integrity` - Validación de integridad
- `GET /api/audit/export` - Exportar para auditoría externa

## Características Implementadas

### Frontend (Riverpod)
✅ Lista de devoluciones con resumen dinámico
✅ Creación de solicitudes con validación
✅ Selección de artículos con diálogo modal
✅ Cálculo automático de totales
✅ Estados y badges visuales
✅ Filtros avanzados
✅ Providers Riverpod reactivos
✅ Manejo de errores

### Mobile (GetX)
✅ Lista responsive con GridView
✅ Controlador GetX con estado reactivo
✅ Gestión de formularios
✅ Agregar/remover artículos
✅ Snackbars informativos
✅ Loading states
✅ Pull to refresh
✅ Navegación con GetX

## Variables de Ambiente

**Frontend:**
```env
API_BASE_URL=http://localhost:3000/api
```

**Mobile:**
```env
API_BASE_URL=http://192.168.0.48:3000/api
```

## Testing Recomendado

### Unit Tests
```dart
// test/services/returns_service_test.dart
test('createReturnRequest debe llamar al endpoint correcto', () async {
  // Mock Dio
  // Verificar request
  // Verificar response parsing
});
```

### Widget Tests
```dart
// test/features/returns/pages/returns_list_page_test.dart
testWidgets('debe mostrar lista de devoluciones', (tester) async {
  // Render widget
  // Verificar elementos visibles
  // Verificar acciones
});
```

### Integration Tests
```dart
// test/integration/returns_integration_test.dart
testWidgets('flujo completo de devolución', (tester) async {
  // Navegar a crear devolución
  // Llenar formulario
  // Enviar
  // Verificar en lista
});
```

## Troubleshooting

### Error de conexión
- Verificar que el backend está corriendo en puerto 3000
- Verificar URLs en BaseUrl
- Revisar token de autenticación

### Datos no se cargan
- Comprobar que storeId es válido
- Verificar respuesta del API en DevTools
- Revisar logs de backend

### Errores de tipo Dart
- Verificar enums coincidan entre frontend y backend
- Actualizar serialización JSON si modelos cambian

## Documentación Relacionada

Ver también:
- [SISTEMA_PROFESIONAL_CONTABLE.md](../SISTEMA_PROFESIONAL_CONTABLE.md) - Arquitectura del backend
- [GUIA_IMPLEMENTACION_FRONTEND.md](../GUIA_IMPLEMENTACION_FRONTEND.md) - Guía original más detallada
- [MEJORES_PRACTICAS_CONTABLES.md](../MEJORES_PRACTICAS_CONTABLES.md) - Políticas y procedimientos
- [QUICK_START_TECNICO.md](../QUICK_START_TECNICO.md) - Ejemplos de API

---

**Estado:** ✅ Implementación completada
**Próximo:** Testing e integración con rutas existentes
