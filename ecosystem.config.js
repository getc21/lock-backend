/**
 * PM2 Ecosystem Configuration
 * 
 * Este archivo se usa para:
 * - Ejecutar la aplicación en cluster mode
 * - Auto-restart si falla
 * - Logs persistentes
 * - Auto-start en reboot del servidor
 * 
 * Uso:
 * pm2 start ecosystem.config.js
 * pm2 restart all
 * pm2 save
 * pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'bellezapp-backend',
      script: './dist/server.js',
      
      // Modo cluster: usa todos los CPU cores
      instances: 'max',
      exec_mode: 'cluster',
      
      // Ambiente
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // Logs
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Monitoreo
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git', 'build'],
      
      // Limites
      max_memory_restart: '500M',
      
      // Auto-restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Signals
      kill_timeout: 5000,
      listen_timeout: 10000,
      
      // Otros
      node_args: '--max_old_space_size=256',
      instance_var: 'INSTANCE_ID',
    }
  ],
  
  // Deploy configuration (opcional)
  deploy: {
    production: {
      user: 'root',
      host: 'tu-droplet-ip',
      ref: 'origin/main',
      repo: 'tu-repo-url',
      path: '/root/apps/bellezapp-backend',
      'post-deploy': 'npm install && npm run build && pm2 restart ecosystem.config.js'
    }
  }
};
