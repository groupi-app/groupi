# CLI and automation first success

cli-0.1.0 · Current · Source: packages/cli/README.md

Source availability does not establish hosted deployment or registry publication.

## Use the verified source artifact
Canonical passage: /cli/0.1.0/guide#installation

CLI 0.1.0 is available in this repository. Use Node 22 or 24 and the locked workspace installation. No registry publication is established by these docs; do not assume an npm beta is available. The local executable supplies the exact command catalog.

```sh
pnpm install --frozen-lockfile
node packages/cli/bin/groupi.js --version
node packages/cli/bin/groupi.js --help
```

## Choose an instance, profile and identity
Canonical passage: /cli/0.1.0/guide#credentials

Choose both the REST v2 URL and authorization website from the same intended instance. After explicit browser login, verify the account before every sensitive workflow. Temporary environment keys must match GROUPI_API_KEY_PROFILE; --api-key-stdin reads a temporary key without saving it. Stored credentials use the OS keychain when available. Browser CLI authorization is distinct from delegated third-party sign-in.

```sh
groupi profile add development --api-url https://YOUR-INSTANCE.convex.site/api/v2 --web-url https://YOUR-APP
groupi --profile development auth login
groupi --profile development auth status --format json
```

## Read and create using structured output
Canonical passage: /cli/0.1.0/guide#automation

Use --format json and a trusted installed executable (or node packages/cli/bin/groupi.js from source). Exit codes: 0 success; 1 unexpected failure; 2 usage/validation/conflict/cancelled confirmation; 3 authentication/permission; 4 resource or endpoint missing; 5 network/rate-limit/unsupported-server/uncertain outcome. Inspect errors and the process exit status; JSON output does not make a failed process successful. Verify distinct organizer/attendee profiles using auth status. Retain a generated request identifier before creating; use the same identifier and unchanged arguments for an uncertain protected create.

```sh
groupi --profile development events list --limit 20 --format json
REQUEST_ID=$(node -e 'console.log(Date.now()+"."+require("node:crypto").randomUUID())')
groupi --profile development events create --title "Developer dinner" --request-id "$REQUEST_ID" --format json
```

## Continue pages and recover failures
Canonical passage: /cli/0.1.0/guide#pagination

List commands support --limit and --cursor; --all explicitly retrieves all pages. Continue until nextCursor is null, including empty pages. A malformed continuation fails; preserve the reported error rather than treating incomplete data as a complete list. Writes are not automatically retried. After an uncertain unprotected write, inspect current server state before resubmission. auth logout --revoke revokes the selected stored credential; temporary keys are independent.

```sh
groupi --profile development events list --all --format json
groupi --profile development auth logout --revoke
```
