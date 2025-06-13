FROM node:18-slim as builder

WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3010

# Create .npmrc file with settings to handle dependency issues
RUN echo "legacy-peer-deps=true\nstrict-peer-dependencies=false\nforce=true" > /root/.npmrc

# Copy root package files
COPY package.json package-lock.json* ./

# Copy backend package files
COPY backend/package.json ./backend/
# Copy frontend package files
COPY frontend/package.json ./frontend/

# Install root dependencies
RUN npm install --no-package-lock --force --production=false

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --no-package-lock --force --production=false

# Install frontend dependencies
WORKDIR /app/frontend
# Debug: Show current directory and files
RUN pwd && ls -la
# Copy package files
COPY frontend/package*.json ./
# Debug: Show copied files
RUN ls -la
# Debug: Show npm version and config
RUN npm --version && npm config list
# Install specific versions of React and its dependencies
RUN npm install --no-package-lock --force --verbose \
    react@18.2.0 \
    react-dom@18.2.0 \
    @types/react@18.2.56 \
    @types/react-dom@18.2.19
# Debug: Show installed modules
RUN ls -la node_modules/
# Install remaining dependencies
RUN npm install --no-package-lock --production=false --force --verbose
# Verify React is installed
RUN ls -la node_modules/react
# Copy the rest of the frontend source
COPY frontend/ .

# Set environment variables for frontend build
ENV NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    NEXT_SKIP_TYPECHECKING=1 \
    NODE_OPTIONS=--openssl-legacy-provider

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
