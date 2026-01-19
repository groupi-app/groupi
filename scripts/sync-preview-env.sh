#!/bin/bash

# Sync environment variables from .env.preview.convex to Convex preview deployment
# Usage: ./scripts/sync-preview-env.sh [preview-name]
# Default preview name: test

set -e

PREVIEW_NAME="${1:-test}"
ENV_FILE=".env.preview.convex"

if [ ! -f "$ENV_FILE" ]; then
    echo "Error: $ENV_FILE not found!"
    echo "Create it first with your environment variables."
    exit 1
fi

echo "Syncing environment variables to Convex preview: $PREVIEW_NAME"
echo "Reading from: $ENV_FILE"
echo ""

# Read each line from the env file
while IFS= read -r line || [ -n "$line" ]; do
    # Skip empty lines and comments
    if [[ -z "$line" || "$line" =~ ^# ]]; then
        continue
    fi

    # Extract variable name and value
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
        name="${BASH_REMATCH[1]}"
        value="${BASH_REMATCH[2]}"

        echo "Setting $name..."
        npx convex env set "$name" "$value" --preview-name "$PREVIEW_NAME"
    fi
done < "$ENV_FILE"

echo ""
echo "Done! Environment variables synced to preview: $PREVIEW_NAME"
echo ""
echo "Current environment variables:"
npx convex env list --preview-name "$PREVIEW_NAME"
