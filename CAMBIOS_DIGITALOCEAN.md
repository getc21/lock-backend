# ✅ CAMBIOS REQUERIDOS PARA DIGITALOCEAN DROPLET

## 📋 Resumen

Para desplegar en DigitalOcean droplet necesitas:

1. ✅ **Actualizar CORS en backend** (YA HECHO)
2. ✅ **Crear ecosystem.config.js para PM2** (YA HECHO)
3. ✅ **Crear nginx config** (YA HECHO)
4. ✅ **Crear setup script** (YA HECHO)
5. ⚠️ **Configurar MongoDB** (FALTA - Tu decisión)
6. ⚠️ **Generar JWT_SECRET seguro** (FALTA - Se hace en droplet)
7. ⚠️ **Compilar backend y frontend** (FALTA - Lo haces antes de subir)

---

## 🔧 CAMBIOS YA REALIZADOS

### 1. Backend `src/server.ts` - CORS Actualizado ✅

**Qué se cambió:**
```typescript
// ANTES (solo localhost)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  // ...
];

// AHORA (incluye tu dominio de producción)
const allowedOrigins = [
  'https://naturalmarkets.net',
  'https://www.naturalmarkets.net',
  'http://localhost:3000',  // Keep para desarrollo
  // ...
];
```

✅ Cambio aplicado automáticamente

---

## 📦 ARCHIVOS NUEVOS CREADOS (Cópia a tu repo)

### 1. `ecosystem.config.js` ✅
**Ubicación**: Raíz del `lock-backend/`
**Qué hace**: Configura PM2 para que:
- Corra la app en cluster mode (usa todos los CPU cores)
- Auto-restart si falla
- Logs persistentes
- Auto-start en reboot

**Usar**:
```bash
cd lock-backend
pm2 start ecosystem.config.js
```

### 2. `nginx-naturalmarkets.net.conf` ✅
**Ubicación**: Raíz del `lock-backend/` (copiar a droplet)
**Qué hace**: Configura Nginx para:
- Servir frontend en `/`
- Proxy backend en `/api/`
- SSL/HTTPS
- Compresión gzip
- Headers de seguridad

**Usar en droplet**:
```bash
sudo cp nginx-naturalmarkets.net.conf /etc/nginx/sites-available/naturalmarkets.net
```

### 3. `setup-droplet.sh` ✅
**Ubicación**: Raíz del `lock-backend/` (copiar a droplet)
**Qué hace**: Script automatizado que:
- Actualiza Ubuntu
- Instala Node.js, PM2, Nginx, Certbot
- Crea directorios
- Compila backend
- Genera .env
- Crea certificados SSL

**Usar en droplet**:
```bash
chmod +x setup-droplet.sh
./setup-droplet.sh
```

### 4. `DIGITALOCEAN_DEPLOY_GUIDE.md` ✅
**Ubicación**: Raíz del `lock-backend/`
**Qué es**: Guía paso-a-paso completa con:
- Cómo crear droplet
- Cómo conectar SSH
- Cómo ejecutar script
- Cómo configurar .env
- Cómo subir frontend
- Cómo verificar que todo funcione
- Solución de problemas

---

## 🔴 PASOS QUE FALTA HACER (TÚ)

### Paso 1: Compilar Backend

```bash
cd c:\Users\getc2\Desktop\BELLEAPP\lock-backend

# Limpiar build anterior
npm run build

# Verificar que no hay errores
# Deberías ver: "dist/" con archivos compilados
```

### Paso 2: Compilar Frontend

```bash
cd c:\Users\getc2\Desktop\BELLEAPP\lock-frontend

# Limpiar y compilar
flutter clean
flutter build web --release

# Verificar que existe build/web/ con archivos
```

### Paso 3: Crear Droplet en DigitalOcean

1. Ve a https://cloud.digitalocean.com
2. "Create" → "Droplet"
3. Ubuntu 22.04, $5/mes, SSH key
4. Anota la IP: `XXX.XXX.XXX.XXX`

### Paso 4: Configurar Dominio

1. En tu registrador de dominio (namecheap, godaddy, etc)
2. Crear A records:
   - `naturalmarkets.net` → IP del droplet
   - `www.naturalmarkets.net` → IP del droplet
3. Esperar 15-30 minutos (propagación DNS)

### Paso 5: Subir Código y Ejecutar Script

Sigue la guía: `DIGITALOCEAN_DEPLOY_GUIDE.md`

En resumen:
```bash
# Tu máquina local
scp -r "lock-backend/*" root@XXX.XXX.XXX.XXX:/root/apps/bellezapp-backend/
scp -r "lock-frontend/build/web/*" root@XXX.XXX.XXX.XXX:/var/www/naturalmarkets.net/html/

# En el droplet
ssh root@XXX.XXX.XXX.XXX
cd /root/apps/bellezapp-backend
chmod +x setup-droplet.sh
./setup-droplet.sh
```

### Paso 6: Editar .env en Droplet

```bash
# En el droplet
nano /root/apps/bellezapp-backend/.env

# Editar:
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/bellezapp
JWT_SECRET=el_que_genere_el_script
```

Guardar y reiniciar:
```bash
pm2 restart all
pm2 logs  # Ver que no hay errores
```

---

## 📊 ESTADO ACTUAL

| Componente | Estado | Acción |
|-----------|--------|--------|
| Backend código | ✅ Listo | Ya compilado |
| Backend CORS | ✅ Actualizado | Ya cambiado |
| ecosystem.config.js | ✅ Creado | Ya en repo |
| nginx config | ✅ Creada | Ya en repo |
| setup script | ✅ Creado | Ya en repo |
| Frontend código | ✅ Listo | Compilar antes de subir |
| MongoDB | ⚠️ Sin configurar | Crea cluster en MongoDB Atlas |
| JWT_SECRET | ⚠️ Sin definir | Se genera en droplet |
| Dominio DNS | ⚠️ Sin apuntar | Apunta a IP del droplet |
| Droplet | ⚠️ No creado | Crear en DO |

---

## ✅ CHECKLIST FINAL

Antes de ejecutar `setup-droplet.sh`:

- [ ] Backend compilado: `npm run build` exitoso
- [ ] Frontend compilado: `flutter build web --release` exitoso
- [ ] `ecosystem.config.js` descargado a tu máquina
- [ ] `nginx-naturalmarkets.net.conf` descargado
- [ ] `setup-droplet.sh` descargado
- [ ] `DIGITALOCEAN_DEPLOY_GUIDE.md` leído y entendido
- [ ] Droplet creado en DigitalOcean
- [ ] SSH key configurada
- [ ] Dominio apuntando a IP del droplet

Después de `setup-droplet.sh`:

- [ ] Script ejecutado sin errores
- [ ] .env editado con valores reales
- [ ] Backend reiniciado: `pm2 restart all`
- [ ] SSL certificado generado (visitaste https://naturalmarkets.net)
- [ ] Frontend subido a `/var/www/naturalmarkets.net/html/`
- [ ] Verificado en navegador: https://naturalmarkets.net funciona

---

## 🚀 Próximos Pasos

1. **Hoy**: Compilar backend y frontend
2. **Hoy**: Crear droplet en DigitalOcean
3. **Hoy**: Apuntar dominio a droplet
4. **Mañana**: Ejecutar script en droplet
5. **Mañana**: Editar .env y reiniciar
6. **Mañana**: Verificar en navegador

---

## 📞 Soporte

Si tienes problemas:
1. Lee `DIGITALOCEAN_DEPLOY_GUIDE.md` sección "Solución de Problemas"
2. Revisa logs: `pm2 logs` (backend) o `sudo tail -f /var/log/nginx/naturalmarkets_error.log` (nginx)
3. Verifica MongoDB está conectado y .env es correcto
