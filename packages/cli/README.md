# Groupi CLI

Development milestone for [#222](https://github.com/groupi-app/groupi/issues/222).
The package can be packed and installed locally; registry publication and browser
login are subsequent tickets. Supports Node 22 and 24 on macOS, Windows, and Linux.
Runtime files are plain JavaScript checked by TypeScript, so installation needs no
compiler, React, Expo, or Next.js runtime.

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
groupi profile add staging --api-url https://your-installation.example/api/v2
groupi --profile staging --api-key-stdin events list --format json
```

Environment-key use on that profile additionally requires
`GROUPI_API_KEY_PROFILE=staging`. An unscoped environment key is bound to `default`;
selecting another server never silently reuses it. `--profile` overrides
`GROUPI_PROFILE`, which otherwise defaults to `default`. Unknown profiles fail.
Profile names cannot be overwritten: use a new name when changing a server.
Profiles contain only API URLs, in `~/.config/groupi` (or `GROUPI_CONFIG_DIR`).
HTTPS is required except literal loopback development URLs such as
`http://127.0.0.1:3211/api/v2`. URLs cannot contain credentials, query or fragment.
Authenticated redirects are always refused, including same-host redirects.

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
This milestone has no remote write commands or interactive TUI.

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
