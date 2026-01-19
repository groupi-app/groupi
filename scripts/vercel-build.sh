#!/bin/bash
# Vercel build script that handles Convex deployments correctly
# - Production: deploys to Convex production
# - Preview: deploys to a consistent preview deployment based on branch name
#
# Required Vercel env vars:
# - CONVEX_DEPLOY_KEY (Preview Deploy Key from Convex dashboard)
# - BETTER_AUTH_SECRET (used by Next.js auth handler at runtime)
#
# Convex env vars (set once per deployment via CLI or dashboard):
# - SITE_URL, BETTER_AUTH_SECRET, DISCORD_*, GOOGLE_*

set -e

echo "=== Convex + Vercel Build ==="
echo "VERCEL_ENV: $VERCEL_ENV"
echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

BUILD_CMD='pnpm --filter @groupi/web build'

if [ "$VERCEL_ENV" = "production" ]; then
  echo "Deploying to Convex production..."
  npx convex deploy \
    --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL \
    --cmd "$BUILD_CMD"
else
  # Use branch name as preview name for consistent deployments
  PREVIEW_NAME="${VERCEL_GIT_COMMIT_REF:-preview}"
  # Sanitize branch name (replace special chars with dashes, lowercase)
  PREVIEW_NAME=$(echo "$PREVIEW_NAME" | sed 's/[^a-zA-Z0-9]/-/g' | tr '[:upper:]' '[:lower:]')

  echo "Deploying to Convex preview: $PREVIEW_NAME..."
  echo "(Preview env vars should be set via CLI: npx convex env set VAR value --preview-name $PREVIEW_NAME)"

  npx convex deploy \
    --preview-create "$PREVIEW_NAME" \
    --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL \
    --cmd "$BUILD_CMD"
fi

echo "=== Build Complete ==="
