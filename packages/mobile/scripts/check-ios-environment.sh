#!/bin/bash
set -uo pipefail

failures=0
warnings=0
script_dir=$(CDPATH='' cd -- "$(dirname -- "$0")" && pwd)
mobile_dir=$(dirname "$script_dir")

pass() {
  echo "✓ $1"
}

fail() {
  echo "✗ $1"
  failures=$((failures + 1))
}

warn() {
  echo "! $1"
  warnings=$((warnings + 1))
}

if [ "$(uname -s)" = "Darwin" ]; then
  pass "macOS host"
else
  fail "iOS Simulator testing requires macOS"
fi

developer_dir=$(xcode-select -p 2>/dev/null || true)
if [[ "$developer_dir" == *"Xcode.app/Contents/Developer" ]]; then
  pass "Full Xcode toolchain selected: $developer_dir"
else
  fail "Full Xcode is not selected (current: ${developer_dir:-none})"
fi

if command -v xcodebuild >/dev/null 2>&1 && xcodebuild -version >/dev/null 2>&1; then
  xcode_version=$(xcodebuild -version | head -n 1 | awk '{ print $2 }')
  if /usr/bin/python3 - "$xcode_version" <<'PY'
import sys

def version(value: str) -> tuple[int, ...]:
    return tuple(int(part) for part in value.split(".") if part.isdigit())

raise SystemExit(0 if version(sys.argv[1]) >= (26, 2) else 1)
PY
  then
    pass "Xcode $xcode_version satisfies Expo SDK 55 (26.2+)"
  else
    fail "Xcode 26.2+ is required; found ${xcode_version:-unknown}"
  fi
else
  fail "xcodebuild is unavailable"
fi

if xcrun simctl list runtimes available 2>/dev/null | grep -q '^iOS '; then
  runtime=$(xcrun simctl list runtimes available | awk '/^iOS / { print; exit }')
  pass "Available iOS Simulator runtime: $runtime"
else
  fail "No available iOS Simulator runtime"
fi

if xcrun simctl list devices booted 2>/dev/null | grep -q '(Booted)'; then
  device=$(xcrun simctl list devices booted | awk '/\(Booted\)/ { print $0; exit }' | xargs)
  pass "Booted simulator: $device"
else
  warn "No simulator is booted"
fi

if command -v pod >/dev/null 2>&1; then
  pass "CocoaPods $(pod --version)"
else
  fail "CocoaPods is not installed"
fi

if command -v watchman >/dev/null 2>&1; then
  pass "Watchman $(watchman --version)"
else
  fail "Watchman is not installed (recommended for Expo SDK 55)"
fi

env_file="$mobile_dir/.env.local"
if [ -f "$env_file" ]; then
  pass "Mobile environment file exists"
  for variable in EXPO_PUBLIC_CONVEX_URL EXPO_PUBLIC_BETTER_AUTH_URL EAS_PROJECT_ID; do
    value=$(sed -n "s/^${variable}=//p" "$env_file" | tail -n 1)
    if [ -n "$value" ] && [[ "$value" != *"your-"* ]]; then
      pass "$variable is configured"
    else
      fail "$variable is missing from packages/mobile/.env.local"
    fi
  done

  eas_project_id=$(sed -n 's/^EAS_PROJECT_ID=//p' "$env_file" | tail -n 1)
  if [[ "$eas_project_id" =~ ^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$ ]]; then
    pass "EAS_PROJECT_ID is a valid UUID"
  else
    fail "EAS_PROJECT_ID must be the Expo project UUID"
  fi
else
  fail "packages/mobile/.env.local is missing; copy .env.example and fill it in"
fi

echo
echo "iOS environment check: ${failures} failure(s), ${warnings} warning(s)"
exit "$failures"
