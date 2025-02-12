#!/bin/bash

# Exit on any error
set -e

echo "🏗️  Building backend image..."

# Set default values for required variables if not set
REGISTRY=${REGISTRY:-""}
VERSION=${VERSION:-latest}

AUTOMATIC_YES=${AUTOMATIC_YES:-"false"}

# Construct image name
IMAGE_NAME="${REGISTRY}open-stream-hub-backend:${VERSION}"

echo "📦 Building image: ${IMAGE_NAME}"
echo "🔧 Configuration: None"

if [ "${AUTOMATIC_YES}" = "false" ]; then
    read -p "Do you want to continue? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "⚠️  Aborting..."
        exit 1
    fi
fi

# Build the Docker image
cd backend
docker build \
    -f ../docker/production/backend/Dockerfile \
    -t ${IMAGE_NAME} \
    .

echo "✅ Backend image built successfully: ${IMAGE_NAME}"
