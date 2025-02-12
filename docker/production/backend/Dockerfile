# Build stage
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

RUN npm run build

# Production stage
FROM node:22-slim

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Run the application
CMD ["npm", "run", "start:prod"]
