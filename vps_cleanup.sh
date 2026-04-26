#!/bin/bash

# Security Cleanup Script for E-Commerce VPS
# This script stops malicious processes, removes infected files, and restores the environment.

echo "--- Security Cleanup Starting ---"

# 1. Stop all PM2 processes to prevent malware from restarting
echo "Stopping PM2..."
pm2 stop all
pm2 delete all

# 2. Kill malicious processes
echo "Killing malicious processes (scanner_linux, xmrig, kdevtmpfsi)..."
pkill -9 -f scanner_linux
pkill -9 -f xmrig
pkill -9 -f kdevtmpfsi
pkill -9 -f kinsing

# 3. Locate and remove the malicious binaries
echo "Searching for malicious binaries (silencing permission errors)..."
# Look for scanner_linux and xmrig
MALICIOUS_PATHS=$(find /var/www/ecommerce-mobile /tmp /var/tmp -name "scanner_linux" -o -name "xmrig" 2>/dev/null)

if [ -n "$MALICIOUS_PATHS" ]; then
    for file in $MALICIOUS_PATHS; do
        echo "Found malicious path: $file. Deleting..."
        rm -rf "$file"
    done
else
    echo "No specific malicious binaries found. Proceeding with dependency purge."
fi

# 4. Clean up any suspicious cron jobs
echo "Cleaning up crontab..."
crontab -l | grep -v "scanner_linux" | grep -v "xmrig" | crontab - 2>/dev/null

# 5. Restore Node Modules (Standard clean install)
echo "Clearing npm cache to remove infected packages..."
npm cache clean --force

echo "Wiping and reinstalling clean node_modules..."
cd /var/www/ecommerce-mobile && rm -rf node_modules package-lock.json && npm install
cd /var/www/ecommerce-mobile/backend && rm -rf node_modules package-lock.json && npm install
cd /var/www/ecommerce-mobile/admin && rm -rf node_modules package-lock.json && npm install

# 6. Fix Prisma Database
echo "Synchronizing Prisma Database..."
cd /var/www/ecommerce-mobile/backend && npx prisma db push --accept-data-loss

# 7. Rebuild Projects
echo "Rebuilding apps..."
cd /var/www/ecommerce-mobile && npx next build
cd /var/www/ecommerce-mobile/backend && npm run build
cd /var/www/ecommerce-mobile/admin && npx next build

# 8. Restart PM2 with environment variables setup
echo "Starting services..."
cd /var/www/ecommerce-mobile/backend && pm2 start dist/index.js --name ecommerce-backend
cd /var/www/ecommerce-mobile/admin && pm2 start "npm start" --name admin
cd /var/www/ecommerce-mobile && pm2 start "npm start" --name frontend

echo "--- Cleanup Complete. PLEASE MONITOR PM2 LOGS ---"
echo "Advice: Change your SSH password and database password immediately."
