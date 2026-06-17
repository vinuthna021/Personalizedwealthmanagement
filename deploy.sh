#!/usr/bin/env bash
# ========================================================
# Production Rollout & Deployment Script
# ========================================================

set -eo pipefail

echo "========================================="
echo "Starting WealthTrack Production Deployment"
echo "========================================="

# 1. Check for env configuration file
if [ ! -f "backend/.env" ]; then
    echo "ERROR: backend/.env file is missing. Please create it based on backend/.env.production"
    exit 1
fi

# 2. Pull latest code changes (if in repository workspace)
if [ -d ".git" ]; then
    echo "pulling latest repository changes..."
    git pull origin main || echo "Warning: git pull skipped."
fi

# 3. Compile and build production assets locally
echo "Building static React frontend assets..."
cd frontend
npm ci
npm run build
cd ..

# 4. Build and run Docker Compose containers
echo "Rebuilding and starting Docker containers..."
docker compose build --no-cache
docker compose up -d

# 5. Run Database Schema Migrations
echo "Executing database migrations..."
docker exec wealth_api alembic upgrade head

# 6. Copy static build into Nginx container
echo "Syncing frontend assets to web proxy container..."
docker exec wealth_nginx sh -c "rm -rf /usr/share/nginx/html/*"
docker cp frontend/dist/. wealth_nginx:/usr/share/nginx/html/
docker restart wealth_nginx

echo "========================================="
echo "Deployment Completed Successfully!"
echo "App is live at http://localhost"
echo "========================================="
