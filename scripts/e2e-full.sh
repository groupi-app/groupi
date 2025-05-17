#!/bin/bash

# Start the database
npm run dev:db

# Wait for PostgreSQL to be ready on port 6500
until nc -z localhost 6500; do
  echo "Waiting for PostgreSQL on localhost:6500..."
  sleep 1
done
echo "PostgreSQL is ready on localhost:6500"

# Start the Next.js development server
npm run dev:next &
NEXT_PID=$!
npx wait-on http://localhost:3000

# Run Cypress tests
CYPRESS_DATABASE_URL="$DATABASE_URL" npx cypress run --e2e

# Cleanup
docker compose down
npm run next:stop

# Kill the background Next.js process if it's still running
if [ -n "$NEXT_PID" ]; then
  kill "$NEXT_PID" 2> /dev/null
fi

exit $? # Exit with the status of the Cypress command