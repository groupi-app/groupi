#!/usr/bin/env bash
# Blocks prohibited commands per .claude/rules/scripts.md
# Exit 2 = reject the tool call, Exit 0 = allow

CMD="$INPUT"

# Block dev servers, builds, deploys, and non-pnpm package managers
if echo "$CMD" | grep -qE '\bpnpm\s+(dev|dev:web|dev:convex|dev:shared|dev:mobile|dev:all|build|build:web|build:convex|build:shared|build:mobile|start|preview|convex:dev|convex:deploy)\b'; then
  echo "BLOCKED: This command is prohibited by project rules." >&2
  echo "" >&2
  echo "Prohibited: dev servers, builds, deploys (see .claude/rules/scripts.md)" >&2
  echo "Use instead:" >&2
  echo "  pnpm check       - Validate code (lint + types + format)" >&2
  echo "  pnpm test:run    - Run all tests" >&2
  echo "  pnpm generate    - Regenerate Convex types" >&2
  echo "  pnpm lint:fix    - Auto-fix linting issues" >&2
  exit 2
fi

# Block non-pnpm package managers
if echo "$CMD" | grep -qE '\b(npm\s+(install|i|run|exec|ci|start|build|test)|yarn\s|npx\s+create-)'; then
  echo "BLOCKED: Use pnpm, not npm/yarn/npx." >&2
  echo "This project uses pnpm as its package manager." >&2
  exit 2
fi

# Block raw next CLI
if echo "$CMD" | grep -qE '\bnext\s+(dev|build|start)\b'; then
  echo "BLOCKED: Do not run next CLI directly." >&2
  echo "Use pnpm scripts instead. Dev server is assumed to be running." >&2
  exit 2
fi

exit 0
