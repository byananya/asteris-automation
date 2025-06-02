FROM node:18

WORKDIR /app

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create .npmrc file with settings to handle dependency issues
RUN echo "legacy-peer-deps=true\nstrict-peer-dependencies=false\nforce=true" > /root/.npmrc

# Copy package files
COPY package.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies for backend
WORKDIR /app/backend
RUN npm install --no-package-lock --force

# Install dependencies for frontend
WORKDIR /app/frontend
RUN npm install --no-package-lock --force
# Explicitly install lucide-react
RUN npm install lucide-react@0.294.0 --no-package-lock --force

# Copy source files
WORKDIR /app
COPY . .

# Build backend
WORKDIR /app/backend
RUN echo '{"extends":"./tsconfig.json","compilerOptions":{"skipLibCheck":true,"noEmit":false,"outDir":"dist"}}' > tsconfig.build.json
RUN npx tsc -p tsconfig.build.json

# Build frontend
WORKDIR /app/frontend
RUN echo "NEXT_SKIP_TYPECHECKING=true\nTYPESCRIPT_IGNORE_FILE=true" > .env.local
# Build and export static files
RUN npm run build:static

# Create directory for frontend files in backend
WORKDIR /app
RUN mkdir -p /app/backend/frontend
# Copy the static export to the backend directory
RUN ls -la /app/frontend/out || echo "out directory not found"
RUN cp -r /app/frontend/out/* /app/backend/frontend/ || (echo "Failed to copy frontend files" && exit 1)

# Create start script
RUN echo '#!/bin/bash\ncd /app/backend && node dist/index.js' > /app/start.sh
RUN chmod +x /app/start.sh

# Expose port
EXPOSE 3010

# Start the application
CMD ["/app/start.sh"]
