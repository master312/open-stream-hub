#!/bin/bash

# Exit on any error
set -e

# Load environment variables from .env file if it exists
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
    echo "🔧 Found .env.production file, loading variables from it"
fi

echo "🏗️  Building frontend image..."

# Set default values for required variables if not set
FRONTEND_PORT=${FRONTEND_PORT:-3000}
REST_API_PORT=${REST_API_PORT:-6636}
REGISTRY=${REGISTRY:-""}
VERSION=${VERSION:-latest}

# Construct image name
IMAGE_NAME="${REGISTRY}open-stream-hub-frontend:${VERSION}"

echo "📦 Building image: ${IMAGE_NAME}"
echo "🔧 Configuration:"
echo "   Frontend Port: ${FRONTEND_PORT}"
echo "   Backend Port: ${REST_API_PORT}"

# Build the Docker image
docker build \
    --build-arg FRONTEND_PORT=${FRONTEND_PORT} \
    --build-arg REST_API_PORT=${REST_API_PORT} \
    -f docker/production/frontend/Dockerfile \
    -t ${IMAGE_NAME} \
    .

echo "✅ Frontend image built successfully: ${IMAGE_NAME}"
