# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy env.js file to assets
COPY public/env.js /usr/share/nginx/html/env.js

# Copy and set up the env-config script
COPY docker-setup-env.sh /docker-entrypoint.d/docker-setup-env.sh
RUN chmod +x /docker-entrypoint.d/docker-setup-env.sh

# Expose port 80
EXPOSE 80

# nginx container already has a CMD entry point, so we don't need to specify it
