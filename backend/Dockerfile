FROM node:18

WORKDIR /app

# Install required system dependencies for TensorFlow
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./
COPY backend/package*.json ./backend/

# Create custom .npmrc file with stronger settings
RUN echo "legacy-peer-deps=true\nstrict-peer-dependencies=false\nforce=true" > ./backend/.npmrc

# Install dependencies with specific flags to handle TensorFlow issues
WORKDIR /app/backend
RUN npm install --no-package-lock --force && \
    npm install @tensorflow-models/universal-sentence-encoder@1.3.3 --force && \
    npm install @tensorflow/tfjs-node@4.10.0 --force && \
    npm install @tensorflow/tfjs-core@4.10.0 --force

# Copy the backend code
COPY backend/ ./

# Build the backend with skipLibCheck to avoid type errors
RUN npm run build

# Expose the port
EXPOSE 3010

# Start the backend
CMD ["node", "dist/index.js"]
