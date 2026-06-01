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

# Validate git commit message format (conventional commits, lowercase subject)
if echo "$CMD" | grep -qE '\bgit\s+commit\b'; then
  MSG=""

  # Try to extract the first line of the commit message.
  # For HEREDOC commits, look for the conventional commit pattern directly.
  # For -m "msg" commits, extract the quoted string.
  if echo "$CMD" | grep -qE 'cat <<'; then
    MSG=$(echo "$CMD" | grep -oE '(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z,]+\))?!?:[[:space:]]+.*' | head -1)
  elif echo "$CMD" | grep -qE -- '-m '; then
    # Use bash parameter expansion to extract message after -m "
    MSG="${CMD#*-m }"
    # Strip leading quote
    MSG="${MSG#\"}"
    MSG="${MSG#\'}"
    # Strip trailing quote and anything after (newlines, etc.)
    MSG=$(echo "$MSG" | head -1)
    MSG="${MSG%\"*}"
    MSG="${MSG%\'*}"
  fi

  if [ -n "$MSG" ]; then
    # Check type prefix
    if ! echo "$MSG" | grep -qE '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z,]+\))?!?:'; then
      echo "BLOCKED: Commit message must start with a conventional type." >&2
      echo "Valid types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert" >&2
      echo "Format: type(scope): lowercase description" >&2
      echo "Scopes: web, mobile, shared, convex, deps, release" >&2
      echo "Your message: $MSG" >&2
      exit 2
    fi

    # Extract subject (part after "type(scope): ")
    SUBJECT=$(echo "$MSG" | sed -E 's/^[a-z]+(\([^)]*\))?!?:[[:space:]]*//')
    FIRST_CHAR=$(printf '%s' "$SUBJECT" | cut -c1)
    if printf '%s' "$FIRST_CHAR" | grep -qE '^[A-Z]'; then
      LOWER=$(printf '%s' "$FIRST_CHAR" | tr '[:upper:]' '[:lower:]')
      echo "BLOCKED: Commit subject must be lowercase." >&2
      echo "Change: \"$SUBJECT\"" >&2
      echo "To:     \"${LOWER}${SUBJECT#?}\"" >&2
      exit 2
    fi

    # Check max length (first line only)
    FIRST_LINE=$(echo "$MSG" | head -1)
    HEADER_LEN=${#FIRST_LINE}
    if [ "$HEADER_LEN" -gt 100 ]; then
      echo "BLOCKED: Commit header exceeds 100 characters ($HEADER_LEN chars)." >&2
      echo "Shorten the subject line." >&2
      exit 2
    fi
  fi
fi

exit 0
