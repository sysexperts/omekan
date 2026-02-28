# 🚀 Omekan Deployment Guide

This guide covers deploying Omekan to production environments with Docker, SSL certificates, monitoring, and performance optimization.

## 📋 Prerequisites

- **Server**: Linux server (Ubuntu 20.04+ recommended)
- **Docker**: Docker Engine 20.10+ and Docker Compose 2.0+
- **Domain**: Registered domain with DNS pointing to your server
- **Resources**: Minimum 2GB RAM, 2 CPU cores, 20GB storage

## 🏗️ Production Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login to apply group changes
```

### 2. Application Setup

```bash
# Clone repository
git clone https://github.com/sysexperts/omekan.git
cd omekan

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### 3. Environment Configuration

Edit `.env` file with production values:

```bash
# Application
APP_ENV=production
APP_DEBUG=false
APP_URL=https://yourdomain.com

# Database
DB_HOST=mysql
DB_NAME=omekan
DB_USER=omekan_user
DB_PASS=secure_password_here

# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your-generated-jwt-secret

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM_ADDRESS=noreply@yourdomain.com

# VAPID Keys for Push Notifications
# Generate with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

### 4. SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot

# Stop any running web server
sudo systemctl stop nginx apache2 2>/dev/null || true

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates to Docker volume
sudo mkdir -p ./docker/nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./docker/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/chain.pem ./docker/nginx/ssl/
sudo chown -R $USER:$USER ./docker/nginx/ssl
```

#### Option B: Custom SSL Certificate

```bash
# Create SSL directory
mkdir -p ./docker/nginx/ssl

# Copy your certificates
cp your-certificate.crt ./docker/nginx/ssl/fullchain.pem
cp your-private-key.key ./docker/nginx/ssl/privkey.pem
cp your-ca-bundle.crt ./docker/nginx/ssl/chain.pem
```

### 5. Update Nginx Configuration

Edit `docker/nginx/default.prod.conf` and replace `yourdomain.com` with your actual domain:

```bash
sed -i 's/yourdomain.com/your-actual-domain.com/g' docker/nginx/default.prod.conf
```

### 6. Deploy Application

```bash
# Build and start containers
docker-compose -f docker-compose.prod.yml up -d --build

# Check container status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 7. Database Initialization

```bash
# Wait for MySQL to be ready (about 30 seconds)
sleep 30

# Initialize database
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p${DB_PASS} ${DB_NAME} < docker/mysql/init.sql

# Run migrations
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p${DB_PASS} ${DB_NAME} < docker/mysql/migrations/002_add_event_image_and_community_fields.sql
```

### 8. Verify Deployment

```bash
# Check application health
curl -k https://yourdomain.com/api/health

# Test API endpoints
curl -k https://yourdomain.com/api/events
curl -k https://yourdomain.com/api/communities
curl -k https://yourdomain.com/api/categories

# Check frontend
curl -k https://yourdomain.com/frontend/events.html
```

## 🔧 Configuration

### Firewall Setup

```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### SSL Certificate Auto-Renewal

```bash
# Create renewal script
sudo tee /etc/cron.d/certbot-renew << EOF
0 12 * * * root certbot renew --quiet --deploy-hook "docker-compose -f /path/to/omekan/docker-compose.prod.yml restart nginx"
EOF
```

### Log Rotation

```bash
# Create logrotate configuration
sudo tee /etc/logrotate.d/omekan << EOF
/path/to/omekan/docker/nginx/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 nginx nginx
    postrotate
        docker-compose -f /path/to/omekan/docker-compose.prod.yml exec nginx nginx -s reload
    endscript
}
EOF
```

## 📊 Monitoring Setup

### Enable Monitoring Stack

```bash
# Start with monitoring profile
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Access monitoring dashboards
# Prometheus: https://yourdomain.com:9090
# Grafana: https://yourdomain.com:3000 (admin/admin123)
```

### Custom Monitoring

```bash
# Create monitoring script
tee /usr/local/bin/omekan-monitor.sh << EOF
#!/bin/bash
HEALTH_URL="https://yourdomain.com/api/health"
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"

if ! curl -f -s $HEALTH_URL > /dev/null; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🚨 Omekan is DOWN!"}' \
        $WEBHOOK_URL
fi
EOF

chmod +x /usr/local/bin/omekan-monitor.sh

# Add to crontab
echo "*/5 * * * * /usr/local/bin/omekan-monitor.sh" | crontab -
```

## 🔄 Updates & Maintenance

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --build

# Run any new migrations
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p${DB_PASS} ${DB_NAME} < docker/mysql/migrations/new_migration.sql
```

### Database Backup

```bash
# Create backup script
tee /usr/local/bin/omekan-backup.sh << EOF
#!/bin/bash
BACKUP_DIR="/backups/omekan"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Database backup
docker-compose -f /path/to/omekan/docker-compose.prod.yml exec mysql \
    mysqldump -u root -p${DB_PASS} ${DB_NAME} > $BACKUP_DIR/db_$DATE.sql

# Files backup
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /path/to/omekan/uploads

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /usr/local/bin/omekan-backup.sh

# Schedule daily backups
echo "0 2 * * * /usr/local/bin/omekan-backup.sh" | crontab -
```

### Database Restore

```bash
# Restore from backup
docker-compose -f docker-compose.prod.yml exec mysql \
    mysql -u root -p${DB_PASS} ${DB_NAME} < /backups/omekan/db_20260228_020000.sql

# Restore files
tar -xzf /backups/omekan/files_20260228_020000.tar.gz -C /
```

## ⚡ Performance Optimization

### Database Optimization

```bash
# Create optimized MySQL configuration
tee docker/mysql/my.cnf << EOF
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
query_cache_type = 1
query_cache_size = 128M
max_connections = 200
thread_cache_size = 16
table_open_cache = 2048
EOF
```

### Redis Caching

```bash
# Create Redis configuration
tee docker/redis/redis.conf << EOF
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
EOF
```

### CDN Setup (Optional)

```bash
# Configure CDN in .env
CDN_ENABLED=true
CDN_URL=https://cdn.yourdomain.com
```

## 🔒 Security Hardening

### Server Security

```bash
# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Install fail2ban
sudo apt install fail2ban

# Configure fail2ban for nginx
sudo tee /etc/fail2ban/jail.local << EOF
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /path/to/omekan/docker/nginx/logs/error.log
maxretry = 3
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /path/to/omekan/docker/nginx/logs/error.log
maxretry = 10
bantime = 600
EOF

sudo systemctl restart fail2ban
```

### Application Security

```bash
# Set secure file permissions
chmod 600 .env
chmod -R 755 frontend/
chmod -R 755 admin/
chmod -R 644 frontend/**/*.html
chmod -R 644 frontend/**/*.css
chmod -R 644 frontend/**/*.js
```

## 🐳 Docker Management

### Useful Commands

```bash
# View container logs
docker-compose -f docker-compose.prod.yml logs -f [service_name]

# Execute commands in containers
docker-compose -f docker-compose.prod.yml exec nginx sh
docker-compose -f docker-compose.prod.yml exec php bash
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p

# Restart specific service
docker-compose -f docker-compose.prod.yml restart nginx

# Update single service
docker-compose -f docker-compose.prod.yml up -d --no-deps nginx

# Clean up unused resources
docker system prune -a
```

### Container Health Monitoring

```bash
# Check container health
docker-compose -f docker-compose.prod.yml ps

# View resource usage
docker stats

# Monitor container logs
docker-compose -f docker-compose.prod.yml logs -f --tail=100
```

## 🚨 Troubleshooting

### Common Issues

#### SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in docker/nginx/ssl/fullchain.pem -text -noout

# Test SSL configuration
curl -vI https://yourdomain.com
```

#### Database Connection Issues
```bash
# Check MySQL logs
docker-compose -f docker-compose.prod.yml logs mysql

# Test database connection
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p${DB_PASS} -e "SHOW DATABASES;"
```

#### Performance Issues
```bash
# Check resource usage
docker stats
htop

# Analyze slow queries
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p${DB_PASS} -e "SHOW PROCESSLIST;"
```

### Log Analysis

```bash
# Nginx access logs
tail -f docker/nginx/logs/access.log

# Nginx error logs
tail -f docker/nginx/logs/error.log

# PHP error logs
tail -f docker/php/logs/error.log

# MySQL error logs
tail -f docker/mysql/logs/error.log
```

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale PHP workers
docker-compose -f docker-compose.prod.yml up -d --scale php=3

# Load balancer configuration (nginx upstream)
upstream php_backend {
    server php_1:9000;
    server php_2:9000;
    server php_3:9000;
}
```

### Database Scaling

```bash
# MySQL Master-Slave setup
# Add to docker-compose.prod.yml:
mysql-slave:
  image: mysql:8.0
  environment:
    MYSQL_ROOT_PASSWORD: ${DB_PASS}
    MYSQL_REPLICATION_MODE: slave
    MYSQL_REPLICATION_USER: replica
    MYSQL_REPLICATION_PASSWORD: replica_pass
    MYSQL_MASTER_HOST: mysql
```

## 📞 Support

For deployment support:
- **Documentation**: [GitHub Wiki](https://github.com/sysexperts/omekan/wiki)
- **Issues**: [GitHub Issues](https://github.com/sysexperts/omekan/issues)
- **Email**: deployment-support@omekan.com

---

**Production Checklist:**
- [ ] SSL certificates configured
- [ ] Environment variables set
- [ ] Database initialized
- [ ] Firewall configured
- [ ] Monitoring enabled
- [ ] Backups scheduled
- [ ] Log rotation configured
- [ ] Security hardening applied
- [ ] Performance optimized
- [ ] Health checks working
