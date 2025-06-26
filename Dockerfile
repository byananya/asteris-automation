# Stage 1: Build backend
FROM node:18-slim AS builder
WORKDIR /app

# Copy package files first for better caching
COPY backend/package*.json ./
COPY backend/tsconfig*.json ./

# Install all dependencies including devDependencies
RUN npm install --legacy-peer-deps

# Copy source code
COPY backend/src/ ./src/

# Build the project
RUN npm run build

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Stage 2: Production image
FROM node:18-slim
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS=--max-old-space-size=1024

# Install production dependencies only
COPY --from=builder /app/package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy built files
COPY --from=builder /app/dist ./dist

# Create necessary directories for logs
RUN mkdir -p /app/logs && \
    chown -R node:node /app

# Set non-root user
USER node

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run the application
CMD ["node", "dist/index.js"]
