# Quick Deployment Guide - DOB Performance Tracker

## Deployment Steps (5-10 minutes)

### Step 1: SSH into Your Server
```bash
ssh user@your-hosting-provider-ip
```

### Step 2: Clone Your Repository
```bash
git clone https://github.com/yourusername/dob-performance-tracker.git
cd dob-performance-tracker
```

### Step 3: Install Node.js (if not already installed)
```bash
# For Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v20+
npm --version   # Should be v9+
```

### Step 4: Install Dependencies
```bash
npm install --production=false
```

### Step 5: Build the Application
```bash
npm run build
```

### Step 6: Configure Environment Variables
```bash
cp .env.example .env
nano .env  # Or use your preferred editor
```

**Edit these values:**
```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Your domain or IP
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Generate a secure secret key:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SESSION_SECRET=<paste-your-generated-secret-here>

# Other settings (keep defaults if unsure)
DB_PATH=./data/dob.db
UPLOAD_DIR=./uploads/chat-files
MAX_FILE_SIZE=524288000
LOG_DIR=./logs
TRUST_PROXY=1
```

### Step 7: Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### Step 8: Start Application with PM2
```bash
npm run pm2:start
```

### Step 9: Setup Auto-Start on Server Reboot
```bash
pm2 startup
pm2 save
```

### Step 10: Setup SSL with Let's Encrypt (Recommended)
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y

# For your domain
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

### Step 11: Setup Nginx Reverse Proxy (Recommended)
```bash
sudo apt install nginx -y
```

Create `/etc/nginx/sites-available/dob-tracker`:
```bash
sudo nano /etc/nginx/sites-available/dob-tracker
```

Paste this config:
```nginx
upstream dob_backend {
    server localhost:5000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    client_max_body_size 500M;

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
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/dob-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## ✅ Your App is Now Live!

**Access URL:** `https://yourdomain.com`

---

## 🔐 Employee Access Instructions

### Share With Employees:
Send them this information:

---

**DOB Performance Tracker - Access Instructions**

**URL:** https://yourdomain.com (or your company IP)

**Login:**
1. Open the URL in your browser
2. Enter your **User ID** and **Password**
3. Click Login

**Features Available:**
- View your performance dashboard
- Check attendance records
- Join real-time chat with team
- Upload and share files/videos
- View assignments and tasks
- Export reports

**Technical Requirements:**
- Any modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- No software installation needed!

---

## 📊 Management Commands

```bash
# View app status
pm2 status

# View live logs
npm run pm2:logs

# Restart app (zero downtime)
pm2 restart dob-performance-tracker

# Stop app
pm2 stop dob-performance-tracker

# Monitor resources
pm2 monit

# Backup database
npm run backup-db

# Check application health
curl https://yourdomain.com/healthz
```

## 🗄️ Database Backups (Automated)

Add to crontab for daily 3 AM backups:
```bash
crontab -e

# Add this line:
0 3 * * * cd /path/to/dob-performance-tracker && npm run backup-db >> logs/backup.log 2>&1
```

## 🔍 Troubleshooting

**App won't start:**
```bash
pm2 logs dob-performance-tracker --lines 100
```

**Port already in use:**
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

**Need to update app:**
```bash
git pull origin main
npm install
npm run build
pm2 restart dob-performance-tracker
```

## 📱 Mobile Access

The app is fully responsive and works great on:
- Tablets
- Smartphones
- Desktops

Just visit `https://yourdomain.com` from any device!

## 🎯 Next Steps

1. Replace `yourdomain.com` with your actual domain
2. Configure `.env` file with your settings
3. Run deployment steps above
4. Test access: https://yourdomain.com
5. Share login credentials with employees
6. Set up automated backups

---

**Need help?** Check DEPLOYMENT.md for detailed information.
