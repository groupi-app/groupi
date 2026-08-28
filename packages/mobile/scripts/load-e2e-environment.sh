#!/usr/bin/env bash

# This file is sourced by E2E build/test runners. Do not execute it directly.
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  echo 'load-e2e-environment.sh must be sourced by an E2E runner.' >&2
  exit 1
fi

E2E_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_MOBILE_ROOT="$(cd "${E2E_SCRIPT_DIR}/.." && pwd)"
E2E_ENV_FILE="${MOBILE_E2E_ENV_FILE:-${E2E_MOBILE_ROOT}/.env.e2e.local}"

if [[ ! -f "${E2E_ENV_FILE}" ]]; then
  echo "Missing authenticated E2E environment file: ${E2E_ENV_FILE}" >&2
  echo "Copy ${E2E_MOBILE_ROOT}/.env.e2e.example to .env.e2e.local and use isolated preview services." >&2
  return 1
fi

set -a
# shellcheck disable=SC1090
source "${E2E_ENV_FILE}"
set +a

if [[ ! "${E2E_CONVEX_URL:-}" =~ ^https://[a-z0-9-]+\.convex\.cloud/?$ ]]; then
  echo 'E2E_CONVEX_URL must be an HTTPS Convex cloud deployment URL.' >&2
  return 1
fi
E2E_CONVEX_URL="${E2E_CONVEX_URL%/}"

if [[ ! "${E2E_BETTER_AUTH_URL:-}" =~ ^https://[^/]+/?$ ]]; then
  echo 'E2E_BETTER_AUTH_URL must be an HTTPS preview origin without a path.' >&2
  return 1
fi
E2E_BETTER_AUTH_URL="${E2E_BETTER_AUTH_URL%/}"

E2E_FIXTURE_KEY="${E2E_FIXTURE_KEY:-}"
if [[ "${#E2E_FIXTURE_KEY}" -lt 32 ]]; then
  echo 'E2E_FIXTURE_KEY must contain at least 32 characters.' >&2
  return 1
fi

production_env_file="${E2E_MOBILE_ROOT}/.env.local"
if [[ -f "${production_env_file}" ]]; then
  production_convex_url="$(sed -n 's/^EXPO_PUBLIC_CONVEX_URL=//p' "${production_env_file}" | tail -n 1 | tr -d "'\"")"
  production_auth_url="$(sed -n 's/^EXPO_PUBLIC_BETTER_AUTH_URL=//p' "${production_env_file}" | tail -n 1 | tr -d "'\"")"

  if [[ -n "${production_convex_url}" && "${E2E_CONVEX_URL}" == "${production_convex_url%/}" ]]; then
    echo 'Refusing to run authenticated E2E against the normal mobile Convex deployment.' >&2
    return 1
  fi
  if [[ -n "${production_auth_url}" && "${E2E_BETTER_AUTH_URL}" == "${production_auth_url%/}" ]]; then
    echo 'Refusing to run authenticated E2E against the normal mobile auth deployment.' >&2
    return 1
  fi
fi

export E2E_CONVEX_URL E2E_BETTER_AUTH_URL E2E_FIXTURE_KEY
export EXPO_PUBLIC_CONVEX_URL="${E2E_CONVEX_URL}"
export EXPO_PUBLIC_BETTER_AUTH_URL="${E2E_BETTER_AUTH_URL}"
export EXPO_PUBLIC_E2E_TESTING=true
export MAESTRO_E2E_CONVEX_URL="${E2E_CONVEX_URL}"
export MAESTRO_E2E_FIXTURE_KEY="${E2E_FIXTURE_KEY}"
