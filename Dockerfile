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

# Copy source files and build scripts
COPY frontend/public ./public
COPY frontend/src ./src
COPY frontend/copy-output.js ./

# Install dev dependencies and build
RUN npm install --only=dev --legacy-peer-deps && \
    npm run build && \
    npm run postbuild

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

# Create app directory structure
RUN mkdir -p /app/backend /app/frontend

# Install production dependencies for backend
WORKDIR /app/backend
COPY --from=backend-builder /app/backend/package*.json ./
RUN npm install --production --legacy-peer-deps

# Copy built backend
COPY --from=backend-builder /app/backend/dist ./dist

# Copy frontend build output
COPY --from=frontend-builder /app/frontend/.next /app/frontend/.next
COPY --from=frontend-builder /app/frontend/public /app/frontend/public
COPY --from=frontend-builder /app/frontend/package.json /app/frontend/

# Create necessary symlinks
RUN cd /app/frontend && \
    mkdir -p .next/standalone && \
    ln -s ../.next/static .next/standalone/.next/static && \
    ln -s ../../public .next/standalone/public

# Install curl for health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user and set permissions
RUN useradd -m appuser && \
    chown -R appuser:appuser /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_TELEMETRY_DISABLED=1

# Expose ports
EXPOSE 3000 3001

# Create necessary directories and set permissions
RUN mkdir -p /app/backend/logs /app/backend/data && \
    chown -R appuser:appuser /app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Set working directory and user
WORKDIR /app/backend
USER appuser

# Start the backend server
CMD ["node", "dist/index.js"]
