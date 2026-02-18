#!/bin/bash

# VPS Initial Setup Script for EmailZone

echo "=== EmailZone VPS Setup ==="

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Create app directory
sudo mkdir -p /var/www/emailzone
sudo chown -R $USER:$USER /var/www/emailzone

# Clone repository
cd /var/www
git clone https://github.com/abhi23zc/Emailzone.git emailzone
cd emailzone

# Install dependencies
npm install

# Create .env.local
echo "Creating .env.local - YOU NEED TO FILL THIS!"
cat > .env.local << 'EOF'
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin SDK
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Encryption
ENCRYPTION_KEY=
EOF

echo ""
echo "⚠️  IMPORTANT: Edit /var/www/emailzone/.env.local with your credentials"
echo ""

# Build app
npm run build

# Start with PM2
pm2 start ecosystem.config.json
pm2 save
pm2 startup

# Setup cron for scheduled campaigns
(crontab -l 2>/dev/null; echo "*/5 * * * * curl http://localhost:3000/api/cron/process-campaigns") | crontab -

# Install and configure Nginx
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/emailzone > /dev/null << 'NGINX'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/emailzone /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Setup firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit /var/www/emailzone/.env.local with your Firebase credentials"
echo "2. Run: cd /var/www/emailzone && npm run build && pm2 restart emailzone"
echo "3. Update Nginx config with your domain: sudo nano /etc/nginx/sites-available/emailzone"
echo "4. Setup SSL: sudo apt install certbot python3-certbot-nginx && sudo certbot --nginx"
echo ""
