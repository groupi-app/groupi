# Groupi CLI

Development milestones [#222](https://github.com/groupi-app/groupi/issues/222) and
[#223](https://github.com/groupi-app/groupi/issues/223). The package can be packed
and installed locally; public registry publication belongs to #228. Supports Node 22 and 24 on macOS, Windows, and Linux.
Runtime files are plain JavaScript checked by TypeScript, so installation needs no
compiler, React, Expo, or Next.js runtime.

## Authentication

```sh
groupi auth login
groupi auth status --format json
groupi auth logout
groupi auth logout --revoke
```

Login is explicit and requires an interactive terminal. The browser shows the
account being authorized and returns a short-lived, single-use authorization
code bound to that CLI session using PKCE. Success appears only after the CLI
exchanges the code and saves the credential. Keys never enter browser URLs.
`--no-browser` displays the URL for manual opening; `--timeout` accepts 10–300
seconds (default 300). Cancellation or failure closes the loopback listener.

Saved keys use macOS Keychain, Windows Credential Manager, or Linux Secret Service.
Linux needs an unlocked Secret Service on the session bus. There is no plaintext
fallback; unavailable stores give temporary environment/stdin key instructions.
Keys are isolated by profile name and canonical API endpoint. A fresh login
replaces only that profile's saved key; previous server keys remain valid until
revoked in browser API-key settings. CLI keys expire after 90 days and permit
120 requests per minute. Expiry requires another explicit login.

`auth status` verifies the active key with the selected server and returns
`{profile, apiUrl, source, account: {id, name, email}, expiresAt?}`. It never shows
the key. `auth logout` deletes only the selected saved credential and does not
revoke the server key. `--revoke` revokes that saved key first; a failed revocation
keeps the local record so you can retry or revoke through browser settings.
Environment/stdin credentials are unaffected by logout. JSON/headless login
fails with `BROWSER_INTERACTION_REQUIRED` instead of opening a browser or waiting.

Credential precedence is explicit stdin, then the profile-scoped environment key,
then the OS store. A mismatched environment key fails rather than falling back.
Login storage failures attempt server revocation; `AUTH_CLEANUP_REQUIRED` means
cleanup could not be confirmed and you should inspect browser API-key settings.
Network-interrupted exchanges are never retried automatically; inspect browser
API-key settings for a possibly issued key before restarting login.

## Read events

Supply an existing API key through `GROUPI_API_KEY` in your environment, then run:

```sh
groupi events list
groupi events list --format json --limit 20
groupi events list --format json --cursor '<opaque cursor>'
groupi events list --format json --all
groupi events get <event-id> --format json
```

Alternatively pipe exactly one key from a secure credential source to
`groupi --api-key-stdin events list`. The flag explicitly takes precedence over
environment credentials, consumes stdin through EOF, and never saves the key.
Do not use this input channel simultaneously for content. Keys never belong in
command-line arguments or profile files. Expired/invalid keys require explicitly
obtaining a new key; ordinary commands never open a browser.

The reserved `default` profile uses hosted Groupi at
`https://trustworthy-warthog-524.convex.site/api/v2`.
For another installation, create and explicitly select a named profile:

```sh
groupi profile add staging --api-url https://your-installation.example/api/v2 --web-url https://app.example.com
groupi --profile staging --api-key-stdin events list --format json
```

Environment-key use on that profile additionally requires
`GROUPI_API_KEY_PROFILE=staging`. An unscoped environment key is bound to `default`;
selecting another server never silently reuses it. `--profile` overrides
`GROUPI_PROFILE`, which otherwise defaults to `default`. Unknown profiles fail.
Profile names cannot be overwritten: use a new name when changing a server.
Profiles contain only API and optional authorization website URLs, in `~/.config/groupi` (or `GROUPI_CONFIG_DIR`).
HTTPS is required except literal loopback development URLs such as
`http://127.0.0.1:3211/api/v2`. URLs cannot contain credentials, query or fragment.
Authenticated redirects are always refused, including same-host redirects.
The hosted authorization website is `https://www.groupi.gg`. Named profiles need
an explicit `--web-url`; existing profiles can pass it to `auth login` for that
invocation. The authorization website must be an origin without a path. It is
never inferred from a REST hostname.

## Output contract

Human-readable output is the default. `--format json` emits one success document
on stdout or `{ "error": { "code": "...", "message": "..." } }` on stderr.
Help/version in JSON mode use `{ "text": "..." }`. JSON errors and missing inputs
never prompt. Event lists return `{ "items": [...], "nextCursor": "..." }`, with
`null` indicating completion. An empty page can still have a continuation cursor.
Default page size is 20; `--limit` accepts 1–100. `--all` follows cursors from the
requested starting page and reports success only after full retrieval.
Event detail returns the REST v2 event document directly.

| Exit | Meaning                                       |
| ---- | --------------------------------------------- |
| 0    | Success                                       |
| 1    | Unexpected internal failure                   |
| 2    | Usage, profile, endpoint, or validation error |
| 3    | Authentication or permission error            |
| 4    | Resource or API endpoint not found            |
| 5    | Network, rate limit, or invalid server reply  |

Read requests have a 10-second attempt timeout and at most three attempts for
network failures, HTTP 429, 502, 503, or 504. Retry delays are bounded to two
seconds; a longer server `Retry-After` returns an actionable failure immediately
instead of retrying before the server allows. Other HTTP failures are not retried. Raw server error bodies are never
echoed, preventing reflected credentials from entering diagnostics.
Authentication exchanges and revocations have a 10-second network timeout and
are never retried. This milestone has no event write commands or interactive TUI.

Command names, JSON fields, and exit codes are stable within a major version;
breaking changes require a major release and migration notes. Experimental
commands will be explicitly identified; the commands above are not experimental.

## Verification

`pnpm --filter @groupi/cli test:run` tests the executable's public behavior using a
local HTTP fixture. `test:package` packs and installs the archive in a temporary
directory, verifies its executable and contents, and reruns the same tests against
the installed binary. Backend real-router tests separately establish authentication,
authorization, and cursor behavior. CI runs package checks on Node 22/24 across
all three supported operating systems; a workflow definition alone is not evidence
of a successful matrix run. See the repository's CLI capability checklist for
current release evidence and remaining work.

Native credential-store smoke checks run against the actual OS provider on all
three platforms in CI, including an unavailable Linux session bus. Deterministic
CLI callback tests substitute only the external native binding; they do not
establish OS integration on their own. The native store smoke script can be run
with `node packages/cli/scripts/test-credential-store.js` from the repository root.
