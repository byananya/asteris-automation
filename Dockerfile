# Stage 1: Build backend
FROM node:18-slim AS builder

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

WORKDIR /app/backend

# Install production dependencies only
COPY --from=builder /app/backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy built files
COPY --from=builder /app/backend/dist ./dist

# Install curl for health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user and set permissions
RUN useradd -m appuser && \
    mkdir -p /app/backend/logs /app/backend/data && \
    chown -R appuser:appuser /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001
ENV NODE_ENV=production

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Switch to non-root user
USER appuser

# Start the backend server
CMD ["node", "dist/index.js"]
