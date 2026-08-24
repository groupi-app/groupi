#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPOSITORY_ROOT="$(cd "${MOBILE_ROOT}/../.." && pwd)"

SIMULATOR_NAME="${IOS_TEST_SIMULATOR:-Groupi iOS Test}"
SIMULATOR_ID="${IOS_TEST_SIMULATOR_ID:-}"
DERIVED_DATA="${IOS_TEST_DERIVED_DATA:-/tmp/groupi-ios-derived-data}"
APP_PATH="${DERIVED_DATA}/Build/Products/Release-iphonesimulator/Groupi.app"
RUN_LOG="${IOS_TEST_LOG:-/tmp/groupi-ios-app-launch.log}"

if [[ -z "${SIMULATOR_ID}" ]]; then
  SIMULATOR_ID="$({
    xcrun simctl list devices available | awk -v name="${SIMULATOR_NAME}" '
      {
        line = $0
        sub(/^[[:space:]]*/, "", line)
        prefix = name " ("
        if (index(line, prefix) == 1) {
          rest = substr(line, length(prefix) + 1)
          split(rest, parts, ")")
          print parts[1]
          exit
        }
      }
    '
  })"
fi

if [[ -z "${SIMULATOR_ID}" ]]; then
  echo "Could not find an available iOS simulator named '${SIMULATOR_NAME}'." >&2
  echo "Set IOS_TEST_SIMULATOR or IOS_TEST_SIMULATOR_ID to select another simulator." >&2
  exit 1
fi

bash "${SCRIPT_DIR}/check-ios-environment.sh"

if ! xcrun simctl list devices | grep -F "${SIMULATOR_ID}" | grep -q '(Booted)'; then
  xcrun simctl boot "${SIMULATOR_ID}"
fi
xcrun simctl bootstatus "${SIMULATOR_ID}" -b
open -a Simulator

cd "${REPOSITORY_ROOT}"

echo "Building Groupi for '${SIMULATOR_NAME}' (${SIMULATOR_ID})..."
echo "Build output: ${RUN_LOG}"

xcodebuild \
  -workspace packages/mobile/ios/Groupi.xcworkspace \
  -scheme Groupi \
  -configuration Release \
  -sdk iphonesimulator \
  -destination "id=${SIMULATOR_ID}" \
  -derivedDataPath "${DERIVED_DATA}" \
  CODE_SIGN_IDENTITY=- \
  ONLY_ACTIVE_ARCH=YES \
  ARCHS=arm64 \
  build 2>&1 | tee "${RUN_LOG}"

xcrun simctl install "${SIMULATOR_ID}" "${APP_PATH}"
xcrun simctl launch --terminate-running-process "${SIMULATOR_ID}" com.groupi.mobile

echo "Groupi is running in '${SIMULATOR_NAME}'."
