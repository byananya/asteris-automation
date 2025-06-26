# Use Node.js LTS
FROM node:18-slim as builder

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    NODE_OPTIONS=--max-old-space-size=1024

# Copy package files and source code
COPY package*.json ./
COPY tsconfig*.json ./

# Install only production dependencies first
RUN npm ci --only=production

# Create src directory if it doesn't exist
RUN mkdir -p src

# Copy source files
COPY src/ ./src/

# Verify src directory contents (for debugging)
RUN ls -la src/

# Build the application with memory limit
RUN NODE_OPTIONS=--max-old-space-size=1024 npm run build

# Production stage
FROM node:18-slim

WORKDIR /app

# Install production dependencies only
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist

# Install only production dependencies
RUN npm ci --only=production

# Expose the port the app runs on
EXPOSE 3000

# Create necessary directories for logs and set permissions
RUN mkdir -p /app/logs && \
    chown -R node:node /app

# Set non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run the application
CMD ["node", "dist/index.js"]
