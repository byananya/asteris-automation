# Stage 1: Build frontend
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend

# Set memory limits for Node.js
ENV NODE_OPTIONS=--max_old_space_size=2048

# Copy package files first for better caching
COPY frontend/package*.json ./
COPY frontend/next.config.js ./
COPY frontend/tsconfig.json ./

# Install only production dependencies first
RUN npm install --omit=dev --legacy-peer-deps

# Copy source files
COPY frontend/public ./public
COPY frontend/src ./src

# Install dev dependencies and build
RUN npm install --only=dev --legacy-peer-deps && \
    npm run build

# Stage 2: Build backend
FROM node:18-slim AS backend-builder
WORKDIR /app/backend

# Set memory limits for Node.js
ENV NODE_OPTIONS=--max_old_space_size=2048

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY backend/package*.json ./
COPY backend/tsconfig*.json ./

# Install production dependencies first
RUN npm install --omit=dev --legacy-peer-deps

# Copy source code
COPY backend/ .

# Install dev dependencies and build
RUN npm install --only=dev --legacy-peer-deps && \
    npm run build

# Final production image
FROM node:18-slim

# Create app directory
WORKDIR /app/backend

# Install production dependencies
COPY --from=backend-builder /app/backend/package*.json ./
RUN npm install --production --legacy-peer-deps

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./dist

# Copy frontend build
COPY --from=frontend-builder /app/frontend/.next/standalone /app/frontend/
COPY --from=frontend-builder /app/frontend/.next/static /app/frontend/.next/static
COPY --from=frontend-builder /app/frontend/public /app/frontend/public

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m appuser && \
    chown -R appuser:appuser /app
USER appuser

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose ports
EXPOSE 3000 3001

# Create necessary directories and set permissions
RUN mkdir -p /app/backend/logs && \
    chown -R appuser:appuser /app

WORKDIR /app/backend

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Use non-root user
USER appuser

# Expose the port the app runs on
EXPOSE 3010

# Verify the output directory structure
RUN echo "Verifying backend/frontend directory structure:" && \
    mkdir -p /app/backend/frontend && \
    echo "Copied files:" && \
    ls -la /app/backend/frontend/

# The build.sh script already handles copying files to /app/backend/frontend
# Verify the final directory structure
RUN echo "Final backend/frontend directory structure:" && \
    ls -la /app/backend/frontend/ && \
    echo "\n.next directory:" && \
    ls -la /app/backend/frontend/.next/ && \
    echo "\npublic directory:" && \
    ls -la /app/backend/frontend/public/

# Create start script
RUN echo '#!/bin/bash\ncd /app/backend && node dist/index.js' > /app/start.sh && \
    chmod +x /app/start.sh

# Start the application
CMD ["/app/start.sh"]
