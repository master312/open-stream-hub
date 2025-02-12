#!/bin/sh

echo "Starting environment variable replacement..."

# Loop through all environment variables that start with VITE_
for i in $(env | grep VITE_)
do
    # Split the environment variable into key and value
    key=$(echo $i | cut -d '=' -f 1)
    value=$(echo $i | cut -d '=' -f 2-)

    # Log the replacement that we're attempting
    echo "Processing: $key with value: $value"

    # Escape forward slashes in the value for sed
    escaped_value=$(echo "$value" | sed 's/\//\\\//g')

    # Only replace values after the key and colon
    # This ensures we only replace the value part in "key: 'VITE_VALUE'" patterns
    find /usr/share/nginx/html -type f -name '*.js' -exec sed -i "s|$key: \"$key\"|$key: \"$escaped_value\"|g" '{}' +
    find /usr/share/nginx/html -type f -name '*.js' -exec sed -i "s|$key: '$key'|$key: '$escaped_value'|g" '{}' +

    echo "Replacement complete for $key"
done

echo "Environment variable replacement complete!"