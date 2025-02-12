#!/bin/bash

# Exit on any error
set -e
echo "🏗️  Building frontend image..."

# Set default values for required variables if not set
REGISTRY=${REGISTRY:-""}
VERSION=${VERSION:-latest}
PLATFORMS=${PLATFORMS:-"linux/amd64"}
AUTOMATIC_YES=${AUTOMATIC_YES:-"false"}

# Construct image name
IMAGE_NAME="${REGISTRY}open-stream-hub-frontend:${VERSION}"

echo "📦 Building image: ${IMAGE_NAME}"
echo "🔧 Platforms: ${PLATFORMS}"

if [ "${AUTOMATIC_YES}" = "false" ]; then
    read -p "Do you want to continue? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "⚠️  Aborting..."
        exit 1
    fi
fi

# Create and use a new builder instance
docker buildx create --use

cd frontend

# Check if we're building for multiple platforms
if [[ "$PLATFORMS" == *","* ]]; then
    echo "📦 Building for multiple platforms - using push mode"
    docker buildx build \
        --platform ${PLATFORMS} \
        -f ../docker/production/frontend/Dockerfile \
        -t ${IMAGE_NAME} \
        --push \
        .
else
    echo "📦 Building for single platform - using local mode"
    docker buildx build \
        --platform ${PLATFORMS} \
        -f ../docker/production/frontend/Dockerfile \
        -t ${IMAGE_NAME} \
        --load \
        .
fi

echo "✅ Frontend image built successfully: ${IMAGE_NAME}"
