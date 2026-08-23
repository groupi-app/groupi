#!/bin/bash
# Simulator helper scripts for testing the Groupi mobile app
# Usage: source packages/mobile/scripts/sim-helpers.sh

BUNDLE_ID="com.groupi.mobile"

sim_device_id() {
  xcrun simctl list devices booted -j | python3 -c "import sys,json; devs=[d for r in json.load(sys.stdin)['devices'].values() for d in r if d['state']=='Booted']; print(devs[0]['udid'] if devs else '')" 2>/dev/null
}

sim_require_booted() {
  if [ -z "$(sim_device_id)" ]; then
    echo "No iOS Simulator is booted. Open Simulator and boot Groupi iOS Test."
    return 1
  fi
}

# ---- App Lifecycle ----

sim_restart() {
  sim_require_booted || return 1
  xcrun simctl terminate booted "$BUNDLE_ID" 2>/dev/null
  sleep 0.5
  xcrun simctl launch booted "$BUNDLE_ID"
  sleep 3
  echo "App restarted"
}

sim_kill() {
  sim_require_booted || return 1
  xcrun simctl terminate booted "$BUNDLE_ID" 2>/dev/null
  echo "App killed"
}

sim_paste() {
  # Usage: sim_paste "text to paste"
  sim_require_booted || return 1
  printf "%s" "$1" | xcrun simctl pbcopy booted
  echo "Copied text to the simulator pasteboard"
}

# ---- Screenshots ----

sim_shot() {
  # Usage: sim_shot [filename]
  sim_require_booted || return 1
  local name="${1:-screenshot-$(date +%s)}"
  xcrun simctl io booted screenshot "/tmp/${name}.png" 2>/dev/null
  echo "Screenshot saved: /tmp/${name}.png"
}

# ---- Deep Links ----

sim_open_url() {
  # Usage: sim_open_url "groupi://event/abc123"
  sim_require_booted || return 1
  xcrun simctl openurl booted "$1"
  echo "Opened URL: $1"
}

sim_goto_event() {
  # Usage: sim_goto_event <eventId>
  sim_require_booted || return 1
  xcrun simctl openurl booted "groupi://event/$1"
  echo "Navigating to event: $1"
}

# ---- Notifications ----

sim_push() {
  # Inject an APNs-shaped payload without contacting Expo/APNs.
  # Usage: sim_push [title] [body]
  sim_require_booted || return 1
  local title="${1:-Groupi test notification}"
  local body="${2:-Tap to open notifications}"
  local payload
  payload=$(mktemp /tmp/groupi-sim-push.XXXXXX.json)

  python3 - "$payload" "$title" "$body" <<'PY'
import json
import sys

path, title, body = sys.argv[1:]
with open(path, "w", encoding="utf-8") as output:
    json.dump(
        {
            "aps": {
                "alert": {"title": title, "body": body},
                "sound": "default",
            },
            "destination": "notifications",
        },
        output,
    )
PY

  if ! xcrun simctl push booted "$BUNDLE_ID" "$payload"; then
    rm -f "$payload"
    return 1
  fi
  rm -f "$payload"
  echo "Injected test notification"
}

# ---- Accessibility ----

sim_describe() {
  # Describe all accessibility elements on screen
  # Requires idb
  sim_require_booted || return 1
  local device_id
  device_id=$(sim_device_id)
  idb ui describe-all --udid "$device_id" 2>/dev/null || echo "idb is not installed"
}

sim_find_text() {
  # Find an element by text and return its coordinates
  # Usage: sim_find_text "Sign In"
  sim_require_booted || return 1
  local device_id
  device_id=$(sim_device_id)
  idb ui describe-all --udid "$device_id" 2>/dev/null | grep -i "$1" || echo "idb is not installed"
}

echo "Simulator helpers loaded. Available commands:"
echo "  sim_restart    - Kill and relaunch the app"
echo "  sim_kill       - Kill the app"
echo "  sim_paste TXT  - Copy text to simulator pasteboard"
echo "  sim_shot [name]- Take a screenshot to /tmp/"
echo "  sim_open_url   - Open a deep link URL"
echo "  sim_goto_event - Navigate to an event by ID"
echo "  sim_push       - Inject a test notification payload"
echo "  sim_describe   - Describe screen elements (needs idb)"
