# open-stream-hub
A web app meant to be run on server. Used to redirect single video stream to multiple destinations

## !!!! App is in development, use at your own risk. !!!!

# Deploy for development
### Requirements
- MongoDB
- Deno
- ffmpeg

First you need MongoDB running, then,


To run all, in dev mode, run following from the projects root:
```bash
deno task dev
```

Or to run individually:

# Frontend
```bash
deno run dev:frontend
```

# Backend
```bash
deno run dev:backend
```

# Deployment Guide For production

This document describes how to build and deploy the Open Stream Hub stack in production.

## Prerequisites

- Docker Engine 20.10.0 or newer
- Docker Compose V2
- At least 1GB of free RAM

## Environment Configuration
There is already defulat env provided in root.

Different env files for different docker builds are in /docker/build_name folder.
```env
# Frontend
FRONTEND_PORT=3000
FRONTEND_HOST=localhost

# Backend
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=open-stream-hub
RTMP_INJECT_PORT=1935
RTMP_INJECT_PUBLIC_URL=rtmp://localhost
RTMP_INJECT_LINK_ROOT=/live
BACKEND_PORT=6636

FRONTEND_PORT=3000
FRONTEND_BACKEND_HOST=http://localhost:6636
FRONTEND_HOST=0.0.0.0
```

## Building the Application

There are two ways to build the application:

### 1. Using Build Scripts

The project includes convenience scripts for building:

```bash
# Build everything (frontend and backend)
./scripts/build-all.sh

# Build only frontend
./scripts/build-frontend.sh

# Build only backend
./scripts/build-backend.sh
```

### 2. Using Docker Compose

```bash
cd docker/production
docker compose -f compose.production.yml build
```

## Deploying the Stack

### Starting the Stack

```bash
cd docker/production
docker compose --env-file .env -f compose.production.yml up -d
```

### Managing the Stack

```bash
# Stop the stack
docker compose -f compose.production.yml down

# Rebuild and restart a specific service
docker compose -f compose.production.yml up -d --build frontend

# View logs of a specific service
docker compose -f compose.production.yml logs -f backend

# Complete cleanup (including volumes)
docker compose -f compose.production.yml down -v
```

## Accessing the Application

Once deployed, the services are available at:
(considering you are using default env config)

- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:6636`
- RTMP Endpoint: `rtmp://localhost:1935`
