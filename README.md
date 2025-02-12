# open-stream-hub
A web app meant to be simple, and run on server.
Uses ffmpeg to redirect input stream from RTMP to other platforms (like Twitch, YouTube, etc).
Can also be used just as RTMP server it self.

## !!!! App is in development, use at your own risk. !!!!
![img.png](img.png)
# Deploy for development
### Requirements
- MongoDB
- NodeJS
- ffmpeg

First you need MongoDB running, then,


To run all, in dev mode, run following from the projects root:
```bash
npm run dev
```

Or to run individually:

# Frontend
```bash
cd frontend
npm run dev
```

# Backend
```bash
cd backend
npm run start:dev
```

# Deployment Guide For production

This document describes how to build and deploy the Open Stream Hub stack in production.

## Prerequisites

- Docker Engine 20.10.0 or newer
- Docker Compose V2
- At least 1GB of free RAM

## Building the Application

### Using Build Scripts

The project includes convenience scripts for building, run them from the project root.

```bash
# Build everything (frontend and backend)
./scripts/build-all.sh

# Build only frontend
./scripts/build-frontend.sh

# Build only backend
./scripts/build-backend.sh
```

## Deploying the Stack


# Environment
- Dev env files are at /backend/.env.dev and /frontend/.env.development. 
- All variables and their descriptions are located in those env files.
- For production, pass your values into docker-compose

### Starting the Stack
First build images, and then:
```bash
cd docker/production
docker-compose up -d
```

## Accessing the Application

Once deployed, the services are available at:
(considering you are using default env config)

- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:6636`
- RTMP Endpoint: `rtmp://localhost:1935`
