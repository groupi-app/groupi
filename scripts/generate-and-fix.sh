#!/bin/bash
# Helper script to generate Prisma schemas and fix z.cuid() issue
# Run this instead of 'pnpm generate'

set -e

echo "🔄 Generating Prisma schemas..."
pnpm prisma generate

echo "🔧 Fixing z.cuid() compatibility issue..."
sed -i '' 's/z\.cuid()/z.string()/g' packages/schema/src/generated/index.ts

echo "✅ Prisma schemas generated and fixed!"

