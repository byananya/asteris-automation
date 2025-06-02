FROM node:18

WORKDIR /app

# Install required system dependencies for TensorFlow
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files first for better caching
COPY package*.json ./

# Create custom .npmrc file with stronger settings
RUN echo "legacy-peer-deps=true\nstrict-peer-dependencies=false\nforce=true" > ./.npmrc

# Install dependencies with specific flags to handle TensorFlow issues
RUN npm install --no-package-lock --force

# Copy the rest of the application
COPY . .

# Create a simplified tsconfig for build
RUN echo '{"extends":"./tsconfig.json","compilerOptions":{"skipLibCheck":true,"noEmit":false,"outDir":"dist"}}' > tsconfig.build.json

# Build the backend with skipLibCheck to avoid type errors
RUN npx tsc -p tsconfig.build.json

# Expose the port the app runs on
EXPOSE 3010

# Command to run the application
CMD ["node", "dist/index.js"]
