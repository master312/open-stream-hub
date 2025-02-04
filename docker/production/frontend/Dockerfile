FROM node:20-alpine AS builder

# Add ARG statements to accept build arguments
ARG FRONTEND_PORT
ARG REST_API_HOST
ARG REST_API_PORT

WORKDIR /app

# Copy package files
COPY frontend/package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend files and common folder
COPY frontend ./
COPY common ../common

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Add ARG statements again (as they don't persist across build stages)
ARG FRONTEND_PORT
ARG REST_API_HOST
ARG REST_API_PORT

# Copy build output to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx template and script
COPY docker/production/frontend/nginx.template /etc/nginx/templates/default.conf.template
COPY docker/production/frontend/docker-entrypoint.sh /docker-entrypoint.sh

# Make the entrypoint script executable
RUN chmod +x /docker-entrypoint.sh

# Environment variables using ARGs
ENV FRONTEND_PORT=${FRONTEND_PORT:-3000}
ENV REST_API_HOST=${REST_API_HOST:-localhost}
ENV REST_API_PORT=${REST_API_PORT:-6636}

EXPOSE ${FRONTEND_PORT}

# Use custom entrypoint script
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
