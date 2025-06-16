#!/bin/bash
set -e

# Enable debug output if DEBUG is set
[ "$DEBUG" = "true" ] && set -x

echo "=== Starting build process ==="

# Build frontend
echo "[1/3] Building frontend..."
(cd frontend && \
 npm install && \
 NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-/api} npm run build && \
 npm run export)

# Copy frontend files to backend
BUILD_DIR="$(pwd)/frontend/out"
PUBLIC_DIR="$(pwd)/backend/public"

echo "[2/3] Copying frontend files to backend..."
rm -rf "$PUBLIC_DIR"
mkdir -p "$PUBLIC_DIR"
cp -r "$BUILD_DIR"/* "$PUBLIC_DIR/"

# Build backend
echo "[3/3] Building backend..."
(cd backend && \
 npm install && \
 npm run build)

echo "=== Build completed successfully ==="
ls -la "$PUBLIC_DIR"
