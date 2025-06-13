# Build stage
FROM node:18-slim AS builder

WORKDIR /app

# Set memory limits
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

# Production stage
FROM node:18-slim

WORKDIR /app

# Copy built files
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
