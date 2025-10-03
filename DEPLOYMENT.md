# Deployment Guide - Care Resource Hub v2

This guide provides multiple deployment options for the Care Resource Hub v2 application.

## 🚀 Quick Deploy Options

### Option 1: Docker Compose (Recommended)

The easiest way to deploy the entire application:

```bash
# Clone repository
git clone <repository-url>
cd care-resource-hub-v2

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Includes:**
- Frontend (React) on port 3000
- Backend (Express) on port 3001
- MongoDB on port 27017
- Redis for caching on port 6379

### Option 2: Vercel + Railway

**Frontend (Vercel):**
```bash
npm i -g vercel
cd client
vercel --prod
```

**Backend (Railway):**
```bash
npm i -g @railway/cli
cd server
railway login
railway init
railway up
```

### Option 3: Traditional VPS

**Prerequisites:**
- Ubuntu 20.04+ or similar
- Node.js 18+
- MongoDB
- Nginx
- PM2 process manager

## 📋 Detailed Deployment Steps

### Environment Setup

**Client Environment Variables:**
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_TINYMCE_API_KEY=your-tinymce-api-key
VITE_APP_TITLE=Care Resource Hub
VITE_APP_VERSION=2.0.0
```

**Server Environment Variables:**
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/care-resource-hub
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
CLIENT_URL=https://yourdomain.com
```

### VPS Deployment (Ubuntu)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Install Nginx
sudo apt install nginx -y

# Install PM2
sudo npm install -g pm2
```

#### 2. Application Deployment

```bash
# Clone repository
git clone <repository-url> /var/www/care-hub
cd /var/www/care-hub

# Build and deploy backend
cd server
npm install
npm run build
pm2 start dist/server.js --name care-hub-api

# Build and deploy frontend
cd ../client
npm install
npm run build

# Copy built files to Nginx
sudo cp -r dist/* /var/www/html/
```

#### 3. Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

### Cloud Platform Deployments

#### Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd client
vercel

# Set environment variables in Vercel dashboard
# VITE_API_URL=https://your-api-domain.com/api
```

#### Railway (Backend)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
cd server
railway login
railway init
railway up

# Add environment variables in Railway dashboard
```

#### Heroku (Backend)

```bash
# Install Heroku CLI
# Create Heroku app
heroku create care-hub-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set MONGODB_URI=your-mongodb-uri

# Deploy
git subtree push --prefix=server heroku main
```

#### AWS EC2 Deployment

```bash
# Launch EC2 instance (Ubuntu 20.04)
# Connect via SSH

# Install dependencies
sudo apt update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# Clone and deploy (follow VPS steps above)

# Configure security groups
# - Port 80 (HTTP)
# - Port 443 (HTTPS)
# - Port 22 (SSH)
```

## 🔧 Configuration Files

### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'care-hub-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

### Nginx Full Configuration

```nginx
upstream api {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;

        # Cache static files
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API
    location /api {
        proxy_pass http://api;
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

## 🗄️ Database Setup

### MongoDB Atlas (Cloud)

1. Create account at mongodb.com
2. Create new cluster
3. Create database user
4. Whitelist IP addresses
5. Get connection string

### Local MongoDB

```bash
# Ubuntu/Debian
sudo apt-get install mongodb

# Start service
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Create database and user
mongo
use care-resource-hub
db.createUser({
  user: "careuser",
  pwd: "password",
  roles: ["readWrite"]
})
```

## 🔐 Security Checklist

- [ ] Change default passwords
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS with SSL certificate
- [ ] Configure firewall (UFW on Ubuntu)
- [ ] Set up fail2ban for SSH protection
- [ ] Enable MongoDB authentication
- [ ] Use environment variables for secrets
- [ ] Regular security updates
- [ ] Monitor logs for suspicious activity

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# API health
curl https://yourdomain.com/api/health

# Frontend health
curl https://yourdomain.com/health
```

### PM2 Monitoring

```bash
# View processes
pm2 list

# View logs
pm2 logs care-hub-api

# Restart app
pm2 restart care-hub-api

# Monitor resources
pm2 monit
```

### Log Management

```bash
# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Application logs
pm2 logs --lines 100
```

## 🚀 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    - name: Install dependencies
      run: |
        cd client && npm ci
        cd ../server && npm ci

    - name: Build applications
      run: |
        cd client && npm run build
        cd ../server && npm run build

    - name: Deploy to server
      run: |
        # Add your deployment script here
        # scp, rsync, or other deployment method
```

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
- Check MongoDB connection
- Verify environment variables
- Check port conflicts
- Review logs: `pm2 logs care-hub-api`

**Frontend build fails:**
- Check Node.js version (18+)
- Verify environment variables
- Clear node_modules and reinstall

**Database connection issues:**
- Check MongoDB service status
- Verify connection string
- Check network connectivity
- Review MongoDB logs

**CORS errors:**
- Verify CLIENT_URL in server environment
- Check API URL in client environment
- Review CORS configuration

### Performance Optimization

```bash
# Enable Nginx gzip compression
# Add to nginx.conf
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# PM2 cluster mode
pm2 start ecosystem.config.js --env production

# MongoDB indexing
db.contents.createIndex({ "metadata.lastModified": -1 })
```

## 📞 Support

For deployment issues:

1. Check logs first: `pm2 logs` or `docker-compose logs`
2. Verify environment variables
3. Test connectivity between services
4. Review security group/firewall settings
5. Check domain DNS configuration

---

**Happy Deploying! 🚀**

Your Care Resource Hub v2 is now ready for production use with enterprise-grade reliability and scalability.