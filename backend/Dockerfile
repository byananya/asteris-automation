FROM node:18-slim

WORKDIR /app

# Install required system dependencies for TensorFlow and health checks
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3010

# Create non-root user
RUN useradd -m appuser

# Copy package files first for better caching
COPY package*.json ./

# Create custom .npmrc file with stronger settings
RUN echo "legacy-peer-deps=true\nstrict-peer-dependencies=false\nforce=true" > ./.npmrc

# Install all dependencies including devDependencies
RUN npm install --no-package-lock --force --production=false \
    @types/jest@^29.5.14

# Explicitly install TypeScript globally to ensure it's available
RUN npm install -g typescript@5.8.3

# Copy the rest of the application
COPY . .

# Create a minimal tsconfig for production build
RUN echo '{\"compilerOptions\":{\"target\":\"ES2020\",\"module\":\"CommonJS\",\"moduleResolution\":\"node\",\"esModuleInterop\":true,\"experimentalDecorators\":true,\"emitDecoratorMetadata\":true,\"forceConsistentCasingInFileNames\":true,\"strict\":true,\"strictPropertyInitialization\":false,\"skipLibCheck\":true,\"outDir\":\"dist\",\"allowJs\":true,\"resolveJsonModule\":true,\"sourceMap\":true,\"allowSyntheticDefaultImports\":true,\"noEmit\":false,\"types\":[\"node\"]},\"include\":[\"src/**/*\"],\"exclude\":[\"node_modules\",\"**/*.test.ts\",\"**/*.spec.ts\",\"**/__tests__/**\"]}' > /app/tsconfig.json

# Remove any existing build configs and create a new tsconfig
RUN rm -f tsconfig.build.json tsconfig.deploy.json && \
    echo '{"compilerOptions":{"target":"ES2020","module":"CommonJS","moduleResolution":"node","esModuleInterop":true,"experimentalDecorators":true,"emitDecoratorMetadata":true,"forceConsistentCasingInFileNames":true,"strict":true,"strictPropertyInitialization":false,"skipLibCheck":true,"outDir":"dist","allowJs":true,"resolveJsonModule":true,"sourceMap":true,"allowSyntheticDefaultImports":true,"noEmit":false,"types":["node"]},"include":["src/**/*"],"exclude":["node_modules","**/*.test.ts","**/*.spec.ts","**/__tests__/**"]}' > /app/tsconfig.json

# Build with custom command
RUN cd /app && npx tsc --project /app/tsconfig.json

# Install production dependencies only
RUN npm prune --production

# Create necessary directories
RUN mkdir -p /app/logs && \
    chown -R appuser:appuser /app

# Expose the port the app runs on
EXPOSE 3010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3010/api/health || exit 1

# Use non-root user
USER appuser

# Command to run the application
CMD ["node", "dist/index.js"]
