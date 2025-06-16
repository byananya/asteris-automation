#!/bin/bash
set -e

echo "Building frontend..."
cd frontend
npm install
NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL npm run build
npm run export
cd ..

echo "Copying frontend files to backend..."
rm -rf backend/public
mkdir -p backend/public
cp -r frontend/out/* backend/public/

echo "Building backend..."
cd backend
npm install
npm run build

echo "Build complete!"
