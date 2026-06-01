#!/usr/bin/env bash
# Advisory reminder about changesets when session stops.
# Always exits 0 (never blocks).

cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0

CHANGES=$(git diff --name-only 2>/dev/null | grep -E '^(packages/|convex/)' | grep -vE '\.test\.(ts|tsx)$' | grep -v '__tests__/' | head -1)

if [ -z "$CHANGES" ]; then
  exit 0
fi

EXISTING_CS=$(find .changeset -name "*.md" ! -name "README.md" -newer "$(git rev-parse --git-dir)/HEAD" 2>/dev/null | head -1)

if [ -z "$EXISTING_CS" ]; then
  echo ""
  echo "Source files were modified but no changeset exists."
  echo "If these are user-facing changes, run: pnpm changeset"
  echo ""
fi

exit 0
