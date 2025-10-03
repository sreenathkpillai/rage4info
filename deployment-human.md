# 🚀 EC2 Deployment Instructions (Amazon Linux 2023)

Complete step-by-step instructions for deploying Care Resource Hub v2 on Amazon Linux 2023 EC2 server.

## 1. **Connect to Your EC2 Server**

```bash
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

## 2. **Update System & Install Dependencies**

```bash
# Update system
sudo dnf update -y

# Add swap space (CRITICAL for t2.micro instances)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Install Git
sudo dnf install git -y

# Install Node.js and npm
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install nodejs -y

# Install PM2 for process management
sudo npm install -g pm2

# Note: Skip Nginx installation if Apache is already running WordPress
# We'll configure Apache to serve the app instead

# Install MongoDB
sudo tee /etc/yum.repos.d/mongodb-org-7.0.repo <<EOF
[mongodb-org-7.0]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2023/mongodb-org/7.0/x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-7.0.asc
EOF

sudo dnf install mongodb-org -y
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installations
node --version
npm --version
pm2 --version
httpd -v
mongod --version
```

# Actuals
[ec2-user@ip-172-31-11-117 ~]$ node --version
v20.18.0
[ec2-user@ip-172-31-11-117 ~]$ npm --version
10.8.2
[ec2-user@ip-172-31-11-117 ~]$ pm2 --version
5.4.2
[ec2-user@ip-172-31-11-117 ~]$ nginx -v
Server version: Apache/2.4.58 (Amazon Linux)
[ec2-user@ip-172-31-11-117 ~]$ mongod --version
db version v7.0.12

## 3. **Clone and Setup Project**

```bash
# Clone the repository
git clone https://github.com/sreenathkpillai/rage4info.git

# Navigate to the project directory
cd rage4info

# Install dependencies
cd server && npm install && cd ..
cd client && npm install && cd ..

# Create production environment files
cp client/.env.example client/.env
cp server/.env.example server/.env
```

## 4. **Configure Environment Variables**

**Edit server environment:**
```bash
nano server/.env
```

**Update server/.env with:**
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://localhost:27017/care-resource-hub
JWT_SECRET=your-super-secure-jwt-secret-change-this-to-something-random-32-chars-minimum
CLIENT_URL=http://ec2-18-190-128-199.us-east-2.compute.amazonaws.com/apps/rage4info
API_BASE_PATH=/apps/rage4info/api
```

**Edit client environment:**
```bash
nano client/.env
```

**Update client/.env with:**
```env
VITE_API_URL=http://ec2-18-190-128-199.us-east-2.compute.amazonaws.com/apps/rage4info/api
VITE_TINYMCE_API_KEY=n0f2s874rmn85hrrfw88rvv34rjelbp19avlarqf2u41m8u4
VITE_APP_TITLE=Care Resource Hub
VITE_APP_VERSION=2.0.0
VITE_BASE_URL=/apps/rage4info
```

**💡 Quick tip to get your public IP:**
```bash
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

## 5. **Build and Deploy Application**

```bash
# Build the server
cd server
npm run build

# Start the API server with PM2
pm2 start dist/server.js --name "care-hub-api" --env production

# Build the client
cd ../client
npm run build

# Create directory for the app and copy built files
sudo mkdir -p /var/www/html/apps/rage4info
sudo cp -r dist/* /var/www/html/apps/rage4info/

# Start PM2 on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ec2-user --hp /home/ec2-user
pm2 save

# Check status
pm2 status
sudo systemctl status httpd
sudo systemctl status mongod
```

**Expected PM2 output:**
```
┌─────┬──────────────────┬─────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name             │ mode    │ ↺      │ status  │ cpu      │ memory │ user │ watching │ restart  │ errored  │ log      │ actions  │
├─────┼──────────────────┼─────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ care-hub-api     │ fork    │ 0       │ online  │ 0%       │ 32.0mb │ ec2… │ disabled  │ 0        │ 0        │ ~/.pm2/… │ stop res…│
└─────┴──────────────────┴─────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

## 6. **Configure EC2 Security Group**

In your AWS Console:

1. Go to **EC2 Dashboard** → **Security Groups**
2. Find your instance's security group
3. Click **Edit inbound rules**
4. Add these rules:

| Type | Port | Source | Description |
|------|------|--------|-------------|
| HTTP | 80 | 0.0.0.0/0 | Apache (Frontend) |
| HTTP | 3001 | 0.0.0.0/0 | API (for testing) |
| SSH | 22 | Your IP only | SSH access |

## 7. **Configure Apache for Subdirectory & WordPress Integration**

Since you have WordPress running on Apache, we'll configure Apache to serve the app at `/apps/rage4info`:

```bash
# Enable Apache proxy modules (Amazon Linux way)
sudo nano /etc/httpd/conf.modules.d/00-proxy.conf
```

**Make sure these lines are uncommented:**
```apache
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so
```

```bash
# Create Apache config for the app
sudo nano /etc/httpd/conf.d/care-hub.conf
```

**Add this configuration:**
```apache
# Care Resource Hub at /apps/rage4info
Alias /apps/rage4info /var/www/html/apps/rage4info

<Directory "/var/www/html/apps/rage4info">
    AllowOverride All
    Require all granted

    # Important for iframe embedding
    Header always set X-Frame-Options "ALLOWALL"

    # Handle React Router - fallback to index.html
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /apps/rage4info/index.html [L]
</Directory>

# API endpoint proxy
ProxyPass /apps/rage4info/api http://localhost:3001/api
ProxyPassReverse /apps/rage4info/api http://localhost:3001/api
ProxyPreserveHost On
```

```bash
# Enable required Apache modules
sudo nano /etc/httpd/conf.modules.d/00-base.conf
```

**Make sure these lines are uncommented:**
```apache
LoadModule rewrite_module modules/mod_rewrite.so
LoadModule headers_module modules/mod_headers.so
```

```bash
# Test and restart Apache
sudo httpd -t
sudo systemctl restart httpd
```

## 8. **Access Your Application**

- **🌐 Frontend**: `http://your-domain.com/apps/rage4info`
- **👨‍💼 Admin Panel**: `http://your-domain.com/apps/rage4info/admin`
- **🔧 API Health**: `http://your-domain.com/apps/rage4info/api/health`

**🔑 Admin Login Credentials:**
- **Email**: `admin@care.com`
- **Password**: `admin123`

## 8. **Verify Deployment**

```bash
# Test API health
curl http://localhost:3001/api/health

# Should return something like:
# {"status":"ok","timestamp":"2025-01-03T...","uptime":123.45,"mongodb":"connected"}

# Test frontend
curl http://localhost/apps/rage4info

# Should return HTML content

# Check all services are running
pm2 status
sudo systemctl status httpd
sudo systemctl status mongod

# View real-time logs
pm2 logs care-hub-api           # API logs
sudo tail -f /var/log/httpd/access_log  # Apache access logs
sudo tail -f /var/log/httpd/error_log   # Apache error logs
```

## 9. **Optional: Set Up Custom Domain & SSL**

If you want to use a custom domain (like `care.yourdomain.com`):

### Install and Configure Nginx

```bash
# Install Nginx
sudo dnf install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Create site configuration
sudo nano /etc/nginx/conf.d/care-hub.conf
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Update security group to allow port 80
# Add HTTP (port 80) rule in AWS console
```

### Add SSL Certificate

```bash
# Install Certbot
sudo dnf install python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Certbot will automatically update your Nginx config for HTTPS
```

## 10. **Management Commands**

### Daily Operations

```bash
# View service status
docker-compose ps

# View logs
docker-compose logs -f                    # All services
docker-compose logs -f frontend           # Frontend only
docker-compose logs -f api                # API only
docker-compose logs -f mongodb            # Database only

# Restart services
docker-compose restart                    # All services
docker-compose restart api               # API only
docker-compose restart frontend          # Frontend only

# Stop all services
docker-compose down

# Start services
docker-compose up -d
```

### Updates & Maintenance

```bash
# Update application code
git pull                                  # Get latest code
docker-compose down                       # Stop services
docker-compose build --no-cache          # Rebuild images
docker-compose up -d                      # Start services

# View resource usage
docker stats                              # Real-time container stats
df -h                                     # Disk usage
free -h                                   # Memory usage
```

### Database Operations

```bash
# Backup database
docker exec care-hub-db mongodump --out /backup
docker cp care-hub-db:/backup ./backup-$(date +%Y%m%d)

# Access MongoDB shell
docker exec -it care-hub-db mongosh

# View database size
docker exec care-hub-db mongosh --eval "db.stats()"
```

## 11. **Troubleshooting**

### Common Issues

**❌ Containers won't start:**
```bash
# Check Docker service
sudo systemctl status docker

# Check detailed logs
docker-compose logs

# Rebuild everything
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

**❌ Can't access the website:**
1. Check EC2 security group has ports 3000, 3001 open
2. Check if services are running: `docker-compose ps`
3. Verify environment variables: `cat client/.env` and `cat server/.env`
4. Test locally: `curl http://localhost:3000`

**❌ Out of memory/disk space:**
```bash
# Check disk space
df -h

# Clean up Docker
docker system prune -f
docker volume prune -f

# Check memory
free -h

# If needed, add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 🎉 **You're All Set!**

Your Care Resource Hub v2 is now running on Amazon Linux 2023!

**Quick Access URLs:**
- **Website**: `http://your-ec2-ip:3000`
- **Admin**: `http://your-ec2-ip:3000/admin`
- **API**: `http://your-ec2-ip:3001/api/health`

**Next Steps:**
1. Change the admin password
2. Add your content through the admin panel
3. Consider setting up a custom domain
4. Set up monitoring and backups

**Support**: If you run into issues, check the logs with `docker-compose logs -f` and refer to the troubleshooting section above.