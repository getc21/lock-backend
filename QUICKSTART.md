# 🚀 Guía de Inicio Rápido - Bellezapp Backend POS

## ⚡ Inicio en 5 Minutos

### 1️⃣ Verificar MongoDB

Asegúrate de que MongoDB esté corriendo:

```powershell
# Windows - Verificar servicio
Get-Service MongoDB

# Si no está corriendo, iniciarlo:
net start MongoDB
```

### 2️⃣ Configurar Variables de Entorno

El archivo `.env` ya existe. Verifica/edita según tu configuración:

```powershell
# Ver contenido actual
Get-Content .env
```

Configuración mínima necesaria:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bellezapp
JWT_SECRET=cambiar_este_secreto_en_produccion_12345
```

### 3️⃣ Iniciar el Servidor

```powershell
npm run dev
```

Deberías ver:
```
🚀 Server is running on port 3000
📍 Environment: development
✅ Connected to MongoDB successfully
```

### 4️⃣ Probar la API

Abre un nuevo terminal o usa Postman/Thunder Client:

#### Health Check
```powershell
curl http://localhost:3000/health
```

#### Registrar Usuario Admin
```powershell
$body = @{
    username = "admin"
    email = "admin@bellezapp.com"
    password = "admin123"
    firstName = "Admin"
    lastName = "Sistema"
    role = "admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

#### Login
```powershell
$credentials = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $credentials -ContentType "application/json"

# Guardar el token
$token = $response.token
Write-Host "Token: $token"
```

#### Crear una Tienda
```powershell
$store = @{
    name = "Sucursal Principal"
    address = "Av. Principal 123"
    phone = "555-0100"
    email = "principal@bellezapp.com"
    status = "active"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/stores" -Method POST -Body $store -Headers $headers
```

## 📋 Endpoints Principales

### Base URL: `http://localhost:3000/api`

| Categoría | Endpoint | Método | Descripción |
|-----------|----------|--------|-------------|
| Auth | `/auth/register` | POST | Registrar usuario |
| Auth | `/auth/login` | POST | Iniciar sesión |
| Stores | `/stores` | GET, POST | Gestionar tiendas |
| Products | `/products` | GET, POST | Gestionar productos |
| Orders | `/orders` | GET, POST | Crear/consultar ventas |
| Cash | `/cash/register/open` | POST | Abrir caja |
| Customers | `/customers` | GET, POST | Gestionar clientes |

## 🔑 Autenticación

Después del login, usa el token en todas las peticiones:

```powershell
$headers = @{
    "Authorization" = "Bearer TU_TOKEN_AQUI"
    "Content-Type" = "application/json"
}
```

## 🐛 Solución de Problemas

### MongoDB no conecta
```powershell
# Verificar servicio
Get-Service MongoDB

# Iniciar servicio
net start MongoDB
```

### Puerto 3000 ocupado
Cambia el puerto en `.env`:
```env
PORT=3001
```

### Token inválido
El token expira en 7 días. Si ves errores 401, haz login nuevamente.

## 📚 Siguiente Paso

Lee [README.md](./README.md) para documentación completa de todos los endpoints.

---

**¿Todo funcionando? ¡Ahora adapta tu frontend Flutter! 🎨**
