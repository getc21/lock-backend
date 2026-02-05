# 🔍 DIAGNÓSTICO DE RENDIMIENTO - BACKEND LENTO

## Problemas Identificados:

### 1. ❌ **CORS origen '*' (MUY LENTO en desarrollo)**
- **Ubicación:** `server.ts` línea 38
- **Problema:** Permitir todos los orígenes (`'*'`) causa overhead en cada request
- **Impacto:** Añade ~50-100ms por request
- **Solución:** Usar lista de orígenes específicos

### 2. ⚠️ **Morgan en modo 'dev' (logging detallado)**
- **Ubicación:** `server.ts` línea 50
- **Problema:** Loguea cada request completa
- **Impacto:** Ralentiza en desarrollo especialmente con muchos requests
- **Solución:** Cambiar a 'combined' o 'short'

### 3. ⚠️ **Compresión GZIP activada**
- **Ubicación:** `server.ts` línea 51
- **Problema:** Para APIs locales, la compresión no ayuda mucho y ralentiza
- **Impacto:** ~20-30ms extra por response
- **Solución:** Desactivar en modo desarrollo local

### 4. ⚠️ **Headers de caché deshabilitados**
- **Ubicación:** `server.ts` línea 57-61
- **Problema:** Fuerza re-fetch de todo, incluido OPTIONS preflight
- **Impacto:** ~30-50ms extra por request
- **Solución:** Permitir caché estratégica en desarrollo

### 5. ❓ **MongoDB conexión lenta**
- **Verificar:** ¿MongoDB está corriendo localmente?
- **Comando:** `mongosh` o `mongo` para conectar
- **Si no está:** El server espera timeout en cada request (~30 segundos)

### 6. ⚠️ **Helmet headers pesados**
- **Ubicación:** `server.ts` línea 49
- **Problema:** Añade headers de seguridad (innecesarios en dev local)
- **Impacto:** ~10-20ms por request
- **Solución:** Desactivar en desarrollo

## Recomendaciones Inmediatas:

✅ **Para modo desarrollo LOCAL:**
1. Usar CORS con origen específico (`http://localhost:3000`, `http://192.168.x.x:3000`)
2. Morgan en modo 'short' en lugar de 'dev'
3. Desactivar compresión GZIP
4. Permitir caché en respuestas GET
5. Desactivar o reducir headers Helmet
6. **VERIFICAR QUE MONGODB ESTÉ CORRIENDO**

## Test de Latencia Esperada:
- ✅ Conexión local directa: **50-150ms**
- ❌ Actual (con todos los problemas): **500-2000ms**

## Próximos Pasos:
1. ¿MongoDB está corriendo y respondiendo rápido?
2. ¿Desde dónde conectas? (localhost, IP local, emulador)
3. ¿Qué endpoints específicos son los más lentos?

