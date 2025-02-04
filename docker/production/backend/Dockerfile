FROM denoland/deno:2.1.1

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend files and common folder
COPY backend ./
COPY common ../common

# Cache dependencies
RUN deno cache --lock=deno.lock main.ts

# The port your app runs on
EXPOSE $REST_API_PORT
EXPOSE $RTMP_INJECT_PORT

# Run the app
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "--allow-run", "--allow-sys", "main.ts"]
