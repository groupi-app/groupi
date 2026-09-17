#!/bin/zsh
# Provision reviewer access only after the server change has reached production.
# Never deploys code, enables E2E, saves plaintext keys, or submits a store review.
set -euo pipefail
readonly REVIEW_REPO="/Users/theia/repos/groupi"
readonly REVIEW_DEPLOYMENT="trustworthy-warthog-524"
readonly REVIEW_CONVEX="${REVIEW_REPO}/node_modules/.bin/convex"
export CONVEX_DEPLOYMENT="prod:${REVIEW_DEPLOYMENT}"
cd "${REVIEW_REPO}"

echo 'Groupi passwordless reviewer access'
echo 'Creates one new synthetic demo account on the production backend.'
echo 'Generate and save a random 64-character lowercase hexadecimal key in'
echo 'your password manager, then paste it below. Input is hidden.'
read -rs 'review_inbox_key?Inbox access key: '
echo
if [[ ! "${review_inbox_key}" =~ ^[a-f0-9]{64}$ ]]; then
  unset review_inbox_key
  echo 'The key must be exactly 64 lowercase hexadecimal characters.' >&2
  exit 1
fi
review_hash="$(printf '%s' "${review_inbox_key}" | node -e '
  const crypto = require("node:crypto"); let value = "";
  process.stdin.on("data", chunk => value += chunk);
  process.stdin.on("end", () => process.stdout.write(crypto.createHash("sha256").update(value).digest("hex")));
')"
unset review_inbox_key
review_email="app-review-$(node -e 'process.stdout.write(require("node:crypto").randomBytes(8).toString("hex"))')@groupi.gg"
review_expiry="$(node -e 'process.stdout.write(String(Date.now() + 60 * 24 * 60 * 60 * 1000))')"
review_args="$(node -e 'process.stdout.write(JSON.stringify({email:process.argv[1],accessKeyHash:process.argv[2],expiresAt:Number(process.argv[3])}))' "${review_email}" "${review_hash}" "${review_expiry}")"

# Do not replace an active inbox, which may still be used by an Apple reviewer.
review_existing="$(${REVIEW_CONVEX} env get APP_REVIEW_INBOX_ENABLED --deployment "${REVIEW_DEPLOYMENT}" 2>/dev/null || true)"
if [[ "${review_existing}" == 'true' ]]; then
  echo 'An inbox is already enabled. Revoke the previous account before replacing it.' >&2
  exit 1
fi
review_result="$(${REVIEW_CONVEX} run appReview/mutations:provision "${review_args}" --deployment "${REVIEW_DEPLOYMENT}" --codegen disable)"
review_user_id="$(printf '%s' "${review_result}" | node -e 'let input="";process.stdin.on("data",c=>input+=c);process.stdin.on("end",()=>process.stdout.write(JSON.parse(input).userId));')"
${REVIEW_CONVEX} env set APP_REVIEW_USER_ID "${review_user_id}" --deployment "${REVIEW_DEPLOYMENT}"
${REVIEW_CONVEX} env set APP_REVIEW_INBOX_ENABLED true --deployment "${REVIEW_DEPLOYMENT}"
echo
echo "Demo account: ${review_email}"
echo 'Private inbox: https://trustworthy-warthog-524.convex.site/app-review/inbox'
echo 'Use your saved key only in the inbox and private store-review credentials.'
echo 'Access expires in 60 days. Verify login before submitting to Apple.'
echo "Account provisioning result: ${review_result}"
