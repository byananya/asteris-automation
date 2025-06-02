FROM node:18-alpine

WORKDIR /app

# Install necessary build dependencies
RUN apk add --no-cache python3 make g++ curl

# Copy package files first for better caching
COPY package*.json ./

# Create custom .npmrc file with stronger settings
RUN echo "legacy-peer-deps=true\nstrict-peer-dependencies=false" > ./.npmrc

# Install dependencies
RUN npm install --no-package-lock --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Add environment variable for API URL
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-http://localhost:3010}

# Build the frontend
RUN npm run build

# Install a simple server to serve the frontend
RUN npm install -g serve

# Expose the port
EXPOSE 3000

# Start the frontend
CMD ["serve", "-s", "out", "-p", "${PORT:-3000}"]
