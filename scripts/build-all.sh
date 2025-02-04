#
# This script is ment to be run from the project root
#

#!/bin/bash

set -e

# Get the directory where the script is located
SCRIPT_DIR="scripts"

echo "🚀 Building all images..."

# Build backend
"${SCRIPT_DIR}/build-backend.sh"

# Build frontend
"${SCRIPT_DIR}/build-frontend.sh"

echo "✨ All images built successfully!"
