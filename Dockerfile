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

# Create .env file to skip TypeScript checks
RUN echo "NEXT_SKIP_TYPECHECKING=true\nTYPESCRIPT_IGNORE_FILE=true" > .env.local

# Build with type checking disabled
RUN npm run build

# Copy frontend build to where backend can serve it
WORKDIR /app
RUN mkdir -p /app/backend/frontend
RUN cp -r /app/frontend/out /app/backend/

# Copy remaining files
COPY . .

# Create start script
RUN echo '#!/bin/bash\nset -e\n\n# Start the backend\ncd /app/backend && node dist/index.js' > start.sh && chmod +x start.sh

# Expose ports
EXPOSE 3000 3010

# Start both services
CMD ["/app/start.sh"]
