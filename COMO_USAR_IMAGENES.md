# 📸 Guía Rápida: Cómo Usar Imágenes con Cloudinary

## ✅ ¿Qué está configurado?

Tu backend ahora está listo para:
1. **Subir imágenes** a Cloudinary cuando creas/actualizas productos, categorías o proveedores
2. **Eliminar imágenes antiguas** automáticamente cuando actualizas o eliminas registros
3. **Devolver URLs de imágenes** que puedes usar directamente en tu app Flutter

---

## 🎯 Endpoints Adaptados

### Products
- **POST** `/api/products` - Crea producto con imagen
- **PATCH** `/api/products/:id` - Actualiza producto (y/o imagen)
- **DELETE** `/api/products/:id` - Elimina producto y su imagen

### Categories
- **POST** `/api/categories` - Crea categoría con imagen
- **PATCH** `/api/categories/:id` - Actualiza categoría (y/o imagen)
- **DELETE** `/api/categories/:id` - Elimina categoría y su imagen

### Suppliers
- **POST** `/api/suppliers` - Crea proveedor con imagen
- **PATCH** `/api/suppliers/:id` - Actualiza proveedor (y/o imagen)
- **DELETE** `/api/suppliers/:id` - Elimina proveedor y su imagen

---

## 🔧 Cómo Probar en Postman

### 1. Crear Producto con Imagen

```
POST http://localhost:3000/api/products

Headers:
  Authorization: Bearer <tu-token>
  Content-Type: multipart/form-data

Body (form-data):
  foto: [seleccionar archivo .jpg, .png o .webp]
  name: "Shampoo Premium"
  description: "Shampoo profesional"
  purchasePrice: 15.00
  salePrice: 25.00
  weight: 0.5
  categoryId: "67..."
  supplierId: "67..."
  locationId: "67..."
  storeId: "67..."
  stock: 50
```

**Respuesta:**
```json
{
  "status": "success",
  "data": {
    "product": {
      "_id": "67...",
      "name": "Shampoo Premium",
      "foto": "https://res.cloudinary.com/tu-cloud/image/upload/v1234567890/bellezapp/products/abc123.jpg",
      "purchasePrice": 15,
      "salePrice": 25,
      ...
    }
  }
}
```

### 2. Actualizar Solo la Imagen

```
PATCH http://localhost:3000/api/products/67...

Headers:
  Authorization: Bearer <tu-token>
  Content-Type: multipart/form-data

Body (form-data):
  foto: [nueva imagen]
```

**Nota:** La imagen antigua se eliminará automáticamente de Cloudinary.

### 3. Actualizar Producto sin Cambiar Imagen

```
PATCH http://localhost:3000/api/products/67...

Headers:
  Authorization: Bearer <tu-token>
  Content-Type: application/json

Body (raw JSON):
{
  "salePrice": 28.00,
  "stock": 45
}
```

**Nota:** NO envíes el campo `foto` y la imagen actual se mantendrá.

---

## 📱 Cómo Usar en Flutter

### 1. Crear Producto con Imagen

```dart
import 'package:http/http.dart' as http;
import 'dart:io';
import 'package:image_picker/image_picker.dart';

class ProductService {
  final String baseUrl = 'http://localhost:3000/api';
  final String token = 'tu-token-jwt';

  Future<Map<String, dynamic>> createProductWithImage({
    required File imageFile,
    required String name,
    required double purchasePrice,
    required double salePrice,
    required String categoryId,
    required String supplierId,
    required String locationId,
    required String storeId,
    required int stock,
  }) async {
    var request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/products'),
    );
    
    // Headers
    request.headers['Authorization'] = 'Bearer $token';
    
    // Imagen
    request.files.add(
      await http.MultipartFile.fromPath('foto', imageFile.path)
    );
    
    // Otros campos
    request.fields['name'] = name;
    request.fields['purchasePrice'] = purchasePrice.toString();
    request.fields['salePrice'] = salePrice.toString();
    request.fields['categoryId'] = categoryId;
    request.fields['supplierId'] = supplierId;
    request.fields['locationId'] = locationId;
    request.fields['storeId'] = storeId;
    request.fields['stock'] = stock.toString();
    
    var response = await request.send();
    var responseData = await response.stream.bytesToString();
    
    if (response.statusCode == 201) {
      return json.decode(responseData);
    } else {
      throw Exception('Error creating product: $responseData');
    }
  }

  // Seleccionar imagen desde galería
  Future<File?> pickImage() async {
    final ImagePicker picker = ImagePicker();
    final XFile? image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 85,
    );
    
    if (image != null) {
      return File(image.path);
    }
    return null;
  }
}
```

### 2. Mostrar Imagen en Flutter

```dart
import 'package:cached_network_image/cached_network_image.dart';

class ProductCard extends StatelessWidget {
  final String imageUrl;
  final String name;

  const ProductCard({
    required this.imageUrl,
    required this.name,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Column(
        children: [
          // Mostrar imagen de Cloudinary
          CachedNetworkImage(
            imageUrl: imageUrl,
            placeholder: (context, url) => CircularProgressIndicator(),
            errorWidget: (context, url, error) => Icon(Icons.error),
            fit: BoxFit.cover,
            height: 200,
            width: double.infinity,
          ),
          Padding(
            padding: EdgeInsets.all(8.0),
            child: Text(name, style: TextStyle(fontSize: 16)),
          ),
        ],
      ),
    );
  }
}
```

### 3. Instalar Dependencias Flutter

```yaml
# pubspec.yaml
dependencies:
  http: ^1.1.0
  image_picker: ^1.0.4
  cached_network_image: ^3.3.0
```

```bash
flutter pub add http image_picker cached_network_image
```

---

## 🎨 URLs de Cloudinary

### URL Original
```
https://res.cloudinary.com/tu-cloud/image/upload/v1234567890/bellezapp/products/abc123.jpg
```

### Transformaciones On-the-Fly (sin re-subir)

**Thumbnail 200x200:**
```
https://res.cloudinary.com/tu-cloud/image/upload/w_200,h_200,c_fill/bellezapp/products/abc123.jpg
```

**Preview 400x400:**
```
https://res.cloudinary.com/tu-cloud/image/upload/w_400,h_400,c_limit/bellezapp/products/abc123.jpg
```

**Calidad baja para lista:**
```
https://res.cloudinary.com/tu-cloud/image/upload/q_50/bellezapp/products/abc123.jpg
```

**Formato WebP (más ligero):**
```
https://res.cloudinary.com/tu-cloud/image/upload/f_webp/bellezapp/products/abc123.jpg
```

**Combinar transformaciones:**
```
https://res.cloudinary.com/tu-cloud/image/upload/w_400,h_400,c_fill,q_80,f_auto/bellezapp/products/abc123.jpg
```

### Uso en Flutter con Transformaciones

```dart
String getImageUrl(String originalUrl, {int? width, int? height, int? quality}) {
  // Extraer partes de la URL
  final parts = originalUrl.split('/upload/');
  if (parts.length != 2) return originalUrl;
  
  // Construir transformaciones
  List<String> transformations = [];
  if (width != null) transformations.add('w_$width');
  if (height != null) transformations.add('h_$height');
  if (quality != null) transformations.add('q_$quality');
  
  final transform = transformations.isNotEmpty 
    ? transformations.join(',') + '/' 
    : '';
  
  return '${parts[0]}/upload/$transform${parts[1]}';
}

// Uso:
CachedNetworkImage(
  imageUrl: getImageUrl(product.foto, width: 400, height: 400, quality: 80),
  fit: BoxFit.cover,
)
```

---

## 🚨 Manejo de Errores

### Error: "Cannot find module 'cloudinary'"
```powershell
npm install cloudinary multer @types/multer
```

### Error: "Invalid or missing credentials"
Verifica tu `.env`:
```env
CLOUDINARY_CLOUD_NAME=tu-cloud-name-real
CLOUDINARY_API_KEY=tu-api-key-real
CLOUDINARY_API_SECRET=tu-api-secret-real
```

### Error: "File too large"
Cambiar límite en `src/middleware/upload.ts`:
```typescript
limits: {
  fileSize: 10 * 1024 * 1024 // 10MB
}
```

### Error: "Only image files are allowed"
Asegúrate de enviar archivos con extensión `.jpg`, `.png`, `.jpeg`, o `.webp`

---

## 📋 Checklist de Uso

### Backend:
- [x] Credenciales de Cloudinary en `.env`
- [x] Dependencias instaladas (`cloudinary`, `multer`)
- [x] Rutas adaptadas (products, categories, suppliers)
- [x] Controladores actualizados con manejo de imágenes
- [x] Servidor corriendo

### Postman:
- [ ] Crear producto con imagen (POST con form-data)
- [ ] Verificar que URL de Cloudinary se devuelve
- [ ] Actualizar imagen de producto existente
- [ ] Verificar que imagen antigua se elimina
- [ ] Eliminar producto y verificar eliminación de imagen

### Flutter:
- [ ] Instalar dependencias (http, image_picker, cached_network_image)
- [ ] Implementar servicio de upload con MultipartRequest
- [ ] Implementar selector de imágenes
- [ ] Mostrar imágenes con CachedNetworkImage
- [ ] (Opcional) Implementar transformaciones de URLs

---

## 💡 Tips

1. **Optimiza en Flutter**: Usa `cached_network_image` para cachear imágenes localmente
2. **Transformaciones**: Usa URLs transformadas para diferentes tamaños (lista, detalle, thumbnail)
3. **Compresión**: Cloudinary optimiza automáticamente, pero puedes comprimir antes de subir
4. **Formatos**: Cloudinary convierte automáticamente a WebP en navegadores compatibles
5. **Backup**: Cloudinary guarda automáticamente respaldos de tus imágenes

---

## 🎯 Próximos Pasos

1. **Prueba en Postman** primero para verificar que funciona
2. **Implementa en Flutter** el selector de imágenes
3. **Adapta tus modelos** para incluir el campo `foto` (String con URL)
4. **Actualiza tu UI** para mostrar las imágenes de Cloudinary

¿Necesitas ayuda con algún paso específico? ¡Avísame!
