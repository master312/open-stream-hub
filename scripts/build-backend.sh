#!/bin/bash

# Exit on any error
set -e

# Load environment variables from .env file if it exists
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
    echo "🔧 Found .env.production file, loading variables from it"
fi

echo "🏗️  Building backend image..."

# Set default values for required variables if not set
REST_API_PORT=${REST_API_PORT:-6636}
RTMP_INJECT_PORT=${RTMP_INJECT_PORT:-1935}
MONGODB_URI=${MONGODB_URI:-"mongodb://mongodb:27017/open-stream-hub"}
REGISTRY=${REGISTRY:-""}
VERSION=${VERSION:-latest}

AUTOMATIC_YES=${AUTOMATIC_YES:-"false"}

# Construct image name
IMAGE_NAME="${REGISTRY}open-stream-hub-backend:${VERSION}"

echo "📦 Building image: ${IMAGE_NAME}"
echo "🔧 Configuration:"
echo "   Backend Port: ${REST_API_PORT}"
echo "   RTMP Port: ${RTMP_INJECT_PORT}"
echo "   MongoDB URI: ${MONGODB_URI}"

if [ "${AUTOMATIC_YES}" = "false" ]; then
    read -p "Do you want to continue? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "⚠️  Aborting..."
        exit 1
    fi
fi

# Build the Docker image
docker build \
    --build-arg REST_API_PORT=${REST_API_PORT} \
    --build-arg RTMP_INJECT_PORT=${RTMP_INJECT_PORT} \
    --build-arg MONGODB_URI=${MONGODB_URI} \
    -f docker/production/backend/Dockerfile \
    -t ${IMAGE_NAME} \
    .

echo "✅ Backend image built successfully: ${IMAGE_NAME}"
