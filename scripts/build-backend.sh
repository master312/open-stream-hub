#!/bin/bash

# Exit on any error
set -e

# Load environment variables from .env file if it exists
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

echo "🏗️  Building backend image..."

# Set default values for required variables if not set
BACKEND_PORT=${BACKEND_PORT:-6636}
RTMP_INJECT_PORT=${RTMP_INJECT_PORT:-1935}
MONGODB_URI=${MONGODB_URI:-"mongodb://mongodb:27017"}
MONGODB_DB_NAME=${MONGODB_DB_NAME:-"open-stream-hub"}
REGISTRY=${REGISTRY:-""}
VERSION=${VERSION:-latest}

# Construct image name
IMAGE_NAME="${REGISTRY}open-stream-hub-backend:${VERSION}"

echo "📦 Building image: ${IMAGE_NAME}"
echo "🔧 Configuration:"
echo "   Backend Port: ${BACKEND_PORT}"
echo "   RTMP Port: ${RTMP_INJECT_PORT}"
echo "   MongoDB URI: ${MONGODB_URI}"
echo "   MongoDB DB Name: ${MONGODB_DB_NAME}"

# Build the Docker image
docker build \
    --build-arg BACKEND_PORT=${BACKEND_PORT} \
    --build-arg RTMP_INJECT_PORT=${RTMP_INJECT_PORT} \
    --build-arg MONGODB_URI=${MONGODB_URI} \
    --build-arg MONGODB_DB_NAME=${MONGODB_DB_NAME} \
    -f docker/production/backend/Dockerfile \
    -t ${IMAGE_NAME} \
    .

echo "✅ Backend image built successfully: ${IMAGE_NAME}"
