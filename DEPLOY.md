# VPS Deployment Guide

## Initial Setup (One-time)

### 1. On your VPS

SSH into your VPS and run:

```bash
wget https://raw.githubusercontent.com/abhi23zc/Emailzone/main/vps-setup.sh
chmod +x vps-setup.sh
./vps-setup.sh
```

This installs Node.js, PM2, Nginx, clones the repo, and sets everything up.

### 2. Add environment variables

```bash
nano /var/www/emailzone/.env.local
```

Fill in your Firebase credentials and encryption key, then:

```bash
cd /var/www/emailzone
npm run build
pm2 restart emailzone
```

### 3. Setup GitHub Secrets

Go to: https://github.com/abhi23zc/Emailzone/settings/secrets/actions

Add these secrets:

- `VPS_HOST` - Your VPS IP address (e.g., 123.45.67.89)
- `VPS_USER` - SSH username (usually `root` or `ubuntu`)
- `VPS_SSH_KEY` - Your private SSH key

**To get your SSH key:**
```bash
cat ~/.ssh/id_rsa
```

If you don't have one, generate it:
```bash
ssh-keygen -t rsa -b 4096
cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/id_rsa  # Copy this to VPS_SSH_KEY secret
```

## How it works

Every time you push to `main` branch:
1. GitHub Actions triggers
2. Connects to your VPS via SSH
3. Pulls latest code
4. Installs dependencies
5. Builds the app
6. Restarts PM2 process

## Manual deployment

If you need to deploy manually:

```bash
ssh user@your-vps-ip
cd /var/www/emailzone
git pull origin main
npm install
npm run build
pm2 restart emailzone
```

## Useful commands

```bash
# Check app status
pm2 status

# View logs
pm2 logs emailzone

# Restart app
pm2 restart emailzone

# Stop app
pm2 stop emailzone

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

## SSL Setup (Optional but recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Troubleshooting

**App not starting?**
```bash
pm2 logs emailzone
```

**Port already in use?**
```bash
sudo lsof -i :3000
# Kill the process if needed
```

**Nginx errors?**
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```
