#!/bin/bash

# Security Cleanup Script for E-Commerce VPS
# This script stops malicious processes, removes infected files, and restores the environment.

echo "--- Security Cleanup Starting ---"

# 1. Stop all PM2 processes to prevent malware from restarting
echo "Stopping PM2..."
pm2 stop all
pm2 delete all

# 2. Kill the malicious scanner process
echo "Killing malicious processes (scanner_linux)..."
pkill -f scanner_linux
killall scanner_linux

# 3. Locate and remove the malicious binary
# Based on the logs, it might be in the project root or uploads folder
echo "Searching for scanner_linux binary..."
MALICIOUS_PATHS=$(find /var/www/ecommerce-mobile -name "scanner_linux")
if [ -z "$MALICIOUS_PATHS" ]; then
    echo "scanner_linux not found in project. Checking /tmp and /var/tmp..."
    MALICIOUS_PATHS=$(find /tmp /var/tmp -name "scanner_linux")
fi

for file in $MALICIOUS_PATHS; do
    echo "Found malicious file: $file. Deleting..."
    rm -f "$file"
done

# 4. Clean up the uploads directory (common entry point)
echo "Removing suspicious files from uploads..."
# Look for anything not an image in the uploads dir
find /var/www/ecommerce-mobile/backend/public/uploads -type f ! -name "*.jpg" ! -name "*.png" ! -name "*.webp" ! -name "*.gif" -delete

# 5. Restore Node Modules (using legacy-peer-deps to avoid conflicts)
echo "Wiping and reinstalling node_modules..."
cd /var/www/ecommerce-mobile && rm -rf node_modules package-lock.json && npm install --legacy-peer-deps
cd /var/www/ecommerce-mobile/backend && rm -rf node_modules package-lock.json && npm install --legacy-peer-deps
cd /var/www/ecommerce-mobile/admin && rm -rf node_modules package-lock.json && npm install --legacy-peer-deps

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
