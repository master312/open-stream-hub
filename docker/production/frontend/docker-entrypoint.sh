#!/bin/sh

# Replace environment variables in the nginx configuration template
envsubst '${FRONTEND_PORT} ${REST_API_PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Execute the CMD
exec "$@"
