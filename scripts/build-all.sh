#!/bin/bash

# Exit on any error
set -e

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Building all images..."

# Build backend
"${SCRIPT_DIR}/build-backend.sh"

# Build frontend
"${SCRIPT_DIR}/build-frontend.sh"

echo "✨ All images built successfully!"
