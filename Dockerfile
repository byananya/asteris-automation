FROM node:18

WORKDIR /app

# Install required system dependencies for TensorFlow
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Create custom .npmrc files with stronger settings
RUN echo "legacy-peer-deps=true\nstrict-peer-dependencies=false\nforce=true" > ./backend/.npmrc && \
    echo "legacy-peer-deps=true\nstrict-peer-dependencies=false" > ./frontend/.npmrc

# Install backend dependencies first
WORKDIR /app/backend
RUN npm install --no-package-lock --force

# Install specific TensorFlow packages with exact versions
RUN npm install @tensorflow-models/universal-sentence-encoder@1.3.3 --force --no-package-lock && \
    npm install @tensorflow/tfjs-node@4.10.0 --force --no-package-lock && \
    npm install @tensorflow/tfjs-core@4.10.0 --force --no-package-lock

# Copy the backend code
COPY backend/ ./

# Use the custom build script
RUN NODE_OPTIONS="--no-warnings" npm run build

# Now install frontend dependencies
WORKDIR /app/frontend
RUN npm install --no-package-lock

# Copy frontend files and build
COPY frontend/ ./
COPY frontend/.env.production ./

# Build the frontend
RUN npm run build

# Back to main directory
WORKDIR /app

# Copy any remaining files
COPY . .

# Create a start script
RUN echo '#!/bin/bash\n\n# Start the backend in the background\ncd /app/backend && node dist/index.js &\n\n# Wait for backend to start\nsleep 5\n\n# Start the frontend on the port Railway expects\ncd /app/frontend && npx serve -s out -p ${PORT:-3000}' > start.sh && chmod +x start.sh

# Expose the ports
EXPOSE 3000 3010

# Start both services
CMD ["/app/start.sh"]
