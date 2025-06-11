#!/bin/bash

# Set default values
HOST=${HOST:-localhost}
PORT=${PORT:-3010}
MAX_RETRIES=30
RETRY_INTERVAL=5

# Check if curl is installed
if ! command -v curl &> /dev/null; then
    echo "Error: curl is not installed"
    exit 1
fi

# Function to check health
check_health() {
    local url="http://$HOST:$PORT/api/health"
    echo "Checking health at $url..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "200" ]; then
        echo "Health check passed: $response"
        exit 0
    else
        echo "Health check failed with status: $response"
        return 1
    fi
}

# Retry logic
for ((i=1; i<=MAX_RETRIES; i++)); do
    if check_health; then
        exit 0
    fi
    
    if [ $i -lt $MAX_RETRIES ]; then
        echo "Retrying in $RETRY_INTERVAL seconds... (Attempt $i/$MAX_RETRIES)"
        sleep $RETRY_INTERVAL
    fi
done

echo "Health check failed after $MAX_RETRIES attempts"
exit 1
