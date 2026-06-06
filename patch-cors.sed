#!/bin/sed -f
# Actualizar allowedHeaders en server.ts
s/allowedHeaders: \['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'\]/allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Cache-Control', 'Pragma', 'If-Modified-Since', 'User-Agent', 'Referer', 'Accept-Encoding', 'Accept-Language']/
