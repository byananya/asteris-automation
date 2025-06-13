# Stage 1: Build the application
FROM node:18-slim AS builder

WORKDIR /app

# Set memory limits for Node.js
ENV NODE_OPTIONS=--max_old_space_size=2048

# Copy package files first for better caching
COPY package*.json ./
COPY next.config.js ./
COPY tsconfig.json ./

# Install only production dependencies first
RUN npm install --omit=dev --legacy-peer-deps

# Copy source files
COPY public ./public
COPY src ./src

# Install dev dependencies and build
RUN npm install --legacy-peer-deps && \
    npm run build

# Stage 2: Production image
FROM node:18-slim

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy built files from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user and set permissions
RUN useradd -m appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Start the application
CMD ["node", "server.js"]
