#!/bin/bash

################################################################################
# BELLEZAPP - DigitalOcean Quick Deploy
# 
# Este script automatiza TODO el proceso de despliegue en 3 comandos
# 
# Prerrequisitos:
# 1. Droplet Ubuntu 22.04 creado en DigitalOcean
# 2. SSH acceso al droplet
# 3. Backend y frontend compilados localmente
# 4. MongoDB Atlas cluster creado
#
# Uso:
# ./quick-deploy.sh <IP_DROPLET> <MONGODB_URI> <JWT_SECRET>
#
# Ejemplo:
# ./quick-deploy.sh 192.168.1.100 "mongodb+srv://user:pass@cluster.mongodb.net/bellezapp" "abc123def456..."
#
################################################################################

# Verificar parámetros
if [ $# -lt 3 ]; then
    echo "❌ Uso: $0 <IP_DROPLET> <MONGODB_URI> <JWT_SECRET>"
    echo ""
    echo "Ejemplo:"
    echo "  $0 192.168.1.100 'mongodb+srv://user:pass@cluster.mongodb.net/bellezapp' 'abc123def456...'"
    echo ""
    echo "Obtener MONGODB_URI:"
    echo "  1. Ve a https://www.mongodb.com/cloud/atlas"
    echo "  2. Conecta tu cluster"
    echo "  3. Copia la URI (con usuario:contraseña)"
    echo ""
    echo "Generar JWT_SECRET:"
    echo "  openssl rand -hex 32"
    exit 1
fi

DROPLET_IP=$1
MONGODB_URI=$2
JWT_SECRET=$3

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          BELLEZAPP - DigitalOcean Deployment                  ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Parámetros:"
echo "  Droplet IP: $DROPLET_IP"
echo "  MongoDB: $(echo $MONGODB_URI | cut -c1-50)..."
echo "  JWT Secret: ✓ (será guardado seguro)"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar conexión SSH
echo -e "${YELLOW}[1/5] Verificando acceso SSH...${NC}"
if ! ssh -o ConnectTimeout=5 root@${DROPLET_IP} "echo '✓ SSH OK'" > /dev/null 2>&1; then
    echo -e "${RED}❌ No se pudo conectar por SSH${NC}"
    echo "Verifica:"
    echo "  - IP del droplet es correcta"
    echo "  - SSH key está configurada"
    echo "  - Firewall permite puerto 22"
    exit 1
fi
echo -e "${GREEN}✅ SSH OK${NC}"
echo ""

# 2. Ejecutar setup remoto
echo -e "${YELLOW}[2/5] Instalando paquetes en droplet...${NC}"
ssh root@${DROPLET_IP} << EOF
    set -e
    
    # Update
    apt update && apt upgrade -y
    
    # Node.js
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    # PM2, Nginx, Certbot
    npm install -g pm2
    apt install -y nginx certbot python3-certbot-nginx
    
    echo "✅ Paquetes instalados"
EOF
echo -e "${GREEN}✅ Paquetes instalados${NC}"
echo ""

# 3. Copiar código backend
echo -e "${YELLOW}[3/5] Subiendo backend...${NC}"
ssh root@${DROPLET_IP} "mkdir -p /root/apps/bellezapp-backend /root/apps/bellezapp-backend/uploads"
scp -r "lock-backend/dist" root@${DROPLET_IP}:/root/apps/bellezapp-backend/ 2>/dev/null || {
    echo -e "${RED}❌ Backend no compilado${NC}"
    echo "En tu máquina local:"
    echo "  cd lock-backend && npm run build"
    exit 1
}
scp "lock-backend/package.json" root@${DROPLET_IP}:/root/apps/bellezapp-backend/
scp "lock-backend/ecosystem.config.js" root@${DROPLET_IP}:/root/apps/bellezapp-backend/
echo -e "${GREEN}✅ Backend subido${NC}"
echo ""

# 4. Copiar código frontend
echo -e "${YELLOW}[4/5] Subiendo frontend...${NC}"
ssh root@${DROPLET_IP} "mkdir -p /var/www/naturalmarkets.net/html"
scp -r "lock-frontend/build/web/*" root@${DROPLET_IP}:/var/www/naturalmarkets.net/html/ 2>/dev/null || {
    echo -e "${RED}❌ Frontend no compilado${NC}"
    echo "En tu máquina local:"
    echo "  cd lock-frontend && flutter build web --release"
    exit 1
}
echo -e "${GREEN}✅ Frontend subido${NC}"
echo ""

# 5. Configurar y reiniciar
echo -e "${YELLOW}[5/5] Configurando aplicación...${NC}"
ssh root@${DROPLET_IP} << EOF
    set -e
    
    cd /root/apps/bellezapp-backend
    
    # Instalar dependencias
    npm install --production
    
    # Crear .env
    cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
API_URL=https://naturalmarkets.net
MONGODB_URI=${MONGODB_URI}
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRE=24h
CORS_ORIGIN=https://naturalmarkets.net
ENABLE_COMPRESSION=true
LOG_LEVEL=info
UPLOADS_DIR=./uploads
ENVEOF

    # Crear nginx config
    cat > /etc/nginx/sites-available/naturalmarkets.net << 'NGXEOF'
upstream backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name naturalmarkets.net www.naturalmarkets.net;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name naturalmarkets.net www.naturalmarkets.net;
    
    ssl_certificate /etc/letsencrypt/live/naturalmarkets.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/naturalmarkets.net/privkey.pem;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        root /var/www/naturalmarkets.net/html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
NGXEOF

    ln -sf /etc/nginx/sites-available/naturalmarkets.net /etc/nginx/sites-enabled/
    nginx -t
    systemctl reload nginx
    
    # Iniciar con PM2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    
    echo "✅ Configuración completada"
EOF

echo -e "${GREEN}✅ Aplicación configurada${NC}"
echo ""

# Resumen
echo "╔════════════════════════════════════════════════════════════════╗"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETADO${NC}"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 Próximos pasos:"
echo ""
echo "1️⃣  CONFIGURAR DOMINIO:"
echo "    - Ve a tu registrador de dominio"
echo "    - Apunta naturalmarkets.net A record a: $DROPLET_IP"
echo "    - Espera 15-30 minutos (propagación DNS)"
echo ""
echo "2️⃣  CREAR CERTIFICADO SSL:"
echo "    ssh root@$DROPLET_IP"
echo "    sudo certbot certonly --nginx -d naturalmarkets.net -d www.naturalmarkets.net"
echo ""
echo "3️⃣  VERIFICAR:"
echo "    https://naturalmarkets.net (después de DNS propagado)"
echo ""
echo "4️⃣  MONITOREO:"
echo "    ssh root@$DROPLET_IP"
echo "    pm2 logs"
echo ""
echo "5️⃣  ACTUALIZAR FRONTEND:"
echo "    ssh root@$DROPLET_IP"
echo "    scp -r lock-frontend/build/web/* root@$DROPLET_IP:/var/www/naturalmarkets.net/html/"
echo ""
echo "🔍 Para ver estado:"
echo "    ssh root@$DROPLET_IP 'pm2 list'"
echo ""
