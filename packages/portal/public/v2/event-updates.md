# Update an Event safely

v2 · Current · Source: convex/api/v2/schemas/events.ts
Canonical document: http://localhost:4173/v2/event-updates.md
Public contract baseline: ec33a44dce0ba9be828c3d8916d768ae81060a8c · verified 2026-10-30

Source availability does not establish hosted deployment or registry publication.

## Table of Contents

- [Outcome and authority](#outcome)
- [1. Choose a supported field](#update)
- [Complete typescript title update](#update-typescript)
- [Complete python title update](#update-python)
- [Complete curl title update](#update-curl)
- [2. Verify a permitted read-back](#verify)
- [Recover without overwriting another change](#recovery)

<a id="outcome"></a>
## Outcome and authority
Canonical passage: http://localhost:4173/v2/event-updates#outcome

Change the title of an existing Event and, if separately permitted, read it back. Use a legacy events-write key or a bounded/delegated credential with events.update on the selected Event. Current Moderator-or-higher authority is required; date changes retain any stricter Organizer-only policy. A write-only grant acknowledges {eventId} but does not permit read-back or disclose existing content. REST v2; source baseline ec33a44dce0ba9be828c3d8916d768ae81060a8c inspected 2026-10-30. Source support only. Deployment, issuer configuration and package registry availability are separately unverified. No SDK installation is required by these direct HTTP examples.

<a id="update"></a>
## 1. Choose a supported field
Canonical passage: http://localhost:4173/v2/event-updates#update

PATCH /events/{eventId} accepts a nonempty object with title (1–200), description (up to 5000), location (up to 500), potentialDateTimeOptions or nullable reminderOffset. Do not invent visibility, expectedVersion or If-Match support. Date option starts/ends need explicit UTC offsets; do not silently replace date options in this title lesson. Verify identity using the chosen credential mode, inspect permitted current state, and obtain authorization for the exact change before sending {"title":"Planning dinner"}.

```sh
curl --fail-with-body --max-time 30 -X PATCH \
  "$GROUPI_API_URL/events/$EVENT_ID" \
  -H "x-api-key: $GROUPI_API_KEY" -H "Content-Type: application/json" \
  --data-binary '{"title":"Planning dinner"}'
# For an explicitly delegated flow use only Authorization: Bearer, never both credentials.
```

- [REST v2 exact schemas and operations](http://localhost:4173/v2/reference/api)
- [Download REST v2 OpenAPI](http://localhost:4173/exports/openapi-v2.json)

<a id="update-typescript"></a>
## Complete typescript title update
Canonical passage: http://localhost:4173/v2/event-updates#update-typescript

This own-account variant requires a legacy key with profile-read, Event-read and Event-write permissions plus current Event management authority. Use the first Event local setup; set GROUPI_EVENT_ID and GROUPI_EVENT_TITLE to the exact approved change. Same runtimes as that lesson; save as recipe.mts/.py/.sh and run node/python3/bash respectively. Initially omit GROUPI_ALLOW_UPDATE: identity and read succeed, then the script stops without writing. Set GROUPI_ALLOW_UPDATE=yes only after approval. Each execution sends at most one PATCH; never rerun automatically after a timeout. Expected output: Verified title update: EVENT_ID TITLE. This is not the write-only or delegated variant.

```typescript
// Node.js 22.18+ or 24; save as first-event.mts, run node first-event.mts. No SDK install.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
const env = process.env;
function required(name: string) { const value = env[name]; if (!value) throw new Error('Missing ' + name); return value; }
const api = required('GROUPI_API_URL').replace(/\/$/, '');
const web = required('GROUPI_WEB_URL').replace(/\/$/, '');
const key = required('GROUPI_API_KEY');
const personId = required('GROUPI_EXPECTED_PERSON_ID');
if (!key.startsWith('grp_') || key.startsWith('grp_b_')) throw new Error('Own-account legacy collection key required; no fallback.');
for (const value of [api, web]) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Trusted HTTPS instance URLs required.');
}
if (new URL(api).pathname !== '/api/v2' || new URL(web).pathname !== '/') throw new Error('Use /api/v2 and website origin.');
if (env.GROUPI_CONFIRMED_API_URL !== api || env.GROUPI_CONFIRMED_WEB_URL !== web) throw new Error('Independently confirm matching API and website origins first.');
async function request(path: string, method = 'GET', body?: string, requestId?: string) {
  const headers: Record<string, string> = { 'x-api-key': key, 'Content-Type': 'application/json' };
  if (requestId) headers['Idempotency-Key'] = requestId;
  const response = await fetch(api + path, {method, headers, body, redirect: 'error', signal: AbortSignal.timeout(30000)});
  if (!response.ok) throw new Error('HTTP ' + response.status + '; retain state, inspect before replay.');
  return response.json();
}
const profile = await request('/profile');
if (profile.personId !== personId) throw new Error('Wrong account; no Event created.');
const eventId = required('GROUPI_EVENT_ID'), title = required('GROUPI_EVENT_TITLE');
if (title.length < 1 || title.length > 200) throw new Error('Title must have 1–200 characters.');
const path = '/events/' + encodeURIComponent(eventId);
await request(path); // This recipe explicitly requires separate read scope.
if (env.GROUPI_ALLOW_UPDATE !== 'yes') throw new Error('Read verified. Authorize exact title change before GROUPI_ALLOW_UPDATE=yes.');
// One PATCH, never automatic retry. No Idempotency-Key guarantee for this operation.
await request(path, 'PATCH', JSON.stringify({title}));
const event = await request(path);
if (event.id !== eventId || event.title !== title) throw new Error('Read-back differs; inspect concurrent changes without retrying.');
console.log('Verified title update:', event.id, event.title);

```

<a id="update-python"></a>
## Complete python title update
Canonical passage: http://localhost:4173/v2/event-updates#update-python

This own-account variant requires a legacy key with profile-read, Event-read and Event-write permissions plus current Event management authority. Use the first Event local setup; set GROUPI_EVENT_ID and GROUPI_EVENT_TITLE to the exact approved change. Same runtimes as that lesson; save as recipe.mts/.py/.sh and run node/python3/bash respectively. Initially omit GROUPI_ALLOW_UPDATE: identity and read succeed, then the script stops without writing. Set GROUPI_ALLOW_UPDATE=yes only after approval. Each execution sends at most one PATCH; never rerun automatically after a timeout. Expected output: Verified title update: EVENT_ID TITLE. This is not the write-only or delegated variant.

```python
# Python 3.10+ standard library; save as recipe.py, run python3 recipe.py.
import urllib.request
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args): return None
def request(method, path, body=None, request_id=None):
    headers = {'x-api-key': key, 'Content-Type': 'application/json'}
    if request_id: headers['Idempotency-Key'] = request_id
    req = urllib.request.Request(api + path, data=body.encode() if body else None, headers=headers, method=method)
    with urllib.request.build_opener(NoRedirect).open(req, timeout=30) as response:
        return json.load(response)
import json, os, pathlib, sys, time, uuid, urllib.parse
api = os.environ['GROUPI_API_URL'].rstrip('/')
web = os.environ['GROUPI_WEB_URL'].rstrip('/')
expected = os.environ['GROUPI_EXPECTED_PERSON_ID']
key = os.environ['GROUPI_API_KEY']
if not key.startswith('grp_') or key.startswith('grp_b_'):
    raise SystemExit('Stop: own-account legacy collection key required; no fallback.')
for url in (api, web):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise SystemExit('Stop: select trusted HTTPS instance URLs without credentials/query/fragment.')
if urllib.parse.urlsplit(api).path != '/api/v2' or urllib.parse.urlsplit(web).path not in ('', '/'):
    raise SystemExit('Stop: API must end /api/v2 and web URL must be an origin.')
if os.environ.get('GROUPI_CONFIRMED_API_URL') != api or os.environ.get('GROUPI_CONFIRMED_WEB_URL') != web:
    raise SystemExit('Stop: independently confirm the matching API and website origins first.')
profile = request('GET', '/profile')
if profile.get('personId') != expected:
    raise SystemExit('Stop: wrong account; no Event created.')
event_id = os.environ['GROUPI_EVENT_ID']
title = os.environ['GROUPI_EVENT_TITLE']
if not 1 <= len(title) <= 200: raise SystemExit('Title must have 1–200 characters.')
path = '/events/' + urllib.parse.quote(event_id, safe='')
before = request('GET', path)  # This recipe explicitly requires separate read scope.
if os.environ.get('GROUPI_ALLOW_UPDATE') != 'yes':
    raise SystemExit('Read verified. Authorize exact title change before GROUPI_ALLOW_UPDATE=yes.')
# Exactly one PATCH. No Idempotency-Key guarantee; no retry after uncertainty.
request('PATCH', path, json.dumps(dict(title=title)))
after = request('GET', path)
if after['id'] != event_id or after['title'] != title:
    raise SystemExit('Read-back differs; inspect concurrent changes without retrying.')
print('Verified title update:', after['id'], after['title'])

```

<a id="update-curl"></a>
## Complete curl title update
Canonical passage: http://localhost:4173/v2/event-updates#update-curl

This own-account variant requires a legacy key with profile-read, Event-read and Event-write permissions plus current Event management authority. Use the first Event local setup; set GROUPI_EVENT_ID and GROUPI_EVENT_TITLE to the exact approved change. Same runtimes as that lesson; save as recipe.mts/.py/.sh and run node/python3/bash respectively. Initially omit GROUPI_ALLOW_UPDATE: identity and read succeed, then the script stops without writing. Set GROUPI_ALLOW_UPDATE=yes only after approval. Each execution sends at most one PATCH; never rerun automatically after a timeout. Expected output: Verified title update: EVENT_ID TITLE. This is not the write-only or delegated variant.

```sh
# Bash, Python 3.10+, curl 7.76+; save as recipe.sh, run bash recipe.sh.
set -eu
python3 - <<'PY'
import subprocess
def request(method, path, body=None, request_id=None):
    # Headers travel on stdin, not the command line. Never print them or enable tracing.
    headers = 'x-api-key: ' + key + '\nContent-Type: application/json\n'
    if request_id: headers += 'Idempotency-Key: ' + request_id + '\n'
    if '\n' in key or '\r' in key: raise SystemExit('Invalid key')
    args = ['curl', '--silent', '--show-error', '--fail-with-body', '--max-time', '30',
            '--max-redirs', '0', '--proto', '=https', '-X', method, '-H', '@-', api + path,
            '--write-out', '\n%{http_code}']
    if body is not None: args += ['--data-binary', body]
    result = subprocess.run(args, input=headers, text=True, capture_output=True)
    output, _, status = result.stdout.rpartition('\n')
    if result.returncode or not status.startswith('2'):
        raise SystemExit('HTTP failure or uncertain response; retain state and inspect before replay.')
    return json.loads(output)
import json, os, pathlib, sys, time, uuid, urllib.parse
api = os.environ['GROUPI_API_URL'].rstrip('/')
web = os.environ['GROUPI_WEB_URL'].rstrip('/')
expected = os.environ['GROUPI_EXPECTED_PERSON_ID']
key = os.environ['GROUPI_API_KEY']
if not key.startswith('grp_') or key.startswith('grp_b_'):
    raise SystemExit('Stop: own-account legacy collection key required; no fallback.')
for url in (api, web):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password or parsed.query or parsed.fragment:
        raise SystemExit('Stop: select trusted HTTPS instance URLs without credentials/query/fragment.')
if urllib.parse.urlsplit(api).path != '/api/v2' or urllib.parse.urlsplit(web).path not in ('', '/'):
    raise SystemExit('Stop: API must end /api/v2 and web URL must be an origin.')
if os.environ.get('GROUPI_CONFIRMED_API_URL') != api or os.environ.get('GROUPI_CONFIRMED_WEB_URL') != web:
    raise SystemExit('Stop: independently confirm the matching API and website origins first.')
profile = request('GET', '/profile')
if profile.get('personId') != expected:
    raise SystemExit('Stop: wrong account; no Event created.')
event_id = os.environ['GROUPI_EVENT_ID']
title = os.environ['GROUPI_EVENT_TITLE']
if not 1 <= len(title) <= 200: raise SystemExit('Title must have 1–200 characters.')
path = '/events/' + urllib.parse.quote(event_id, safe='')
before = request('GET', path)  # This recipe explicitly requires separate read scope.
if os.environ.get('GROUPI_ALLOW_UPDATE') != 'yes':
    raise SystemExit('Read verified. Authorize exact title change before GROUPI_ALLOW_UPDATE=yes.')
# Exactly one PATCH. No Idempotency-Key guarantee; no retry after uncertainty.
request('PATCH', path, json.dumps(dict(title=title)))
after = request('GET', path)
if after['id'] != event_id or after['title'] != title:
    raise SystemExit('Read-back differs; inspect concurrent changes without retrying.')
print('Verified title update:', after['id'], after['title'])
PY

```

<a id="verify"></a>
## 2. Verify a permitted read-back
Canonical passage: http://localhost:4173/v2/event-updates#verify

The bounded/delegated v2 acknowledgement is HTTP 200 {eventId}; legacy responses follow the exact operation reference. If events.read and current authority permit it, GET /events/{eventId} and compare title. Done means the intended field matches, with no unrelated mutation. If read permission is absent, report only the acknowledgement and missing verification; do not escalate to an owner key.

<a id="recovery"></a>
## Recover without overwriting another change
Canonical passage: http://localhost:4173/v2/event-updates#recovery

Do not assume Idempotency-Key protects PATCH. After a timeout inspect the current permitted state and resolve concurrent changes with the user before deliberately resubmitting. A read-before-write is not an atomic concurrency guarantee. Keep 401/403 as failures, stop on lost role or scope, and never silently replace another user’s update. Any date/add-on lifecycle side effects remain canonical server behavior.

- [Credential modes and grants](http://localhost:4173/v2/auth)
- [Connect another user](http://localhost:4173/v2/connect-users)
