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
#
# Build requirements:
# - ENABLE_EXPERIMENTAL_COREPACK=1 must be set in Vercel project settings
#   (or corepack enable must run before pnpm install) so Vercel uses pnpm 10
#   matching the packageManager field in package.json
# - Next.js is pinned to 16.1.7 due to Vercel adapter crash with
#   shouldNormalizeNextData in 16.2.x (revisit when Next.js fixes this)

set -e

echo "=== Convex + Vercel Build ==="
echo "VERCEL_ENV: $VERCEL_ENV"
echo "VERCEL_GIT_COMMIT_REF: $VERCEL_GIT_COMMIT_REF"

# Build command that also captures the Convex URL for E2E tests
# The URL is written to a static file that can be fetched by the E2E workflow
BUILD_CMD='pnpm --filter @groupi/web build && mkdir -p packages/web/public/.well-known && echo "{\"convexUrl\": \"$NEXT_PUBLIC_CONVEX_URL\", \"branch\": \"$VERCEL_GIT_COMMIT_REF\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > packages/web/public/.well-known/e2e-config.json'

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

  npx convex deploy \
    --preview-create "$PREVIEW_NAME" \
    --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL \
    --cmd "$BUILD_CMD"

  # Set environment variables on preview deployments
  echo "Configuring preview environment: $PREVIEW_NAME..."
  npx convex env set E2E_TESTING true --preview-name "$PREVIEW_NAME" || echo "Warning: Could not set E2E_TESTING env var"

  # Auth needs SITE_URL and BETTER_AUTH_SECRET to create sessions
  if [ -n "$BETTER_AUTH_SECRET" ]; then
    PREVIEW_SITE_URL="${VERCEL_BRANCH_URL:+https://$VERCEL_BRANCH_URL}"
    if [ -n "$PREVIEW_SITE_URL" ]; then
      npx convex env set SITE_URL "$PREVIEW_SITE_URL" --preview-name "$PREVIEW_NAME" || true
      npx convex env set BETTER_AUTH_URL "$PREVIEW_SITE_URL" --preview-name "$PREVIEW_NAME" || true
    fi
    npx convex env set BETTER_AUTH_SECRET "$BETTER_AUTH_SECRET" --preview-name "$PREVIEW_NAME" || true
  fi
fi

echo "=== Build Complete ==="
