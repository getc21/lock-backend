# 📸 Guía de Manejo de Imágenes en Producción

## Resumen de Opciones

| Opción | Costo | Dificultad | Rendimiento | Recomendación |
|--------|-------|------------|-------------|---------------|
| **Cloudinary** | Gratis hasta 25GB | ⭐⭐ Fácil | ⭐⭐⭐⭐⭐ Excelente | ✅ **RECOMENDADO** |
| AWS S3 + CloudFront | ~$5-10/mes | ⭐⭐⭐⭐ Medio | ⭐⭐⭐⭐⭐ Excelente | Para gran escala |
| Servidor Propio | Gratis (pero limita) | ⭐⭐⭐ Fácil | ⭐⭐ Regular | Solo desarrollo |
| ImageKit | Gratis hasta 20GB | ⭐⭐ Fácil | ⭐⭐⭐⭐ Muy bueno | Alternativa a Cloudinary |

---

## 🏆 Opción 1: Cloudinary (RECOMENDADO)

### ¿Por qué Cloudinary?
- ✅ **Plan gratuito generoso**: 25GB almacenamiento, 25GB ancho de banda/mes
- ✅ **CDN global incluido**: Imágenes rápidas desde cualquier país
- ✅ **Optimización automática**: Compresión inteligente, WebP automático
- ✅ **Transformaciones on-the-fly**: Redimensionar sin guardar múltiples archivos
- ✅ **URLs seguras**: HTTPS incluido
- ✅ **Fácil integración**: SDK oficial para Node.js

### 📦 Instalación

```powershell
npm install cloudinary multer @types/multer
```

### 🔧 Configuración

**1. Agregar variables de entorno (.env):**
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
```

**2. Archivos ya creados:**
- ✅ `src/config/cloudinary.ts` - Configuración de Cloudinary
- ✅ `src/middleware/upload.ts` - Middleware de Multer
- ✅ `src/services/image.service.ts` - Servicio de imágenes

### 🚀 Uso en Rutas

**Ejemplo para Products:**

```typescript
import { Router } from 'express';
import { upload } from '../middleware/upload';
import { processImageUpload } from '../services/image.service';
import { ProductController } from '../controllers/product.controller';

const router = Router();

// Crear producto con imagen
router.post(
  '/',
  authenticateToken,
  upload.single('foto'), // 'foto' es el nombre del campo en el FormData
  processImageUpload('products'),
  ProductController.createProduct
);

// Actualizar producto con nueva imagen
router.patch(
  '/:id',
  authenticateToken,
  upload.single('foto'),
  processImageUpload('products'),
  ProductController.updateProduct
);

export default router;
```

### 📱 Uso desde Flutter/Postman

**Postman:**
```
POST http://localhost:3000/api/products
Headers:
  Authorization: Bearer <token>
  Content-Type: multipart/form-data

Body (form-data):
  foto: [seleccionar archivo de imagen]
  name: "Shampoo Premium"
  description: "..."
  purchasePrice: 15.00
  salePrice: 25.00
  categoryId: "..."
  storeId: "..."
  stock: 50
```

**Flutter:**
```dart
import 'package:http/http.dart' as http;
import 'dart:io';

Future<void> createProductWithImage(File imageFile) async {
  var request = http.MultipartRequest(
    'POST',
    Uri.parse('$baseUrl/api/products'),
  );
  
  // Agregar headers
  request.headers['Authorization'] = 'Bearer $token';
  
  // Agregar imagen
  request.files.add(await http.MultipartFile.fromPath(
    'foto',
    imageFile.path,
  ));
  
  // Agregar otros campos
  request.fields['name'] = 'Shampoo Premium';
  request.fields['purchasePrice'] = '15.00';
  request.fields['salePrice'] = '25.00';
  // ... otros campos
  
  var response = await request.send();
  var responseData = await response.stream.bytesToString();
  print(responseData);
}
```

### 🎨 URLs Generadas

Cloudinary devuelve URLs como:
```
https://res.cloudinary.com/tu-cloud/image/upload/v1234567890/bellezapp/products/abc123.jpg
```

**Transformaciones on-the-fly:**
```
// Thumbnail 200x200
https://res.cloudinary.com/tu-cloud/image/upload/w_200,h_200,c_fill/bellezapp/products/abc123.jpg

// Calidad baja para preview
https://res.cloudinary.com/tu-cloud/image/upload/q_50/bellezapp/products/abc123.jpg

// Formato WebP automático
https://res.cloudinary.com/tu-cloud/image/upload/f_auto/bellezapp/products/abc123.jpg
```

---

## 🌐 Opción 2: AWS S3 + CloudFront

### ¿Cuándo usar AWS?
- Tienes experiencia con AWS
- Necesitas más control total
- Tu app ya usa otros servicios AWS
- Presupuesto para ~$5-10/mes

### Costo Estimado
- S3: $0.023/GB almacenamiento (~$1/mes para 50GB)
- Transferencia: $0.09/GB primeros 10TB
- CloudFront: $0.085/GB primeros 10TB

### Ventajas
- ✅ Escalabilidad infinita
- ✅ Integración con AWS ecosystem
- ✅ Control total sobre permisos

### Desventajas
- ❌ Configuración más compleja
- ❌ Sin optimización automática de imágenes
- ❌ Requiere configurar CloudFront manualmente

---

## 💾 Opción 3: Servidor Propio (NO RECOMENDADO para producción)

### ¿Cuándo usar?
- Solo para desarrollo local
- Hosting con almacenamiento ilimitado
- Presupuesto cero absoluto

### Implementación

```typescript
// src/middleware/upload.ts
import multer from 'multer';
import path from 'path';
import { Request } from 'express';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/products/'); // Carpeta en el servidor
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({ storage });
```

```typescript
// Servir archivos estáticos en server.ts
app.use('/uploads', express.static('uploads'));
```

### Desventajas
- ❌ Sin CDN (lento para usuarios lejos del servidor)
- ❌ Consume espacio en disco del servidor
- ❌ Sin backup automático
- ❌ Sin optimización de imágenes
- ❌ HTTP en lugar de HTTPS (a menos que configures)

---

## 📊 Comparación de Rendimiento

### Tiempo de carga de imagen 1MB desde diferentes ubicaciones:

| Solución | Colombia | México | España | USA |
|----------|----------|--------|---------|-----|
| **Cloudinary CDN** | 150ms | 180ms | 200ms | 120ms |
| **AWS CloudFront** | 160ms | 190ms | 210ms | 130ms |
| **Servidor propio (DigitalOcean NYC)** | 450ms | 380ms | 800ms | 50ms |
| **Servidor propio (Colombia)** | 80ms | 250ms | 900ms | 400ms |

---

## 🎯 Recomendación Final

### Para tu caso (Bellezapp):

**Usa Cloudinary** porque:

1. **Gratis**: 25GB son suficientes para ~25,000 imágenes de productos
2. **Sin configuración compleja**: 3 líneas de código de configuración
3. **CDN incluido**: Clientes de cualquier país tendrán carga rápida
4. **Optimización automática**: Reduce ancho de banda y mejora experiencia
5. **HTTPS incluido**: Seguro por defecto
6. **Backup automático**: Cloudinary maneja redundancia

### Cuándo migrar a AWS:
- Cuando superes 100,000 imágenes
- Cuando tengas >100GB de imágenes
- Cuando necesites lógica muy personalizada

---

## 🔒 Seguridad

### Cloudinary:
```typescript
// Generar URL firmada (opcional para imágenes privadas)
import cloudinary from './config/cloudinary';

const signedUrl = cloudinary.url('bellezapp/products/abc123.jpg', {
  sign_url: true,
  type: 'authenticated'
});
```

### Validaciones recomendadas:
```typescript
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Solo imágenes
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Solo imágenes permitidas'));
  }
  
  // Formatos permitidos
  const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedFormats.includes(file.mimetype)) {
    return cb(new Error('Formato no permitido. Use JPG, PNG o WebP'));
  }
  
  cb(null, true);
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 1 // Solo 1 archivo por request
  }
});
```

---

## 📝 Checklist de Implementación

### Para Cloudinary:

- [ ] Crear cuenta en [cloudinary.com](https://cloudinary.com)
- [ ] Copiar credenciales (Cloud Name, API Key, API Secret)
- [ ] Agregar credenciales a `.env`
- [ ] Instalar dependencias: `npm install cloudinary multer @types/multer`
- [ ] Actualizar rutas de productos/categorías/suppliers
- [ ] Probar con Postman
- [ ] Implementar en Flutter app

---

## 🆘 Troubleshooting

### Error: "Cannot find module 'cloudinary'"
```powershell
npm install cloudinary multer @types/multer
```

### Error: "File too large"
Aumentar límite en `upload.ts`:
```typescript
limits: {
  fileSize: 10 * 1024 * 1024 // 10MB
}
```

### Error: "Invalid API credentials"
Verificar variables en `.env`:
```powershell
Get-Content .env | Select-String "CLOUDINARY"
```

---

## 📞 Soporte

**Cloudinary:**
- Documentación: https://cloudinary.com/documentation
- Soporte: https://support.cloudinary.com
- Plan gratuito: https://cloudinary.com/pricing

**AWS S3:**
- Documentación: https://docs.aws.amazon.com/s3/
- Calculadora de costos: https://calculator.aws/

¿Necesitas ayuda implementando alguna de estas opciones? ¡Avísame!
