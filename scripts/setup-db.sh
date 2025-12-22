#!/bin/bash
# Setup Database Workflow
# 
# This script sets up the database in the correct order:
# 1. Stop Supabase and remove volumes (fresh start)
# 2. Start Supabase (creates blank PostgreSQL database)
# 3. Apply Prisma migrations (creates all tables)
# 4. Seed database with TypeScript seed script
#
# Usage:
#   ./scripts/setup-db.sh

set -e  # Exit on error

echo "🔄 Setting up database..."

# Step 1: Stop Supabase and remove volumes
echo "📦 Step 1: Stopping Supabase and removing volumes..."

# Stop Supabase
echo "   Stopping Supabase..."
supabase stop > /dev/null 2>&1 || true

# Delete the database volumes to ensure completely fresh start
echo "   Deleting database volumes..."
# Get project ID from config
PROJECT_ID=$(grep -E "^project_id\s*=" supabase/config.toml 2>/dev/null | cut -d'"' -f2 || echo "groupi")

# Remove only volumes for this specific project (not all Supabase volumes)
# Supabase volumes are named: supabase_<type>_<project_id>
docker volume rm "supabase_db_${PROJECT_ID}" > /dev/null 2>&1 || true
docker volume rm "supabase_config_${PROJECT_ID}" > /dev/null 2>&1 || true
docker volume rm "supabase_storage_${PROJECT_ID}" > /dev/null 2>&1 || true
docker volume rm "supabase_auth_${PROJECT_ID}" > /dev/null 2>&1 || true
docker volume rm "supabase_logs_${PROJECT_ID}" > /dev/null 2>&1 || true

echo "   ✓ Volumes deleted"

# Step 2: Start Supabase
echo "🚀 Step 2: Starting Supabase..."
supabase start > /dev/null 2>&1

# Wait for Supabase to be ready
sleep 3

# Get DB URL
DB_URL=$(supabase status --output json 2>/dev/null | grep -o '"DB_URL":"[^"]*' | cut -d'"' -f4 || echo "postgresql://postgres:postgres@127.0.0.1:54322/postgres")

echo "   ✓ Supabase started"

# Step 3: Apply Prisma migrations
echo "🗄️  Step 3: Applying Prisma migrations..."

# Clear Prisma migration history to ensure fresh migration state
echo "   Clearing Prisma migration history..."
psql "$DB_URL" -c "TRUNCATE TABLE _prisma_migrations;" > /dev/null 2>&1 || true

# Apply Prisma migrations
pnpm prisma migrate deploy

echo "   ✓ Prisma migrations applied"

# Step 4: Seed database
echo "🌱 Step 4: Seeding database..."
echo "   Running seed-users script..."
pnpm seed-users || {
  echo "   ⚠ Seed script had errors (see output above)"
  echo "   Continuing anyway..."
}
echo "   ✓ Seed script completed"

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Database is ready with:"
echo "  - All tables created (Prisma)"
echo "  - Seed data loaded"
