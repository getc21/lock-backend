# GUÍA COMPLETA: Deploy a DigitalOcean Droplet

## ✅ PRE-REQUISITOS

### En tu máquina local:
- [ ] Backend compilado: `npm run build` ✅
- [ ] Frontend compilado: `flutter build web --release` ✅
- [ ] CORS actualizado en `src/server.ts` ✅
- [ ] Archivos `ecosystem.config.js` y `nginx-naturalmarkets.net.conf` descargados ✅

### En DigitalOcean:
- [ ] Droplet creado (Ubuntu 22.04, mínimo 2GB RAM)
- [ ] SSH key configurada
- [ ] Dominio `naturalmarkets.net` apuntando al Droplet
  - A record: `naturalmarkets.net` → IP del droplet
  - A record: `www.naturalmarkets.net` → IP del droplet

---

## 🚀 PASO 1: Crear DigitalOcean Droplet

1. Ve a https://cloud.digitalocean.com
2. Click "Create" → "Droplet"
3. Configuración:
   - **Image**: Ubuntu 22.04 x64
   - **Size**: $5/mes (2GB RAM mínimo)
   - **Region**: Cercano a tu ubicación
   - **VPC**: default
   - **Authentication**: SSH key (o password)
4. Click "Create Droplet"
5. Espera 2-3 minutos a que esté listo

Anota la IP del droplet: `XXX.XXX.XXX.XXX`

---

## 🔐 PASO 2: Conectar al Droplet

```bash
# En PowerShell (Windows)
ssh root@XXX.XXX.XXX.XXX

# En terminal (Mac/Linux)
ssh -i ~/.ssh/id_rsa root@XXX.XXX.XXX.XXX
```

Si recibes advertencia de seguridad, escribe `yes`

---

## 📥 PASO 3: Subir archivos del Backend

En tu máquina local (otra terminal/PowerShell):

```bash
# Crear directorio en el droplet
ssh root@XXX.XXX.XXX.XXX "mkdir -p /root/apps/bellezapp-backend"

# Subir archivos
scp -r "c:\Users\getc2\Desktop\BELLEAPP\lock-backend\*" root@XXX.XXX.XXX.XXX:/root/apps/bellezapp-backend/

# O si tienes Git:
ssh root@XXX.XXX.XXX.XXX
cd /root/apps
git clone https://github.com/tu-usuario/bellezapp-backend.git
cd bellezapp-backend
```

---

## 🔧 PASO 4: Ejecutar Script de Setup

En el droplet (en la sesión SSH):

```bash
# Descargar el script
cd /root/apps/bellezapp-backend
chmod +x setup-droplet.sh

# Ejecutar
./setup-droplet.sh
```

El script hará:
- ✅ Actualizar sistema
- ✅ Instalar Node.js
- ✅ Instalar PM2
- ✅ Instalar Nginx
- ✅ Instalar Certbot (SSL)
- ✅ Configurar directorios
- ✅ Generar .env (IMPORTANTE: debes editar)
- ✅ Crear certificados SSL
- ✅ Iniciar aplicación

---

## ⚙️ PASO 5: Configurar .env (CRÍTICO)

En el droplet:

```bash
nano /root/apps/bellezapp-backend/.env
```

Editar y reemplazar:

```env
# Database - Tu conexión MongoDB Atlas
MONGODB_URI=mongodb+srv://tu_usuario:tu_password@cluster.mongodb.net/bellezapp?retryWrites=true&w=majority

# JWT - El script lo genera, pero verifica que sea diferente cada vez
JWT_SECRET=aqui_tu_valor_que_genero_el_script

# Dominio
API_URL=https://naturalmarkets.net
CORS_ORIGIN=https://naturalmarkets.net
```

Guardar: `Ctrl+X` → `Y` → `Enter`

Reiniciar backend:
```bash
pm2 restart all
```

---

## 📂 PASO 6: Subir Frontend

En tu máquina local:

```bash
# Asegurar que existe build/web
cd c:\Users\getc2\Desktop\BELLEAPP\lock-frontend
flutter build web --release

# Subir archivos
scp -r "build\web\*" root@XXX.XXX.XXX.XXX:/var/www/naturalmarkets.net/html/
```

O en el droplet, si tienes el repo:

```bash
# En el droplet
cd /root/apps
git clone https://github.com/tu-usuario/bellezapp-frontend.git
cd bellezapp-frontend
flutter build web --release
sudo cp -r build/web/* /var/www/naturalmarkets.net/html/
```

---

## 🔒 PASO 7: SSL/HTTPS (Certbot)

Ya se configura en el script, pero verifica:

```bash
# En el droplet
sudo certbot certificates

# Si no aparece, crear manualmente:
sudo certbot certonly --nginx -d naturalmarkets.net -d www.naturalmarkets.net
```

---

## ✅ PASO 8: Verificar

En tu máquina local:

```bash
# 1. Probar backend
curl -X GET https://naturalmarkets.net/api/auth/profile \
  -H "Authorization: Bearer tu_token_aqui"

# 2. Visitar en navegador
https://naturalmarkets.net

# Deberías ver:
# - Frontend cargado
# - Sin errores SSL
# - API respondiendo
```

---

## 📊 PASO 9: Monitoreo Continuo

En el droplet:

```bash
# Ver logs en vivo
pm2 logs

# Ver estado de apps
pm2 list

# Ver métricas
pm2 monit

# Logs de Nginx
sudo tail -f /var/log/nginx/naturalmarkets_access.log
sudo tail -f /var/log/nginx/naturalmarkets_error.log

# MongoDB (si está local)
sudo systemctl status mongod
```

---

## 🔄 Mantener Actualizado

```bash
# Descargar cambios del repo
cd /root/apps/bellezapp-backend
git pull origin main

# Recompilar
npm run build

# Reiniciar
pm2 restart all

# Para frontend
cd /root/apps/bellezapp-frontend
git pull origin main
flutter build web --release
sudo cp -r build/web/* /var/www/naturalmarkets.net/html/
```

---

## 🆘 Solución de Problemas

### "Connection refused"
```bash
# Backend no está corriendo
pm2 logs  # Ver error
pm2 restart all
```

### "SSL certificate error"
```bash
# Renovar certificado
sudo certbot renew --dry-run
sudo certbot renew
```

### "502 Bad Gateway"
```bash
# Nginx no puede conectar a backend
pm2 list  # ¿Backend corriendo?
netstat -tlnp | grep 3000  # ¿Puerto 3000 abierto?
sudo nginx -t  # ¿Nginx config OK?
```

### "MongoDB connection error"
```bash
# Verificar conexión string en .env
# Si usas Atlas, verificar:
# 1. IP whitelist en MongoDB Atlas
# 2. Usuario y contraseña correctos
# 3. Nombre de base de datos correcto

# Si usas local:
sudo systemctl status mongod
mongo  # Conectar a shell
```

---

## 📈 Checklist Final

- [ ] Droplet creado y SSH funcionando
- [ ] Backend subido y compilado
- [ ] MongoDB configurado (Atlas o local)
- [ ] .env actualizado con valores reales
- [ ] Frontend subido
- [ ] SSL funcionando (sin errores en navegador)
- [ ] API respondiendo en `https://naturalmarkets.net/api/...`
- [ ] Frontend cargando correctamente
- [ ] PM2 autorestart configurado
- [ ] Logs monitoreados

---

## 🎉 ¡Listo!

Tu aplicación está corriendo en `https://naturalmarkets.net`

Próximos pasos:
1. Test completo desde mobile y web
2. Configurar backups automáticos
3. Monitoreo 24/7
4. Documentar proceso para tu equipo
