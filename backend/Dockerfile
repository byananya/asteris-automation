# Use Node.js LTS
FROM node:18-slim as builder

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./


# Install dependencies
RUN npm ci --only=production

# Copy source files
COPY src ./src

# Build the application
RUN npm run build

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

# Set the command to run the app
CMD ["node", "dist/index.js"]

# Copy built files
COPY --from=builder /app/dist ./dist

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R node:node /app

# Set non-root user
USER node


# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3010/api/health || exit 1

# Run the application
CMD ["node", "dist/index.js"]
