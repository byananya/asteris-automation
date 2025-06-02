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

# Install frontend dependencies first (since they're simpler)
WORKDIR /app/frontend
RUN npm install --no-package-lock

# Copy frontend files and build
COPY frontend/ ./
COPY frontend/.env.production ./

# Build the frontend
RUN npm run build

# Now handle the backend
WORKDIR /app/backend

# Install backend dependencies
RUN npm install --no-package-lock --force

# Install specific TensorFlow packages with exact versions
RUN npm install @tensorflow-models/universal-sentence-encoder@1.3.3 --force --no-package-lock && \
    npm install @tensorflow/tfjs-node@4.10.0 --force --no-package-lock && \
    npm install @tensorflow/tfjs-core@4.10.0 --force --no-package-lock

# Copy the backend code
COPY backend/ ./

# Directly compile TypeScript files with skipLibCheck
RUN echo '{"extends":"./tsconfig.json","compilerOptions":{"skipLibCheck":true,"noEmit":false,"outDir":"dist"}}' > tsconfig.build.json && \
    npx tsc -p tsconfig.build.json

# Back to main directory
WORKDIR /app

# Copy any remaining files
COPY . .

# Create a start script with proper error handling
RUN echo '#!/bin/bash\nset -e\n\n# Start the backend in the background\ncd /app/backend && node dist/index.js &\nBACKEND_PID=$!\n\n# Wait for backend to start\nsleep 5\n\n# Start the frontend on the port Railway expects\ncd /app/frontend && npx serve -s out -p ${PORT:-3000} &\nFRONTEND_PID=$!\n\n# Monitor both processes\nwait $BACKEND_PID $FRONTEND_PID' > start.sh && chmod +x start.sh

# Expose the ports
EXPOSE 3000 3010

# Start both services
CMD ["/app/start.sh"]
