# Stage 1: Build frontend
FROM node:18-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:18-slim AS backend-builder
WORKDIR /app/backend

# Copy package files first for better caching
COPY backend/package*.json ./
COPY backend/tsconfig*.json ./

# Install all dependencies including devDependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY backend/ ./

# Build the project
RUN npm run build

# Install only production dependencies
RUN npm prune --production

# Stage 3: Production image
FROM node:18-slim
WORKDIR /app/backend

# Install production dependencies only
COPY --from=backend-builder /app/backend/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy built files
COPY --from=backend-builder /app/backend/dist ./dist

# Copy frontend build output into backend's public directory
COPY --from=frontend-builder /app/frontend/out ./public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# Create non-root user and set permissions
RUN useradd -m appuser && \
    chown -R appuser:appuser /app/backend

# Switch to non-root user
USER appuser

# Start the backend server
CMD ["node", "dist/index.js"]
