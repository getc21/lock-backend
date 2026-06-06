#!/usr/bin/env python3
import sys
path = '/var/www/bellezapp-backend/src/server.ts'
with open(path, 'r') as f:
    content = f.read()

old = "allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']"
new = "allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Cache-Control', 'Pragma', 'If-Modified-Since', 'User-Agent', 'Referer', 'Accept-Encoding', 'Accept-Language']"

if old in content:
    content = content.replace(old, new)
    with open(path, 'w') as f:
        f.write(content)
    print("OK")
else:
    print("NOT FOUND")
    sys.exit(1)
