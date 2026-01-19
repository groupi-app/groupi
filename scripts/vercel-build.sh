#!/bin/bash
# Vercel build script that handles Convex deployments correctly
# - Production: deploys to Convex production
# - Preview: deploys to a consistent preview deployment based on branch name
#
# IMPORTANT: Do NOT set NEXT_PUBLIC_CONVEX_URL or NEXT_PUBLIC_CONVEX_SITE_URL
# in Vercel env vars. Convex sets these automatically during the build.
#
# You DO need to set these in Vercel:
# - CONVEX_DEPLOY_KEY (for authentication)
#
# You need to set these on each Convex deployment (production and each preview):
# - SITE_URL (your frontend URL, e.g., https://groupi.gg or https://test.groupi.gg)
# - BETTER_AUTH_SECRET
# - DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET
# - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# - Any other backend env vars

set -e

echo "=== Convex + Vercel Build ==="
echo "VERCEL_ENV: $VERCEL_ENV"
echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

if [ "$VERCEL_ENV" = "production" ]; then
  echo "Deploying to Convex production..."
  npx convex deploy --cmd 'pnpm --filter @groupi/web build'
else
  # Use branch name as preview name for consistent deployments
  PREVIEW_NAME="${VERCEL_GIT_COMMIT_REF:-preview}"
  # Sanitize branch name (replace special chars with dashes, lowercase)
  PREVIEW_NAME=$(echo "$PREVIEW_NAME" | sed 's/[^a-zA-Z0-9]/-/g' | tr '[:upper:]' '[:lower:]')

  echo "Deploying to Convex preview: $PREVIEW_NAME..."
  echo "(First deploy to a new branch will create a new preview deployment)"
  echo "(Subsequent deploys reuse the same preview deployment)"
  npx convex deploy --preview-create "$PREVIEW_NAME" --cmd 'pnpm --filter @groupi/web build'
fi

echo "=== Build Complete ==="
