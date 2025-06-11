#!/bin/bash
set -e

echo "Building frontend..."
npm run build

echo "Creating output directory structure..."
mkdir -p /app/backend/frontend

# Copy standalone files
echo "Copying standalone files..."
cp -r .next/standalone/. /app/backend/frontend/

# Ensure .next/static exists in the target
mkdir -p /app/backend/frontend/.next/static

# Copy static files
echo "Copying static files..."
cp -r .next/static/* /app/backend/frontend/.next/static/

# Copy public files
echo "Copying public files..."
mkdir -p /app/backend/frontend/public
cp -r public/* /app/backend/frontend/public/

echo "Frontend build complete!"
