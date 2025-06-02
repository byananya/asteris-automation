FROM node:18-slim

WORKDIR /app

# Copy package files first for better caching
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
COPY package*.json ./

# Copy .npmrc file
COPY backend/.npmrc ./backend/

# Install dependencies using npm install (not npm ci)
RUN cd backend && npm install --no-package-lock

# Copy the rest of the application
COPY . .

# Build the backend
RUN cd backend && npm run build

# Expose the port
EXPOSE 3010

# Start the backend
CMD ["node", "backend/dist/index.js"]
