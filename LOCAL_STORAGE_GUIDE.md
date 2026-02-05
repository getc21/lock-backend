# 🖼️ Guía de Almacenamiento Local de Imágenes

## Resumen de cambios

Se ha migrado de **Cloudinary** a **almacenamiento local** para guardar imágenes directamente en el VPS de DigitalOcean.

### ✅ Cambios realizados

1. **Reemplazado servicio de imágenes** (`src/services/image.service.ts`)
   - ❌ Eliminada integración con Cloudinary
   - ✅ Implementado almacenamiento local con Node.js fs
   - ✅ Imágenes se guardan en `/uploads/{folder}/{timestamp}.{ext}`

2. **Actualizado servidor Express** (`src/server.ts`)
   - ✅ Configurada ruta `/uploads` para servir archivos estáticos
   - ✅ Automáticamente crea carpetas de uploads si no existen

3. **Actualizado middleware de upload** (`src/middleware/upload.ts`)
   - ✅ Mantiene validación de imágenes
   - ✅ Almacena en memoria para flexibilidad

4. **Actualizado .env**
   - ✅ Agregado `API_URL` para URLs de imágenes
   - ✅ Comentadas variables de Cloudinary (opcional eliminar)

---

## 🚀 Configuración para DigitalOcean

### En tu droplet

```bash
# Crear carpeta de uploads
mkdir -p /var/www/bellezapp/uploads
chmod -R 755 /var/www/bellezapp/uploads

# Asegurar que el directorio es propiedad del usuario de la aplicación
sudo chown -R app:app /var/www/bellezapp/uploads
```

### Variables de entorno en producción

```bash
# En tu .env en DigitalOcean
NODE_ENV=production
API_URL=https://naturalmarkets.net  # Tu dominio real
```

---

## 📁 Estructura de carpetas

```
uploads/
├── products/
│   ├── 1676543210.jpg
│   └── 1676543215.png
├── categories/
│   └── 1676543220.jpg
├── suppliers/
│   └── 1676543225.jpg
└── ...
```

---

## 🔄 Cómo funciona el flujo

```
Frontend envía imagen
         ↓
    Express (multer)
         ↓
   ImageService.uploadImage()
         ↓
  Guardado en /uploads/{folder}/{timestamp}.{ext}
         ↓
  Retorna URL: http://dominio.com/uploads/products/1676543210.jpg
         ↓
Frontend carga desde URL
```

---

## 📝 Cambios en los controllers

**Antes (Cloudinary):**
```typescript
// Automático en middleware
processImageUpload('products')
```

**Ahora (Local):**
```typescript
// Igual! El middleware hace todo automáticamente
processImageUpload('products')
```

No hay cambios en los controllers, todo funciona igual.

---

## 🗑️ Eliminación de imágenes

Cuando eliminas un producto/categoría/proveedor:

```typescript
// Automático en los controllers
if (producto.foto) {
  await ImageService.deleteImage(producto.foto);
}
```

Elimina el archivo físico del servidor.

---

## 🔒 Seguridad

### Validaciones:
- ✅ Solo se aceptan archivos de imagen (jpg, png, gif, webp, bmp)
- ✅ Máximo 5MB por archivo
- ✅ Rutas autogeneradas con timestamp

### Recomendaciones para producción:
- 🔐 Agregar backup automático de `/uploads`
- 🔐 Usar volumen separado en DigitalOcean (opcional pero recomendado)
- 🔐 Configurar rotación de logs

---

## 💾 Backups en DigitalOcean

### Opción 1: Volumen separado (Recomendado)
```bash
# Crear volumen en DigitalOcean
# 1. Panel → Volumes → Create
# 2. Seleccionar datacenter del droplet
# 3. Montar en /mnt/uploads

# Luego cambiar ruta en code:
# const uploadsDir = '/mnt/uploads';
```

### Opción 2: Backup automático del droplet
```bash
# El backup incluye todos los datos
# Costo: ~20% del droplet por mes
```

### Opción 3: Script de backup a Spaces
```bash
#!/bin/bash
# Subir uploads a DigitalOcean Spaces
aws s3 sync /var/www/bellezapp/uploads s3://bucket-name/backups/uploads --delete
```

---

## 🚀 Deployment en DigitalOcean

### 1. Instalar dependencias
```bash
npm install
```

### 2. Crear carpeta de uploads
```bash
mkdir -p uploads
```

### 3. Configurar .env
```bash
NODE_ENV=production
API_URL=https://naturalmarkets.net
MONGODB_URI=tu_mongodb_uri
```

### 4. Iniciar servidor
```bash
npm run start  # O tu script de producción
```

---

## 📊 Ventajas vs Cloudinary

| Característica | Local | Cloudinary |
|---|---|---|
| Costo | ✅ Gratis | ❌ $99+/mes |
| Control | ✅ Total | ❌ Limitado |
| Escalabilidad | ⚠️ Limitada (espacio) | ✅ Ilimitada |
| CDN | ❌ No (usar Spaces) | ✅ Incluido |
| Transformaciones | ❌ Manual | ✅ Automático |

---

## ⚠️ Consideraciones

### Cuando usar almacenamiento local:
- ✅ Aplicaciones medianas (<1000 imágenes/mes)
- ✅ Presupuesto limitado
- ✅ Control total deseado

### Cuando migrar a DigitalOcean Spaces:
- ⚠️ Tráfico muy alto
- ⚠️ Necesidad de CDN global
- ⚠️ Múltiples servidores

---

## 🔄 Migración desde Cloudinary (Opcional)

Si ya tienes imágenes en Cloudinary, puedes migrarlas:

```bash
# Script para descargar y guardar localmente
npm install axios
# Crear script de migración
```

---

## ❓ Troubleshooting

### Imágenes no se guardan
```bash
# Verificar permisos
ls -la /var/www/bellezapp/uploads

# Debe estar: drwxr-xr-x
# Si no, ejecutar:
chmod 755 /var/www/bellezapp/uploads
```

### URL de imagen incompleta
```bash
# Verificar API_URL en .env
API_URL=https://naturalmarkets.net  # Sin /

# Debe producir:
# https://naturalmarkets.net/uploads/products/1676543210.jpg
```

### Disk space warning
```bash
# Ver uso de espacio
du -sh uploads/

# Limpiar imágenes antiguas (si es necesario)
find uploads -type f -mtime +180 -delete  # Más de 180 días
```

---

## 📞 Soporte

Para problemas:
1. Revisar logs del servidor: `npm run dev`
2. Verificar permisos de carpeta
3. Confirmar que API_URL es correcto

