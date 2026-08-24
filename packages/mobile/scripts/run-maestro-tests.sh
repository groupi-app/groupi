#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

FLOW_TARGET="${MOBILE_ROOT}/.maestro"
FLOW_TAG='smoke'
if [[ "${1:-}" == '--authenticated' ]]; then
  shift
  # shellcheck disable=SC1091
  source "${SCRIPT_DIR}/load-e2e-environment.sh"
  FLOW_TARGET="${MOBILE_ROOT}/.maestro/authenticated-event.yml"
  FLOW_TAG='authenticated'
fi

if ! java -version >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    HOMEBREW_OPENJDK_PREFIX="$(brew --prefix openjdk 2>/dev/null || true)"
    if [[ -x "${HOMEBREW_OPENJDK_PREFIX}/libexec/openjdk.jdk/Contents/Home/bin/java" ]]; then
      export JAVA_HOME="${HOMEBREW_OPENJDK_PREFIX}/libexec/openjdk.jdk/Contents/Home"
      export PATH="${JAVA_HOME}/bin:${PATH}"
    fi
  fi
fi

if ! java -version >/dev/null 2>&1; then
  echo 'Maestro requires Java 17 or newer.' >&2
  exit 1
fi

if ! command -v maestro >/dev/null 2>&1; then
  echo 'Maestro CLI is not installed.' >&2
  echo 'Install it with: brew tap mobile-dev-inc/tap && brew install mobile-dev-inc/tap/maestro' >&2
  exit 1
fi

export MAESTRO_CLI_NO_ANALYTICS="${MAESTRO_CLI_NO_ANALYTICS:-1}"
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED="${MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED:-true}"

exec maestro test "${FLOW_TARGET}" --include-tags "${FLOW_TAG}" "$@"
