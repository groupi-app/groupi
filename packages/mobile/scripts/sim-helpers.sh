#!/bin/bash
# Simulator helper scripts for testing the Groupi mobile app
# Usage: source packages/mobile/scripts/sim-helpers.sh

BUNDLE_ID="com.groupi.mobile"
DEVICE_ID=$(xcrun simctl list devices booted -j | python3 -c "import sys,json; devs=[d for r in json.load(sys.stdin)['devices'].values() for d in r if d['state']=='Booted']; print(devs[0]['udid'] if devs else '')" 2>/dev/null)

# ---- App Lifecycle ----

sim_restart() {
  xcrun simctl terminate booted "$BUNDLE_ID" 2>/dev/null
  sleep 0.5
  xcrun simctl launch booted "$BUNDLE_ID"
  sleep 3
  echo "App restarted"
}

sim_kill() {
  xcrun simctl terminate booted "$BUNDLE_ID" 2>/dev/null
  echo "App killed"
}

# ---- Navigation ----

sim_tap() {
  # Usage: sim_tap 200 400
  xcrun simctl io booted tap "$1" "$2" 2>/dev/null || \
  python3 -c "
import subprocess, json
subprocess.run(['xcrun', 'simctl', 'io', 'booted', 'tap', '$1', '$2'])
" 2>/dev/null
  echo "Tapped ($1, $2)"
}

sim_type() {
  # Usage: sim_type "hello world"
  xcrun simctl io booted type "$1" 2>/dev/null
  echo "Typed: $1"
}

sim_paste() {
  # Usage: sim_paste "text to paste"
  printf "%s" "$1" | xcrun simctl pbcopy booted
  echo "Copied to pasteboard: $1"
}

sim_swipe_up() {
  # Swipe up to scroll down
  xcrun simctl io booted swipe 200 600 200 200 2>/dev/null
  echo "Swiped up"
}

sim_swipe_down() {
  # Swipe down to scroll up / pull to refresh
  xcrun simctl io booted swipe 200 200 200 600 2>/dev/null
  echo "Swiped down"
}

# ---- Screenshots ----

sim_shot() {
  # Usage: sim_shot [filename]
  local name="${1:-screenshot-$(date +%s)}"
  xcrun simctl io booted screenshot "/tmp/${name}.png" 2>/dev/null
  echo "Screenshot saved: /tmp/${name}.png"
}

# ---- Auth ----

sim_login() {
  # Create a test user and sign in via the Better Auth API
  # Usage: sim_login [email] [name] [username]
  local email="${1:-simtest@example.com}"
  local name="${2:-Sim Tester}"
  local username="${3:-simtester}"
  local base_url="http://localhost:3000"

  echo "Creating test session..."

  # Try sign-up first, fall back to sign-in
  local response
  response=$(curl -s -X POST "${base_url}/api/auth/sign-up/email" \
    -H "Content-Type: application/json" \
    -H "Origin: ${base_url}" \
    -c /tmp/groupi-sim-cookies.txt \
    -d "{\"email\":\"${email}\",\"password\":\"SimTest1234!\",\"name\":\"${name}\"}" 2>&1)

  if echo "$response" | grep -q "USER_ALREADY_EXISTS"; then
    response=$(curl -s -X POST "${base_url}/api/auth/sign-in/email" \
      -H "Content-Type: application/json" \
      -H "Origin: ${base_url}" \
      -c /tmp/groupi-sim-cookies.txt \
      -d "{\"email\":\"${email}\",\"password\":\"SimTest1234!\"}" 2>&1)
  fi

  local token
  token=$(echo "$response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

  if [ -n "$token" ]; then
    echo "Logged in as ${email} (token: ${token:0:12}...)"
    echo "Restart the app to pick up the session: sim_restart"
  else
    echo "Login failed: $response"
  fi
}

# ---- Deep Links ----

sim_open_url() {
  # Usage: sim_open_url "groupi://event/abc123"
  xcrun simctl openurl booted "$1"
  echo "Opened URL: $1"
}

sim_goto_event() {
  # Usage: sim_goto_event <eventId>
  xcrun simctl openurl booted "groupi://event/$1"
  echo "Navigating to event: $1"
}

# ---- Accessibility ----

sim_describe() {
  # Describe all accessibility elements on screen
  # Requires idb
  idb ui describe-all --udid "$DEVICE_ID" 2>/dev/null || echo "idb not available - use MCP ui_describe_all instead"
}

sim_find_text() {
  # Find an element by text and return its coordinates
  # Usage: sim_find_text "Sign In"
  idb ui describe-all --udid "$DEVICE_ID" 2>/dev/null | grep -i "$1" || echo "idb not available"
}

echo "Simulator helpers loaded. Available commands:"
echo "  sim_restart    - Kill and relaunch the app"
echo "  sim_kill       - Kill the app"
echo "  sim_tap X Y    - Tap at coordinates"
echo "  sim_paste TXT  - Copy text to simulator pasteboard"
echo "  sim_swipe_up   - Scroll down"
echo "  sim_swipe_down - Scroll up / pull to refresh"
echo "  sim_shot [name]- Take a screenshot to /tmp/"
echo "  sim_login      - Create test user and sign in"
echo "  sim_open_url   - Open a deep link URL"
echo "  sim_goto_event - Navigate to an event by ID"
echo "  sim_describe   - Describe screen elements (needs idb)"
