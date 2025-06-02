FROM node:18

WORKDIR /app

# Create .npmrc file with settings to handle dependency issues
RUN echo "legacy-peer-deps=true\nstrict-peer-dependencies=false" > ./.npmrc

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install --no-package-lock

# Copy all files
COPY . .

# Create .env file to skip TypeScript checks
RUN echo "NEXT_SKIP_TYPECHECKING=true\nTYPESCRIPT_IGNORE_FILE=true" > .env.local

# Build the app with type checking disabled
RUN npm run build --no-lint

# Expose the port
EXPOSE 3000

# Start the app
CMD ["npx", "next", "start"]
