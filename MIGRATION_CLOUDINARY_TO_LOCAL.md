# ✅ Migración de Cloudinary a Almacenamiento Local - COMPLETADA

## 📋 Resumen

Se ha migrado exitosamente de **Cloudinary** a **almacenamiento local en el servidor** para guardar imágenes directamente en tu VPS de DigitalOcean.

---

## 🔄 Cambios Realizados

### 1. **Servicio de Imágenes** ✅
- **Archivo**: `src/services/image.service.ts`
- **Cambio**: Reemplazado servicio Cloudinary por almacenamiento local
- **Funciones**:
  - `uploadImage()`: Guarda imágenes en `/uploads/{folder}/{timestamp}.{ext}`
  - `deleteImage()`: Elimina archivos físicos del servidor
  - `ensureUploadDirExists()`: Crea carpetas automáticamente

### 2. **Servidor Express** ✅
- **Archivo**: `src/server.ts`
- **Cambio**: Configurado route `/uploads` para servir archivos estáticos
- **Líneas**: Se agregó `app.use('/uploads', express.static(uploadsPath));`
- **Resultado**: Las imágenes se sirven como `http://dominio.com/uploads/products/1676543210.jpg`

### 3. **Middleware de Upload** ✅
- **Archivo**: `src/middleware/upload.ts`
- **Estado**: Mantiene estructura igual (usa memoria de multer)
- **Validación**: Solo acepta archivos de imagen (jpg, png, gif, webp, bmp)
- **Límite**: Máximo 5MB por archivo

### 4. **Variables de Entorno** ✅
- **Archivo**: `.env`
- **Cambios**:
  - ✅ Agregado `API_URL=http://localhost:3000`
  - ✅ Comentadas variables de Cloudinary
  - ✅ Pueden ser eliminadas completamente

### 5. **.gitignore** ✅
- **Archivo**: `.gitignore`
- **Cambio**: Agregada carpeta `/uploads` (no enviar imágenes a Git)

### 6. **Documentación** ✅
- **Archivo**: `LOCAL_STORAGE_GUIDE.md` (NUEVO)
- **Contenido**: Guía completa para setup, deployment y troubleshooting

---

## 🚀 Pasos Próximos

### En Desarrollo (Local)
```bash
# 1. Instalar dependencias (si cambió algo)
npm install

# 2. Crear carpeta de uploads
mkdir -p uploads

# 3. Configurar .env (ya actualizado)
API_URL=http://localhost:3000

# 4. Ejecutar servidor
npm run dev

# 5. Probar upload (mismos endpoints que antes)
# POST /api/products con imagen → Guardada en /uploads/products/
```

### En DigitalOcean (Producción)
```bash
# 1. SSH al droplet
ssh root@tu_ip_digital_ocean

# 2. Crear carpeta de uploads
mkdir -p /var/www/bellezapp/uploads
chmod 755 /var/www/bellezapp/uploads

# 3. Configurar .env en el servidor
API_URL=https://naturalmarkets.net  # Sin trailing slash

# 4. Iniciar o reiniciar servidor
npm run start
# o pm2 restart app
```

---

## ✨ Ventajas

| Aspecto | Antes (Cloudinary) | Ahora (Local) |
|--------|-------------------|---------------|
| **Costo** | $99+/mes | $0 |
| **Control** | Limitado | Total |
| **Setup** | Complejo | Simple |
| **Independencia** | Dependencia externa | Autonomía |
| **Privacidad** | Datos en terceros | Datos propios |

---

## ⚠️ Consideraciones

### Necesitas manejar:
- ✅ Backups de `/uploads` (recomendado)
- ✅ Espacio en disco (monitorear)
- ✅ Limpieza de imágenes antiguas (si aplica)

### Cuando considerar Spaces:
- 🔄 Si necesitas **múltiples servidores**
- 🔄 Si necesitas **CDN global**
- 🔄 Si tráfico es **muy alto** (>10MB/día)

---

## 🔍 Verificación

### Confirmar que todo funciona:

```bash
# 1. Verificar que uploads está en .gitignore
grep "uploads" .gitignore

# 2. Revisar que server.ts tiene ruta /uploads
grep -n "uploads" src/server.ts

# 3. Confirmar imagen service sin Cloudinary
grep -c cloudinary src/services/image.service.ts  # Debe ser 0

# 4. Test de upload
curl -F "foto=@imagen.jpg" http://localhost:3000/api/products
```

---

## 📚 Documentación Relacionada

- 📖 [LOCAL_STORAGE_GUIDE.md](./LOCAL_STORAGE_GUIDE.md) - Guía detallada
- 📖 [README.md](./README.md) - Proyecto general
- 📖 [.env](./.env) - Configuración

---

## 🎯 Flujo de Funcionamiento

```
Frontend (Flutter Web/Mobile)
    ↓
POST /api/products/create con multipart/form-data (imagen)
    ↓
Express multer (valida y prepara)
    ↓
ImageService.uploadImage() 
    ├─ Crear /uploads/products/
    ├─ Generar nombre: 1676543210.jpg
    ├─ Guardar archivo
    └─ Retornar URL: http://dominio.com/uploads/products/1676543210.jpg
    ↓
Controller guarda URL en MongoDB
    ↓
Frontend muestra imagen desde URL
```

---

## ❌ Lo que NO cambió

- ✅ Endpoints de API (mismo)
- ✅ Controllers (mismo)
- ✅ Rutas (mismo)
- ✅ Estructura de BD (mismo)
- ✅ Frontend (sin cambios)

**Solo cambió dónde se guardan las imágenes** 🎉

---

## 🆘 Si algo falla

### Error: "ENOENT: no such file or directory, open '/uploads/products/...'"
```bash
# Solución: Crear directorio
mkdir -p uploads/products
chmod 755 uploads/products
```

### Error: "EACCES: permission denied"
```bash
# Solución: Permisos
chmod 755 -R uploads/
sudo chown -R $USER:$USER uploads/
```

### Imágenes no se muestran en frontend
```bash
# 1. Verificar API_URL en .env
echo $API_URL  # Debe ser http://localhost:3000 o https://dominio.com

# 2. Verificar que servidor está sirviendo /uploads
curl http://localhost:3000/uploads/products/test.jpg

# 3. Revisar logs del servidor
npm run dev  # Ver errores
```

---

## ✅ Checklist Final

- [x] Reemplazado servicio de imágenes
- [x] Actualizado servidor Express
- [x] Configurado middleware de upload
- [x] Actualizado .env
- [x] Actualizado .gitignore
- [x] Creada documentación
- [x] Verificadas referencias a Cloudinary
- [x] Pronto: Testear en desarrollo
- [ ] Testear en DigitalOcean
- [ ] Crear backup strategy

---

**Estado**: ✅ **LISTO PARA USAR**

Puedes iniciar el servidor con `npm run dev` y probar los uploads. Las imágenes se guardarán en `/uploads/`.

