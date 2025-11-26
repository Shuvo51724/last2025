# DOB Performance Tracker - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Configuration](#environment-configuration)
3. [Building for Production](#building-for-production)
4. [Deployment Methods](#deployment-methods)
5. [Database Management](#database-management)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **Node.js**: >= 20.0.0
- **npm**: >= 9.0.0
- **PM2** (recommended): `npm install -g pm2`
- **Memory**: Minimum 512MB RAM, Recommended 1GB+
- **Disk Space**: Minimum 2GB for application + logs + database
- **OS**: Linux (Ubuntu 20.04+), macOS, or Windows Server

### Required Services
- Web server with Node.js support (VPS, Cloud hosting, etc.)
- HTTPS certificate (recommended for production)
- Reverse proxy (Nginx or Apache - recommended)

## Environment Configuration

### 1. Copy Environment Template
```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your production values:

```env
# REQUIRED - Production Environment
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database (keep default or customize path)
DB_PATH=./data/dob.db

# File Uploads
UPLOAD_DIR=./uploads/chat-files
MAX_FILE_SIZE=524288000  # 500MB default

# CORS - Add your production domain(s)
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting (adjust based on your needs)
RATE_LIMIT_WINDOW_MS=900000      # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100      # requests per window

# REQUIRED - Security Secret
SESSION_SECRET=your-very-secure-random-string-here-change-this

# Optional - YouTube Integration
YOUTUBE_API_KEY=your-youtube-api-key-if-needed

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Trust Proxy (set to 1 if behind Nginx/Apache)
TRUST_PROXY=1
```

### 3. Generate Secure Session Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it for `SESSION_SECRET`.

## Building for Production

### 1. Install Dependencies
```bash
npm install --production=false
```

### 2. Build the Application
```bash
npm run build
```

This command:
- Builds the React frontend (optimized, minified)
- Compiles TypeScript server code
- Outputs to `dist/` directory

### 3. Verify Build
```bash
ls -la dist/
# Should show:
# - dist/public/    (frontend assets)
# - dist/server/    (compiled backend)
```

## Deployment Methods

### Method 1: PM2 (Recommended for Production)

PM2 provides process management, automatic restarts, and clustering.

#### Install PM2 Globally
```bash
npm install -g pm2
```

#### Start Application
```bash
npm run pm2:start
```

#### Useful PM2 Commands
```bash
# View status
pm2 status

# View logs
npm run pm2:logs

# Monitor resources
npm run pm2:monit

# Restart application
npm run pm2:restart

# Stop application
npm run pm2:stop

# View detailed info
pm2 describe dob-performance-tracker
```

#### Configure PM2 Startup
```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

Now PM2 will automatically restart your app on server reboot.

### Method 2: Direct Node.js (Development/Testing)

```bash
npm run start
```

### Method 3: Systemd Service (Alternative to PM2)

Create `/etc/systemd/system/dob-tracker.service`:

```ini
[Unit]
Description=DOB Performance Tracker
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/dob-performance-tracker
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/server/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=dob-tracker

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable dob-tracker
sudo systemctl start dob-tracker
sudo systemctl status dob-tracker
```

## Reverse Proxy Setup (Nginx)

### Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

### Configure Nginx

Create `/etc/nginx/sites-available/dob-tracker`:

```nginx
upstream dob_backend {
    server localhost:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Certificate
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy Settings
    location / {
        proxy_pass http://dob_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket Support
    location /ws {
        proxy_pass http://dob_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://dob_backend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # File upload limit
    client_max_body_size 500M;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/dob-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Database Management

### Automatic Backups

#### Setup Cron Job
```bash
crontab -e
```

Add daily backup at 3 AM:
```
0 3 * * * cd /path/to/dob-performance-tracker && npm run backup-db >> logs/backup.log 2>&1
```

#### Manual Backup
```bash
npm run backup-db
```

Backups are stored in `backups/` directory with timestamp.

### Database Restore

```bash
# Stop the application
pm2 stop dob-performance-tracker

# Copy backup over current database
cp backups/dob-backup-YYYY-MM-DD.db data/dob.db

# Restart application
pm2 restart dob-performance-tracker
```

### Database Migrations

Currently using SQLite with schema auto-creation. For schema changes:

1. Update `server/db.ts` schema
2. Test in development
3. Backup production database
4. Deploy new version
5. Restart application

## Monitoring & Maintenance

### Health Checks

The application provides health check endpoints:

- **Liveness**: `GET /healthz`
- **Readiness**: `GET /readyz`

Set up monitoring (UptimeRobot, Pingdom, etc.) to check these endpoints.

### Log Management

Logs are stored in `logs/` directory:
- `application-YYYY-MM-DD.log` - All application logs
- `error-YYYY-MM-DD.log` - Error logs only
- Logs rotate daily
- Kept for 14 days (application) / 30 days (errors)

#### View Logs
```bash
# Real-time logs (PM2)
pm2 logs dob-performance-tracker

# Application logs
tail -f logs/application-$(date +%Y-%m-%D).log

# Error logs
tail -f logs/error-$(date +%Y-%m-%D).log
```

### Performance Monitoring

Monitor with PM2:
```bash
pm2 monit
```

Key metrics to watch:
- **CPU Usage**: Should stay < 70%
- **Memory Usage**: Should stay < 80% of available
- **Restart Count**: Frequent restarts indicate issues
- **Response Time**: Should be < 500ms for most requests

### Disk Space

Monitor these directories:
- `data/` - Database files
- `uploads/` - Uploaded files
- `logs/` - Log files
- `backups/` - Database backups

Clean old uploads periodically if needed.

## Security Checklist

- [ ] `SESSION_SECRET` set to strong random value
- [ ] `NODE_ENV=production` in production
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Firewall configured (only allow 80, 443, SSH)
- [ ] Regular security updates (`apt update && apt upgrade`)
- [ ] Database backups automated
- [ ] Monitoring alerts configured
- [ ] `CORS_ORIGINS` limited to your domain(s)
- [ ] Rate limiting configured appropriately
- [ ] Nginx reverse proxy configured
- [ ] PM2 or systemd managing process

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs dob-performance-tracker --lines 100

# Check environment
cat .env | grep NODE_ENV

# Verify build
ls -la dist/server/index.js

# Try direct start
npm run start
```

### Database Issues

```bash
# Check database file
ls -lh data/dob.db

# Verify permissions
chmod 644 data/dob.db

# Check database integrity
sqlite3 data/dob.db "PRAGMA integrity_check;"
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>

# Or change PORT in .env
```

### Memory Issues

```bash
# Check memory usage
free -h

# Reduce PM2 instances
pm2 scale dob-performance-tracker 2

# Restart with max memory limit
pm2 restart dob-performance-tracker --max-memory-restart 500M
```

### WebSocket Connection Issues

1. Verify Nginx WebSocket proxy configuration
2. Check firewall allows WebSocket connections
3. Ensure `TRUST_PROXY=1` in `.env` if behind proxy

## Updating the Application

```bash
# 1. Backup database
npm run backup-db

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
npm install

# 4. Build application
npm run build

# 5. Restart with zero downtime
pm2 reload dob-performance-tracker
```

## Support

For issues or questions:
1. Check logs in `logs/` directory
2. Review this deployment guide
3. Check PM2 status: `pm2 status`
4. Verify health endpoints: `curl http://localhost:5000/healthz`

---

**Version**: 1.0.0  
**Last Updated**: November 2025
