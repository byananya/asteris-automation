# First stage: Install system dependencies
FROM node:18-slim as base

WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Build frontend using the frontend Dockerfile
FROM node:18-slim as frontend-builder
WORKDIR /app/frontend
COPY frontend/ .
RUN npm install --legacy-peer-deps && \
    npm run build

# Build backend
FROM base as backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/tsconfig*.json ./
RUN npm install --production=false --legacy-peer-deps
COPY backend/ .
RUN npm run build

# Final production image
FROM node:18-slim
WORKDIR /app

# Copy built backend
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/dist ./backend/dist

# Copy frontend build
COPY --from=frontend-builder /app/.next/standalone ./
COPY --from=frontend-builder /app/.next/static ./.next/static
COPY --from=frontend-builder /app/public ./public

# Install production dependencies
RUN npx next export -o standalone

# Build Next.js application with type checking disabled
RUN npx next build --no-lint
# Export static files
RUN npx next export -o standalone

# Copy all files needed for build
WORKDIR /app
COPY . .

# Build backend
WORKDIR /app/backend
# Install production dependencies only
RUN npm ci --only=production
# Compile TypeScript
RUN npx tsc -p tsconfig.json

# Production stage
FROM node:18-slim

WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3010

# Create non-root user
RUN useradd -m appuser

# Copy built files from builder
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Copy Next.js standalone output
COPY --from=builder /app/frontend/standalone ./frontend
COPY --from=builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=builder /app/frontend/public ./frontend/public

# Create necessary directories and set permissions
RUN mkdir -p /app/logs /app/scripts && \
    chown -R appuser:appuser /app

# Copy healthcheck script
COPY --chown=appuser:appuser scripts/healthcheck.sh /app/scripts/
RUN chmod +x /app/scripts/healthcheck.sh

WORKDIR /app/backend

# Health check with retry logic
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD ["/bin/sh", "-c", "/app/scripts/healthcheck.sh"]

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
