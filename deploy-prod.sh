#!/bin/bash
set -e

# Load environment variables
if [ -f .env.production ]; then
    export $(grep -v '^#' .env.production | xargs)
else
    echo "Error: .env.production file not found."
    exit 1
fi

# Create necessary directories
mkdir -p nginx/conf.d ssl

# Copy SSL certificates (you need to place your certificates in the ssl/ directory)
# Example: cp /path/to/your/ssl/* ssl/

# Build and start services
echo "Building and starting production services..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "Production deployment complete!"
echo "Frontend: https://yourdomain.com"
echo "Backend API: https://yourdomain.com/api"
echo ""
echo "To view logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
