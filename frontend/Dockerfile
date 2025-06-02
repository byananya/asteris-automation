FROM node:18-slim

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
COPY frontend/package*.json ./frontend/

# Create .npmrc file with necessary settings
RUN echo "legacy-peer-deps=true\nstrict-peer-dependencies=false" > ./frontend/.npmrc

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install --no-package-lock

# Copy the frontend code
COPY frontend/ ./

# Build the frontend
RUN npm run build

# Install a simple server to serve the frontend
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Start the frontend
CMD ["npx", "serve", "-s", "out", "-p", "3000"]
