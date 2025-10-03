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

# Install Docker
sudo dnf install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create symlink for easier access
sudo ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose

# Install Git
sudo dnf install git -y

# Logout and login again to apply docker group
exit
# SSH back in
ssh -i your-key.pem ec2-user@your-ec2-public-ip

# Verify installations
docker --version
docker-compose --version
git --version
```

# Actuals
[ec2-user@ip-172-31-11-117 ~]$ docker --version
Docker version 25.0.8, build 0bab007
[ec2-user@ip-172-31-11-117 ~]$ docker-compose --version
Docker Compose version v2.21.0
[ec2-user@ip-172-31-11-117 ~]$ git --version
git version 2.47.1

## 3. **Clone and Setup Project**

```bash
# Clone your repository (replace with your actual repo URL)
git clone https://github.com/your-username/care-resource-hub.git

# If you don't have a git repo yet, you can upload the v2 folder directly:
# scp -i your-key.pem -r ./v2 ec2-user@your-ec2-ip:~/care-resource-hub/

cd care-resource-hub/v2

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
MONGODB_URI=mongodb://mongodb:27017/care-resource-hub
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
VITE_API_URL=http://your-ec2-public-ip/apps/rage4info/api
VITE_TINYMCE_API_KEY=n0f2s874rmn85hrrfw88rvv34rjelbp19avlarqf2u41m8u4
VITE_APP_TITLE=Care Resource Hub
VITE_APP_VERSION=2.0.0
VITE_BASE_URL=/apps/rage4info
```

**💡 Quick tip to get your public IP:**
```bash
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

## 5. **Deploy with Docker Compose**

```bash
# Start all services (this will take a few minutes on first run)
docker-compose up -d

# Check status - all services should show "Up"
docker-compose ps

# View logs to make sure everything started correctly
docker-compose logs -f

# Press Ctrl+C to exit log viewing
```

**Expected output from `docker-compose ps`:**
```
NAME                IMAGE               COMMAND                  SERVICE             STATUS              PORTS
care-hub-api        v2_api              "npm start"              api                 running             0.0.0.0:3001->3001/tcp
care-hub-db         mongo:7.0           "docker-entrypoint.s…"   mongodb             running             0.0.0.0:27017->27017/tcp
care-hub-frontend   v2_frontend         "/docker-entrypoint.…"   frontend            running             0.0.0.0:3000->3000/tcp
care-hub-redis      redis:7.2-alpine    "docker-entrypoint.s…"   redis               running             0.0.0.0:6379->6379/tcp
```

## 6. **Configure EC2 Security Group**

In your AWS Console:

1. Go to **EC2 Dashboard** → **Security Groups**
2. Find your instance's security group
3. Click **Edit inbound rules**
4. Add these rules:

| Type | Port | Source | Description |
|------|------|--------|-------------|
| HTTP | 3000 | 0.0.0.0/0 | Frontend |
| HTTP | 3001 | 0.0.0.0/0 | API |
| SSH | 22 | Your IP only | SSH access |

## 7. **Configure Nginx for Subdirectory & WordPress Integration**

Since you have WordPress at the root and want this app at `/apps/rage4info`, we need to configure Nginx properly:

```bash
# Edit main Nginx config
sudo nano /etc/nginx/nginx.conf
```

**Add this configuration inside the `http` block:**
```nginx
# Add this to your existing WordPress server block or create new one
server {
    listen 80;
    server_name your-domain.com;  # Your actual domain

    # WordPress at root (your existing config)
    location / {
        try_files $uri $uri/ /index.php?$args;
        # Your existing WordPress config here
    }

    # Care Resource Hub at /apps/rage4info
    location /apps/rage4info/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Important for iframe embedding
        proxy_set_header X-Frame-Options ALLOWALL;
        add_header X-Frame-Options ALLOWALL;

        # Handle React Router
        try_files $uri $uri/ @react;
    }

    # Fallback for React Router in subdirectory
    location @react {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # API endpoint
    location /apps/rage4info/api {
        proxy_pass http://localhost:3001/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
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
curl http://localhost:3000/health

# Should return: "healthy"

# Check all containers are running
docker-compose ps

# View real-time logs
docker-compose logs -f api      # API logs
docker-compose logs -f frontend # Frontend logs
docker-compose logs -f mongodb  # Database logs
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