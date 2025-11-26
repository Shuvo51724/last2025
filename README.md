# DOB Performance Tracker

A comprehensive employee performance management application with real-time chat, attendance tracking, and administrative controls.

## Features

- **Employee Management** - Add, edit, and manage employee records
- **Attendance Tracking** - Monitor employee attendance with check-in/out times
- **Performance Monitoring** - Track employee performance metrics and data
- **Real-Time Chat** - Team communication with file sharing (unlimited video uploads)
- **YouTube Integration** - Performance tracking for YouTube channel metrics
- **Role-Based Access** - Admin, moderator, and employee user roles
- **Secure File Uploads** - Support for images, videos, documents with original quality preservation
- **Admin Dashboard** - Comprehensive administrative controls and settings

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5000`

### Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

Quick production setup:

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your production values

# 2. Build application
npm run build

# 3. Start with PM2
npm run pm2:start
```

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: SQLite (better-sqlite3)
- **Real-time**: WebSockets
- **Build**: Vite
- **Process Management**: PM2

## Environment Variables

See `.env.example` for all configuration options. Required in production:

- `NODE_ENV=production`
- `SESSION_SECRET` - Strong random string
- `CORS_ORIGINS` - Your domain(s)
- `PORT` - Server port (default: 5000)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run backup-db` - Backup database
- `npm run pm2:start` - Start with PM2
- `npm run pm2:logs` - View PM2 logs

## Security Features

- Helmet security headers
- CORS protection
- Rate limiting
- File upload validation (MIME type and size limits)
- Graceful shutdown handling
- Comprehensive error logging

## Monitoring

- Health check: `GET /healthz`
- Readiness check: `GET /readyz`
- Winston logging with daily rotation
- PM2 process monitoring

## Database

- SQLite database with WAL mode
- Automatic schema creation
- Daily automated backups (via cron)
- 30-day backup retention

## License

Proprietary - All rights reserved

## Developer

Developed by MOHAMMAD SAIFUDDIN

---

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
