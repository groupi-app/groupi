#!/bin/bash

# Fix all Pino 10 logger calls in the web app
# Old format: logger.error('message', { data })
# New format: logger.error({ data }, 'message')

cd /Users/tsurette/repos/personal/groupi/apps/web

# Find all TypeScript/TSX files and fix logger calls
find . -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "*/node_modules/*" -exec perl -i -pe '
  # Match logger.METHOD(STRING, OBJECT)
  s/(\w+Logger)\.(error|info|warn|debug)\((['\''"])(.+?)\3,\s*(\{[^}]+\})\)/$1.$2($5, $3$4$3)/g;
' {} \;

echo "Fixed all Pino logger calls"

