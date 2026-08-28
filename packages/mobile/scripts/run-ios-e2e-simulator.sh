#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Loads only ignored, preview-only values and refuses the normal mobile URLs.
# shellcheck disable=SC1091
source "${SCRIPT_DIR}/load-e2e-environment.sh"

exec bash "${SCRIPT_DIR}/run-ios-simulator.sh" "$@"
