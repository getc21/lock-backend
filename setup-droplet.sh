#!/bin/bash

################################################################################
# BELLEZAPP - DigitalOcean Droplet Setup Script
# 
# Este script configura completamente un droplet para ejecutar:
# - Backend Node.js/Express/TypeScript
# - Frontend Flutter Web (archivos estáticos)
# - SSL con Let's Encrypt
# - PM2 para auto-restart
# - Nginx como reverse proxy
#
# Uso:
# chmod +x setup-droplet.sh
# ./setup-droplet.sh
################################################################################

set -e  # Exit on error

echo "======================================"
echo "BELLEZAPP - DigitalOcean Setup"
echo "======================================"

# Colors para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Variables
DOMAIN="naturalmarkets.net"
APP_DIR="/root/apps/bellezapp-backend"
WEB_DIR="/var/www/naturalmarkets.net/html"
NODE_VERSION="20"

# 1. Update Sistema
echo -e "${YELLOW}[1/10] Actualizando sistema...${NC}"
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git build-essential

# 2. Instalar Node.js
echo -e "${YELLOW}[2/10] Instalando Node.js ${NODE_VERSION}...${NC}"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt install -y nodejs
node --version
npm --version

# 3. Instalar PM2
echo -e "${YELLOW}[3/10] Instalando PM2...${NC}"
sudo npm install -g pm2
pm2 --version

# 4. Instalar Nginx
echo -e "${YELLOW}[4/10] Instalando Nginx...${NC}"
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 5. Instalar Certbot (SSL)
echo -e "${YELLOW}[5/10] Instalando Certbot...${NC}"
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --version

# 6. Instalar MongoDB (local en el droplet)
echo -e "${YELLOW}[6/10] Instalando MongoDB...${NC}"
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo mkdir -p /data/db
sudo chown -R mongodb:mongodb /data/db
sudo systemctl enable mongod
sudo systemctl start mongod
mongosh --version
echo -e "${GREEN}✅ MongoDB instalado y corriendo${NC}"

# 7. Crear directorios
echo -e "${YELLOW}[7/10] Creando directorios...${NC}"
sudo mkdir -p ${APP_DIR}
sudo mkdir -p ${WEB_DIR}
sudo mkdir -p ${APP_DIR}/logs
sudo chown -R $USER:$USER /root/apps
sudo chown -R $USER:$USER /var/www/naturalmarkets.net

# 8. Preparar backend (asume que ya está descargado)
echo -e "${YELLOW}[8/10] Preparando backend...${NC}"
if [ ! -f "${APP_DIR}/package.json" ]; then
    echo -e "${RED}❌ Backend no encontrado en ${APP_DIR}${NC}"
    echo "Por favor copia los archivos del backend a ${APP_DIR}"
    exit 1
fi

cd ${APP_DIR}
npm install --production
npm run build

# 9. Crear archivo .env
echo -e "${YELLOW}[9/10] Configurando .env...${NC}"
if [ ! -f "${APP_DIR}/.env" ]; then
    cat > ${APP_DIR}/.env << EOF
# BELLEZAPP Backend - Configuración de Producción
NODE_ENV=production
PORT=3000

# Database - MongoDB Local (en el droplet)
MONGODB_URI=mongodb://localhost:27017/bellezapp

# JWT - GENERA UN VALOR ALEATORIO SEGURO
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRE=24h

# Server
HOST=0.0.0.0
ENABLE_COMPRESSION=true

# CORS
CORS_ORIGIN=https://${DOMAIN}

# Logging
LOG_LEVEL=info
EOF
    echo -e "${GREEN}✅ .env creado en ${APP_DIR}/.env${NC}"
    echo -e "${YELLOW}⚠️  EDITA EL .env SI NECESITAS CAMBIOS${NC}"
else
    echo -e "${YELLOW}⚠️  .env ya existe, verifica que esté correcto${NC}"
fi

# 10. Configurar Nginx
echo -e "${YELLOW}[10/10] Configurando Nginx...${NC}"

# Copiar config
sudo cp ${APP_DIR}/nginx-naturalmarkets.net.conf /etc/nginx/sites-available/${DOMAIN}
sudo ln -sf /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/

# Verificar config
sudo nginx -t

# Crear directorio temporal para certbot
sudo mkdir -p /var/www/certbot

# Recargar Nginx
sudo systemctl reload nginx

# SSL con Let's Encrypt
echo -e "${YELLOW}Solicitando certificado SSL de Let's Encrypt...${NC}"
echo "Email para Let's Encrypt:"
read -r email

sudo certbot certonly --webroot -w /var/www/certbot -d ${DOMAIN} -d www.${DOMAIN} --email ${email} --agree-tos

# Recargar Nginx con SSL
sudo systemctl reload nginx

# 11. Iniciar backend con PM2
echo -e "${YELLOW}Iniciando aplicación con PM2...${NC}"
cd ${APP_DIR}
pm2 start ecosystem.config.js --name "bellezapp-backend"
pm2 save
pm2 startup

# 12. Copiar frontend (asume que ya está en build/web)
echo -e "${YELLOW}Instalando frontend (archivos estáticos)...${NC}"
echo "¿Copiar archivos de frontend? (s/n)"
read -r copy_web
if [ "$copy_web" = "s" ]; then
    echo "Ruta de los archivos: (ej: /home/usuario/Projects/bellezapp-frontend/build/web)"
    read -r web_src
    if [ -d "$web_src" ]; then
        sudo cp -r ${web_src}/* ${WEB_DIR}/
        sudo chown -R www-data:www-data ${WEB_DIR}
        echo -e "${GREEN}✅ Archivos copiados${NC}"
    else
        echo -e "${RED}❌ Ruta no existe${NC}"
    fi
fi

# Resumen final
echo ""
echo "======================================"
echo -e "${GREEN}✅ SETUP COMPLETADO${NC}"
echo "======================================"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Verificar que MongoDB está corriendo:"
echo "   sudo systemctl status mongod"
echo ""
echo "2. Verificar .env (debería tener JWT_SECRET generado):"
echo "   cat ${APP_DIR}/.env"
echo ""
echo "3. Ver logs:"
echo "   pm2 logs"
echo ""
echo "4. Configurar DNS (A record):"
echo "   ${DOMAIN} → $(curl -s https://api.ipify.org)"
echo ""
echo "5. Crear certificado SSL:"
echo "   sudo certbot certonly --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""
echo "6. Prueba de conexión MongoDB:"
echo "   mongosh"
echo "   > use bellezapp"
echo "   > db.test.insertOne({createdAt: new Date()})"
echo ""
echo "📊 Comandos útiles:"
echo "   pm2 list              # Ver estado de apps"
echo "   pm2 restart all       # Reiniciar"
echo "   pm2 logs             # Ver logs en vivo"
echo "   sudo systemctl status mongod  # Estado MongoDB"
echo "   sudo systemctl restart mongod # Reiniciar MongoDB"
echo ""
