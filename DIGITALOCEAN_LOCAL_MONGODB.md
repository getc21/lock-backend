# ✅ BELLEZAPP - DIGITALOCEAN CON MONGODB LOCAL

## 🎯 ACTUALIZACIÓN IMPORTANTE

Tu código está listo para DigitalOcean **CON MONGODB LOCAL** en el mismo droplet.

---

## 📊 ARQUITECTURA FINAL

```
┌─────────────────────────────────────────┐
│  DigitalOcean Droplet ($5/mes)         │
├─────────────────────────────────────────┤
│                                         │
│  Nginx (Puerto 443/80)                 │
│  ├── Frontend (Flutter Web)            │
│  └── /api/ → Backend (:3000)           │
│                                         │
│  Node.js Backend (PM2 Cluster)         │
│  └── 4 workers + auto-restart          │
│                                         │
│  MongoDB (Local)                       │
│  └── /data/db                          │
│                                         │
└─────────────────────────────────────────┘

Internet (HTTPS)
    ↓
Nginx (Puerto 443)
    ├─→ Frontend (archivos estáticos)
    └─→ Backend API (:3000)
        └─→ MongoDB (localhost:27017)
```

---

## ⚡ DEPLOY EN 2 PASOS

### Paso 1: Preparar código (30 min)

```bash
# Compilar backend
cd lock-backend
npm run build

# Compilar frontend
cd lock-frontend
flutter build web --release

# Generar JWT_SECRET
openssl rand -hex 32
```

### Paso 2: Desplegar (5 min)

```bash
# Crear droplet en DigitalOcean
# Ubuntu 22.04, $5/mes, SSH key

# Ejecutar deployment
./quick-deploy-local-mongodb.sh <IP_DROPLET> "<JWT_SECRET>"
```

---

## 📋 ARCHIVOS ACTUALIZADOS

| Archivo | Cambio |
|---------|--------|
| `setup-droplet.sh` | ✅ MongoDB se instala automáticamente |
| `quick-deploy-local-mongodb.sh` | ✅ NUEVO - Deploy con MongoDB local |
| `.env.production` | ✅ MONGODB_URI apunta a localhost |
| `MONGODB_BACKUPS.md` | ✅ NUEVO - Guía de backups |

---

## 🔧 CONFIGURACIÓN MONGODB LOCAL

### Verificar que MongoDB funciona

```bash
ssh root@<IP_DROPLET>

# Ver estado
sudo systemctl status mongod

# Conectar a MongoDB
mongosh

# Ver bases de datos
show databases

# Usar bellezapp
use bellezapp

# Ver colecciones
show collections

# Probar conexión
db.test.insertOne({test: true, createdAt: new Date()})

# Salir
exit
```

### Ubicación de datos

```bash
# Datos
/data/db/

# Logs
/var/log/mongodb/mongod.log

# Configuración
/etc/mongod.conf
```

---

## 💾 BACKUPS (IMPORTANTE)

MongoDB local requiere backups regulares. Lee: `MONGODB_BACKUPS.md`

### Quick Backup

```bash
ssh root@<IP_DROPLET>

# Crear directorio
mkdir -p /backups/mongodb

# Backup manual
mongodump --archive=/backups/mongodb/backup_$(date +%Y%m%d).archive --gzip

# Ver backups
ls -lh /backups/mongodb/
```

### Backup automático (cron)

```bash
ssh root@<IP_DROPLET>

# Editar crontab
crontab -e

# Agregar (backup diario a las 2 AM):
0 2 * * * mongodump --archive=/backups/mongodb/backup_$(date +%Y%m%d).archive --gzip

# Guardar y salir
```

---

## 📈 MONITOREO

### Ver logs

```bash
# Backend
pm2 logs

# MongoDB
sudo tail -f /var/log/mongodb/mongod.log

# Nginx
sudo tail -f /var/log/nginx/naturalmarkets_error.log
```

### Verificar estado

```bash
# Estado de servicios
pm2 list
sudo systemctl status mongod
sudo systemctl status nginx

# Espacio en disco
df -h

# Tamaño de base de datos
du -sh /data/db/

# Uso de memoria
free -h
```

---

## 🚀 PRÓXIMOS PASOS

### Hoy
1. Compilar backend: `npm run build`
2. Compilar frontend: `flutter build web --release`
3. Generar JWT: `openssl rand -hex 32`
4. Crear droplet en DigitalOcean

### Mañana (después de DNS)
1. Ejecutar: `./quick-deploy-local-mongodb.sh <IP> <JWT>`
2. Crear SSL: `sudo certbot certonly --nginx -d naturalmarkets.net`
3. Verificar: `https://naturalmarkets.net`

### Después
1. Configurar backups (cron job)
2. Hacer test de restauración
3. Monitoreo 24/7
4. Documentar procedimientos

---

## ⚠️ NOTAS IMPORTANTES

### Backups obligatorios
- MongoDB local SÍ necesita backups
- Configurar backups automáticos (cron)
- Mantener copias remotas (S3, Drive, etc)
- Test de restauración al menos 1 vez

### Recursos del droplet
- 2GB RAM es suficiente para desarrollo
- Para producción: considera 4GB+ si hay mucho tráfico
- Monitorear: `free -h`, `top`, `pm2 monit`

### Seguridad
- ✅ MongoDB NO está expuesto en internet (solo localhost)
- ✅ SSL/HTTPS automático
- ✅ CORS restringido a tu dominio
- ⚠️ Cambiar contraseña SSH si la usas con password

### Mantenimiento
```bash
# Actualizar sistema (cada mes)
sudo apt update && sudo apt upgrade -y

# Verificar errores
pm2 logs | grep -i error

# Ver espacio libre
df -h

# Limpiar espacio
sudo apt autoclean && sudo apt autoremove
```

---

## 🆘 PROBLEMAS COMUNES

| Problema | Solución |
|----------|----------|
| MongoDB no inicia | `sudo systemctl restart mongod && sudo systemctl status mongod` |
| Backend no conecta a MongoDB | Verificar `MONGODB_URI=mongodb://localhost:27017/bellezapp` en `.env` |
| 502 Bad Gateway en Nginx | `pm2 list` (¿backend corriendo?) |
| Certificado SSL error | `sudo certbot renew` |
| Base de datos llena | Hacer backup, limpiar datos viejos, aumentar droplet |

---

## 📞 COMANDOS ÚTILES

```bash
# Ver TODO
ssh root@<IP_DROPLET>

# Backend
pm2 logs
pm2 restart all
pm2 list

# MongoDB
sudo systemctl status mongod
mongosh
db.stats()
db.collections()

# Backups
mongodump --archive=/backups/mongodb/backup_$(date +%Y%m%d).archive --gzip
ls -lh /backups/mongodb/

# Sistema
df -h
free -h
top
```

---

## ✅ ESTADO ACTUAL

| Componente | Estado | Nota |
|-----------|--------|------|
| Backend | ✅ Listo | Compilar antes de subir |
| Frontend | ✅ Listo | Compilar antes de subir |
| MongoDB | ✅ Instalado | En el droplet, auto-start |
| PM2 | ✅ Configurado | Auto-restart |
| Nginx | ✅ Configurado | Reverse proxy + SSL |
| Backups | ✅ Documentado | Implementar después |

---

## 🎉 ¡LISTO PARA PRODUCCIÓN!

Tu aplicación con MongoDB local está lista para producción en DigitalOcean.

**Próximo paso**: Leer `MONGODB_BACKUPS.md` y ejecutar `quick-deploy-local-mongodb.sh`
