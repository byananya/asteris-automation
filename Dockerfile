FROM node:18-alpine AS base

# Install required system dependencies for Alpine
RUN apk add --no-cache python3 make g++ curl bash

# Create separate stages for frontend and backend
FROM base AS frontend-deps
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Create .npmrc with necessary settings
RUN echo "legacy-peer-deps=true\nstrict-peer-dependencies=false" > .npmrc

# Install dependencies with yarn (more reliable than npm)
RUN yarn install --frozen-lockfile --network-timeout 600000

FROM base AS backend-deps
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Create .npmrc with necessary settings
RUN echo "legacy-peer-deps=true\nstrict-peer-dependencies=false\nforce=true" > .npmrc

# Install dependencies with yarn
RUN yarn install --frozen-lockfile --network-timeout 600000

# Install TensorFlow packages separately
RUN yarn add @tensorflow-models/universal-sentence-encoder@1.3.3 --force && \
    yarn add @tensorflow/tfjs-node@4.10.0 --force && \
    yarn add @tensorflow/tfjs-core@4.10.0 --force

# Build frontend
FROM frontend-deps AS frontend-builder
WORKDIR /app/frontend

# Copy frontend source
COPY frontend/ ./

# Build frontend
RUN yarn build

# Build backend
FROM backend-deps AS backend-builder
WORKDIR /app/backend

# Copy backend source
COPY backend/ ./

# Create simplified tsconfig for build
RUN echo '{"extends":"./tsconfig.json","compilerOptions":{"skipLibCheck":true,"noEmit":false,"outDir":"dist"}}' > tsconfig.build.json

# Build backend
RUN yarn tsc -p tsconfig.build.json

# Final image
FROM base
WORKDIR /app

# Copy built frontend
COPY --from=frontend-builder /app/frontend/out /app/frontend/out

# Copy built backend
COPY --from=backend-builder /app/backend/dist /app/backend/dist
COPY --from=backend-builder /app/backend/node_modules /app/backend/node_modules

# Install serve for frontend
RUN yarn global add serve

# Create start script
RUN echo '#!/bin/bash\nset -e\n\n# Start the backend in the background\ncd /app/backend && node dist/index.js &\nBACKEND_PID=$!\n\n# Wait for backend to start\nsleep 5\n\n# Start the frontend on the port Railway expects\ncd /app/frontend && serve -s out -p ${PORT:-3000} &\nFRONTEND_PID=$!\n\n# Monitor both processes\nwait $BACKEND_PID $FRONTEND_PID' > start.sh && chmod +x start.sh

# Expose ports
EXPOSE 3000 3010

# Start both services
CMD ["/app/start.sh"]
