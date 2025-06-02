FROM node:18

WORKDIR /app

# Install required system dependencies for TensorFlow
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY package*.json ./

# Create custom .npmrc files with stronger settings
RUN echo "legacy-peer-deps=true\nstrict-peer-dependencies=false\nforce=true" > ./backend/.npmrc && \
    echo "legacy-peer-deps=true\nstrict-peer-dependencies=false" > ./frontend/.npmrc

# Install backend dependencies with specific flags to handle TensorFlow issues
RUN cd backend && \
    npm install --no-package-lock --force && \
    npm install @tensorflow-models/universal-sentence-encoder@1.3.3 --force && \
    npm install @tensorflow/tfjs-node@4.10.0 --force && \
    npm install @tensorflow/tfjs-core@4.10.0 --force

# Install frontend dependencies
RUN cd frontend && npm install --no-package-lock

# Copy the rest of the application
COPY . .

# Use the existing production .env file for the frontend
COPY frontend/.env.production ./frontend/.env.production

# Build the backend with skipLibCheck to avoid type errors
RUN cd backend && npm run build

# Build the frontend
RUN cd frontend && npm run build

# Install a simple server to serve the frontend
RUN npm install -g serve

# Create a start script that uses Railway's PORT environment variable
RUN echo '#!/bin/bash\n\n# Start the backend in the background\nnode backend/dist/index.js &\n\n# Start the frontend on the port Railway expects\ncd frontend && npx serve -s out -p ${PORT:-3000}' > start.sh && chmod +x start.sh

# Expose the ports
EXPOSE 3000 3010

# Start both services
CMD ["/app/start.sh"]
