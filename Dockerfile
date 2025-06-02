FROM node:18

WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Create .npmrc files
RUN echo "legacy-peer-deps=true\nstrict-peer-dependencies=false\nforce=true" > ./.npmrc && \
    cp ./.npmrc ./backend/.npmrc && \
    cp ./.npmrc ./frontend/.npmrc

# Install root dependencies
RUN npm install --no-package-lock

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --no-package-lock --force

# Install specific TensorFlow packages
RUN npm install @tensorflow-models/universal-sentence-encoder@1.3.3 --force --no-package-lock && \
    npm install @tensorflow/tfjs-node@4.10.0 --force --no-package-lock && \
    npm install @tensorflow/tfjs-core@4.10.0 --force --no-package-lock

# Copy backend files and build
COPY backend/ ./
RUN echo '{"extends":"./tsconfig.json","compilerOptions":{"skipLibCheck":true,"noEmit":false,"outDir":"dist"}}' > tsconfig.build.json && \
    npx tsc -p tsconfig.build.json

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install --no-package-lock

# Copy frontend files and build
COPY frontend/ ./
RUN npm run build

# Install serve globally
WORKDIR /app
RUN npm install -g serve

# Copy remaining files
COPY . .

# Create start script
RUN echo '#!/bin/bash\nset -e\n\n# Start the backend in the background\ncd /app/backend && node dist/index.js &\nBACKEND_PID=$!\n\n# Wait for backend to start\nsleep 5\n\n# Start the frontend on the port Railway expects\ncd /app/frontend && serve -s out -p ${PORT:-3000} &\nFRONTEND_PID=$!\n\n# Monitor both processes\nwait $BACKEND_PID $FRONTEND_PID' > start.sh && chmod +x start.sh

# Expose ports
EXPOSE 3000 3010

# Start both services
CMD ["/app/start.sh"]
