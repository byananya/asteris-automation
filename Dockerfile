FROM node:18 AS base

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create .npmrc file with settings to handle dependency issues
RUN echo "legacy-peer-deps=true\nstrict-peer-dependencies=false\nforce=true" > /root/.npmrc

# Build backend
FROM base AS backend-builder
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies
RUN npm install --no-package-lock --force

# Install specific TensorFlow packages
RUN npm install @tensorflow-models/universal-sentence-encoder@1.3.3 --force --no-package-lock && \
    npm install @tensorflow/tfjs-node@4.10.0 --force --no-package-lock && \
    npm install @tensorflow/tfjs-core@4.10.0 --force --no-package-lock

# Copy backend source files
COPY backend/ ./

# Build backend
RUN echo '{"extends":"./tsconfig.json","compilerOptions":{"skipLibCheck":true,"noEmit":false,"outDir":"dist"}}' > tsconfig.build.json && \
    npx tsc -p tsconfig.build.json

# Build frontend
FROM base AS frontend-builder
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm install --no-package-lock

# Copy frontend source files
COPY frontend/ ./

# Create .env file to skip TypeScript checks
RUN echo "NEXT_SKIP_TYPECHECKING=true\nTYPESCRIPT_IGNORE_FILE=true" > .env.local

# Build frontend
RUN npm run build

# Final stage
FROM base AS final
WORKDIR /app

# Copy built backend
COPY --from=backend-builder /app/backend/dist /app/backend/dist
COPY --from=backend-builder /app/backend/node_modules /app/backend/node_modules

# Copy built frontend
COPY --from=frontend-builder /app/frontend/out /app/backend/frontend/out

# Create start script
RUN echo '#!/bin/bash\nset -e\n\n# Start the backend\ncd /app/backend && node dist/index.js' > start.sh && chmod +x start.sh

# Expose ports
EXPOSE 3000 3010

# Start the application
CMD ["/app/start.sh"]
