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
# - BETTER_AUTH_SECRET, DISCORD_*, GOOGLE_*
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

  PREVIEW_HOST="${VERCEL_BRANCH_URL:-${VERCEL_URL:-}}"
  if [ -z "$PREVIEW_HOST" ]; then
    echo "Error: VERCEL_BRANCH_URL or VERCEL_URL is required for preview auth configuration"
    exit 1
  fi
  PREVIEW_SITE_URL="https://$PREVIEW_HOST"

  # Claim a fresh deployment before configuring it. The initial function push
  # can fail because auth intentionally requires SITE_URL during analysis; the
  # deployment is still created and can then be configured before the real push.
  echo "Creating Convex preview: $PREVIEW_NAME..."
  if ! npx convex deploy --preview-create "$PREVIEW_NAME"; then
    echo "Initial preview push deferred until auth environment is configured"
  fi

  echo "Configuring preview environment: $PREVIEW_NAME..."
  npx convex env set SITE_URL "$PREVIEW_SITE_URL" --preview-name "$PREVIEW_NAME"
  npx convex env set BETTER_AUTH_URL "$PREVIEW_SITE_URL" --preview-name "$PREVIEW_NAME"
  npx convex env set PASSKEY_RP_ID "$PREVIEW_HOST" --preview-name "$PREVIEW_NAME"
  npx convex env set PASSKEY_RP_NAME Groupi --preview-name "$PREVIEW_NAME"
  npx convex env set E2E_TESTING true --preview-name "$PREVIEW_NAME"

  # Better Auth needs a stable secret to create sessions.
  if [ -n "$BETTER_AUTH_SECRET" ]; then
    npx convex env set BETTER_AUTH_SECRET "$BETTER_AUTH_SECRET" --preview-name "$PREVIEW_NAME"
  else
    echo "Warning: BETTER_AUTH_SECRET is not available; preview sign-in may not work"
  fi

  echo "Deploying to Convex preview: $PREVIEW_NAME..."
  npx convex deploy \
    --preview-name "$PREVIEW_NAME" \
    --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL \
    --cmd "$BUILD_CMD"
fi

echo "=== Build Complete ==="
