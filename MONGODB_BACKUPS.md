# 🛡️ BACKUPS DE MONGODB LOCAL EN DIGITALOCEAN

## 📋 Resumen

Con MongoDB local en tu droplet, necesitas hacer backups regulares. Este documento explica cómo hacerlo.

---

## 🔧 CONFIGURACIÓN INICIAL

### 1. Crear directorio de backups

```bash
ssh root@<IP_DROPLET>
mkdir -p /backups/mongodb
mkdir -p /backups/mongodb/daily
mkdir -p /backups/mongodb/weekly
mkdir -p /backups/mongodb/monthly
chmod 755 /backups/mongodb
```

### 2. Verificar espacio disponible

```bash
df -h /
# Asegurar que haya al menos 5-10GB libres
```

---

## 💾 BACKUPS MANUALES

### Hacer un backup ahora

```bash
# En el droplet
mongodump --out=/backups/mongodb/$(date +%Y%m%d_%H%M%S)

# O de forma más simple
mongodump --out=/backups/mongodb/backup_$(date +%Y%m%d)

# Con compresión (recomendado para ahorrar espacio)
mongodump --archive=/backups/mongodb/backup_$(date +%Y%m%d).archive --gzip
```

### Restaurar desde backup

```bash
# Restaurar desde directorio
mongorestore /backups/mongodb/backup_20260205/

# Restaurar desde archivo comprimido
mongorestore --archive=/backups/mongodb/backup_20260205.archive --gzip
```

### Ver tamaño del backup

```bash
du -h /backups/mongodb/
ls -lh /backups/mongodb/
```

---

## ⏰ BACKUPS AUTOMÁTICOS (CRON JOB)

### 1. Crear script de backup

```bash
ssh root@<IP_DROPLET>

# Crear archivo de script
cat > /usr/local/bin/mongodb_backup.sh << 'EOF'
#!/bin/bash

# Configuración
BACKUP_DIR="/backups/mongodb/daily"
DATE=$(date +%Y%m%d_%H%M%S)
ARCHIVE="${BACKUP_DIR}/backup_${DATE}.archive"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Crear directorio si no existe
mkdir -p ${BACKUP_DIR}

# Hacer backup con compresión
echo "[$(date)] Iniciando backup..." >> ${LOG_FILE}

mongodump --archive=${ARCHIVE} --gzip >> ${LOG_FILE} 2>&1

if [ $? -eq 0 ]; then
    echo "[$(date)] Backup exitoso: ${ARCHIVE}" >> ${LOG_FILE}
    echo "[$(date)] Tamaño: $(du -h ${ARCHIVE} | cut -f1)" >> ${LOG_FILE}
else
    echo "[$(date)] ❌ BACKUP FALLÓ" >> ${LOG_FILE}
fi

# Limpiar backups antiguos (mantener últimos 7 días)
find ${BACKUP_DIR} -name "backup_*.archive" -mtime +7 -delete

EOF

# Hacer ejecutable
chmod +x /usr/local/bin/mongodb_backup.sh

# Probar el script
/usr/local/bin/mongodb_backup.sh
```

### 2. Programar con cron

```bash
ssh root@<IP_DROPLET>

# Abrir crontab
crontab -e

# Agregar estas líneas (editar con tu editor preferido, normalmente vim)
# Backup diario a las 2 AM
0 2 * * * /usr/local/bin/mongodb_backup.sh

# Backup semanal (domingos a las 3 AM)
0 3 * * 0 mongodump --archive=/backups/mongodb/weekly/backup_$(date +\%Y\%m\%d).archive --gzip

# Guardar y salir (vim: Esc, :wq, Enter)
```

### 3. Verificar que cron está activo

```bash
# Ver trabajos cron configurados
crontab -l

# Ver logs de cron (si aplica)
grep CRON /var/log/syslog
```

---

## 📤 BACKUP REMOTO (RECOMENDADO)

Para mayor seguridad, mantén copias en tu máquina local o en la nube.

### Opción 1: SCP a tu máquina local

```bash
# En tu máquina local (PowerShell o terminal)

# Crear directorio local
mkdir -p C:\Users\getc2\Backups\bellezapp-mongodb

# Descargar último backup
scp root@<IP_DROPLET>:/backups/mongodb/daily/backup_*.archive C:\Users\getc2\Backups\bellezapp-mongodb\
```

### Opción 2: S3 (AWS)

```bash
# En el droplet, instalar AWS CLI
apt install -y awscli

# Configurar credenciales
aws configure

# Script de backup a S3
cat > /usr/local/bin/mongodb_backup_s3.sh << 'EOF'
#!/bin/bash
ARCHIVE="/tmp/backup_$(date +%Y%m%d).archive"
mongodump --archive=${ARCHIVE} --gzip
aws s3 cp ${ARCHIVE} s3://tu-bucket-name/bellezapp-mongodb/
rm ${ARCHIVE}
EOF

chmod +x /usr/local/bin/mongodb_backup_s3.sh
```

### Opción 3: Google Drive / OneDrive (usando rclone)

```bash
# Instalar rclone
curl https://rclone.org/install.sh | bash

# Configurar
rclone config

# Script de backup
cat > /usr/local/bin/mongodb_backup_cloud.sh << 'EOF'
#!/bin/bash
mongodump --archive=/tmp/backup_$(date +%Y%m%d).archive --gzip
rclone copy /tmp/backup_*.archive mydrive:bellezapp-backups/
rm /tmp/backup_*.archive
EOF

chmod +x /usr/local/bin/mongodb_backup_cloud.sh
```

---

## 🔍 MONITOREAR BACKUPS

### Ver estado de backups

```bash
ssh root@<IP_DROPLET>

# Listar backups disponibles
ls -lh /backups/mongodb/daily/

# Ver tamaño total
du -sh /backups/mongodb/

# Ver último backup
ls -lth /backups/mongodb/daily/ | head -5
```

### Crear alerta si no hay backup reciente

```bash
# Script para verificar si hay backup reciente
cat > /usr/local/bin/check_backup.sh << 'EOF'
#!/bin/bash
LAST_BACKUP=$(find /backups/mongodb/daily -name "backup_*.archive" -type f -printf '%T@\n' | sort -rn | head -1)
CURRENT_TIME=$(date +%s)
BACKUP_AGE=$(( ($CURRENT_TIME - ${LAST_BACKUP%.*}) / 3600 ))

if [ ${BACKUP_AGE} -gt 25 ]; then
    echo "⚠️  ALERTA: Último backup hace ${BACKUP_AGE} horas"
    # Aquí puedes enviar un email o slack
else
    echo "✅ Backup OK: ${BACKUP_AGE} horas"
fi
EOF

chmod +x /usr/local/bin/check_backup.sh

# Programar para verificar a cada hora
# 0 * * * * /usr/local/bin/check_backup.sh
```

---

## 🚨 RECUPERACIÓN EN CASO DE DESASTRE

### Recuperar base de datos completa

```bash
ssh root@<IP_DROPLET>

# Parar MongoDB (opcional, recomendado)
sudo systemctl stop mongod

# Restaurar desde backup
mongorestore --archive=/backups/mongodb/daily/backup_20260205.archive --gzip

# Iniciar MongoDB
sudo systemctl start mongod

# Verificar que está OK
mongosh
> use bellezapp
> db.collections()
```

### Recuperar una colección específica

```bash
# Listar colecciones en el backup
mongorestore --archive=/backups/mongodb/daily/backup_20260205.archive --gzip --dumpDbUsersAndRoles --dumpDbUsersAndRoles

# Restaurar solo una colección
mongorestore --archive=/backups/mongodb/daily/backup_20260205.archive --gzip --nsInclude="bellezapp.products"
```

---

## 📊 POLÍTICAS DE BACKUP RECOMENDADAS

| Tipo | Frecuencia | Retención | Almacenamiento |
|------|-----------|-----------|-----------------|
| Diarios | Cada noche (2 AM) | 7 días | Droplet local |
| Semanales | Domingos (3 AM) | 4 semanas | Droplet local |
| Mensuales | 1º día (4 AM) | 12 meses | Cloud (S3/Drive) |
| Críticos | Después de cambios grandes | Indefinido | Cloud + Local |

---

## 🔧 SCRIPT COMPLETO (ALL-IN-ONE)

```bash
cat > /usr/local/bin/backup_management.sh << 'EOF'
#!/bin/bash

# BELLEZAPP MongoDB Backup Management Script

BACKUP_BASE="/backups/mongodb"
RETENTION_DAILY=7
RETENTION_WEEKLY=30
RETENTION_MONTHLY=365

# Crear directorio si no existe
mkdir -p ${BACKUP_BASE}/daily
mkdir -p ${BACKUP_BASE}/weekly
mkdir -p ${BACKUP_BASE}/monthly

# Función para backup
backup_mongo() {
    local type=$1
    local dir="${BACKUP_BASE}/${type}"
    local archive="${dir}/backup_$(date +%Y%m%d_%H%M%S).archive"
    
    echo "[$(date)] Iniciando backup ${type}..."
    mongodump --archive=${archive} --gzip
    
    if [ $? -eq 0 ]; then
        echo "[$(date)] ✅ Backup ${type} exitoso"
        echo "[$(date)] Tamaño: $(du -h ${archive} | cut -f1)"
    else
        echo "[$(date)] ❌ Backup ${type} FALLÓ"
        return 1
    fi
}

# Limpiar backups antiguos
cleanup_backups() {
    echo "[$(date)] Limpiando backups antiguos..."
    
    find ${BACKUP_BASE}/daily -name "backup_*.archive" -mtime +${RETENTION_DAILY} -delete
    find ${BACKUP_BASE}/weekly -name "backup_*.archive" -mtime +${RETENTION_WEEKLY} -delete
    find ${BACKUP_BASE}/monthly -name "backup_*.archive" -mtime +${RETENTION_MONTHLY} -delete
    
    echo "[$(date)] ✅ Limpieza completada"
}

# Determinar tipo de backup basado en día de la semana
day_of_week=$(date +%u)
day_of_month=$(date +%d)

if [ ${day_of_month} -eq 1 ]; then
    backup_mongo "monthly"
elif [ ${day_of_week} -eq 0 ]; then
    backup_mongo "weekly"
else
    backup_mongo "daily"
fi

cleanup_backups
EOF

chmod +x /usr/local/bin/backup_management.sh

# Programar en cron
# 0 2 * * * /usr/local/bin/backup_management.sh
```

---

## ✅ CHECKLIST DE BACKUPS

- [ ] Script de backup creado en `/usr/local/bin/`
- [ ] Cron job programado
- [ ] Primer backup ejecutado manualmente
- [ ] Directorio de backups tiene espacio (5-10GB)
- [ ] Backup remoto configurado (S3/Drive)
- [ ] Verificación de backup reciente configurada
- [ ] Tested: Restaurar desde backup (al menos 1 vez)
- [ ] Documentado en tu wiki/readme del equipo

---

## 📞 COMANDOS RÁPIDOS

```bash
# Ver todos los backups
find /backups/mongodb -type f -name "*.archive" | sort

# Tamaño total
du -sh /backups/mongodb/

# Último backup
ls -lth /backups/mongodb/daily | head -1

# Listar colecciones en backup
mongorestore --archive=/backups/mongodb/daily/backup_20260205.archive --gzip --listCollections

# Hacer backup manual
mongodump --archive=/backups/mongodb/manual_$(date +%Y%m%d_%H%M%S).archive --gzip

# Ver logs
tail -f /backups/mongodb/daily/backup.log
```

---

## 🚀 PRÓXIMOS PASOS

1. **Hoy**: Crear script de backup manual
2. **Hoy**: Hacer primer backup
3. **Mañana**: Programar cron job
4. **Mañana**: Configurar backup remoto
5. **Semana**: Hacer test de restauración
