# Read Group Events

v2 · Current · Source: convex/api/v2/routes/groupEventAudiences.ts
Canonical document: http://localhost:4173/v2/group-events.md
Public contract baseline: ec33a44dce0ba9be828c3d8916d768ae81060a8c · verified 2026-10-30

Source availability does not establish hosted deployment or registry publication.

## Table of Contents

- [Outcome and prerequisites](#outcome)
- [1. Read eligible Group Event previews](#read)
- [Complete typescript Group read](#group-typescript)
- [Complete python Group read](#group-python)
- [Complete curl Group read](#group-curl)
- [Optional: explicitly share a separate Event](#share)
- [Group Event lifecycle and participation](#lifecycle)
- [Verify and recover deliberately](#recovery)

<a id="outcome"></a>
## Outcome and prerequisites
Canonical passage: http://localhost:4173/v2/group-events#outcome

A currently eligible Group member can discover the shared upcoming or undated Event. Group managers receive no Event-management role from sharing. Use a legacy collection key with Group read scope and current eligible Group membership/onboarding to read existing shared Event previews. No initial mutation is needed. Optional sharing requires separate Event/Group write scopes, current Event Organizer authority and current Group sharing permission. Group audience management is not an events.read/events.update bounded or delegated capability. Separately scoped delegated community workflows do not authorize this management recipe. REST v2; source baseline ec33a44dce0ba9be828c3d8916d768ae81060a8c inspected 2026-10-30. Source support only. Deployment, issuer configuration and package registry availability are separately unverified. No SDK installation is required by these direct HTTP examples.

<a id="read"></a>
## 1. Read eligible Group Event previews
Canonical passage: http://localhost:4173/v2/group-events#read

GET /groups/{groupId}/events?limit=20 returns {items:[{event,canWithdraw}],nextCursor}. The event is a safe logistics projection, not the full Event-detail schema. Follow opaque nextCursor until null, even when items is empty. Pages omit past or currently unreadable Events; an undated Event can be discoverable. Readability does not establish permission to publish these previews publicly.

```sh
curl --fail-with-body --max-time 30 \
  "$GROUPI_API_URL/groups/$GROUP_ID/events?limit=20" \
  -H "x-api-key: $GROUPI_API_KEY"
```

<a id="group-typescript"></a>
## Complete typescript Group read
Canonical passage: http://localhost:4173/v2/group-events#group-typescript

Use the first Event local instance/account setup and a legacy collection key permitting profile and Group reads. Set GROUPI_GROUP_ID to the intended Group. Save the complete script as recipe.mts (Node.js 22.18+ or 24), recipe.py (Python 3.10+) or recipe.sh (Bash, Python 3.10+, curl 7.76+). Run node recipe.mts, python3 recipe.py or bash recipe.sh. It follows opaque cursors even after an empty page and performs no writes. Private previews stay in your terminal; expected final output: Group previews: N (zero is success).

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
const groupId = required('GROUPI_GROUP_ID');
let cursor: string | null = null, count = 0;
const seen = new Set<string>();
do {
  const query = new URLSearchParams({limit:'20'});
  if (cursor) query.set('cursor', cursor);
  const page = await request('/groups/' + encodeURIComponent(groupId) + '/events?' + query);
  for (const item of page.items) { console.log(JSON.stringify(item)); count++; }
  cursor = page.nextCursor;
  if (cursor !== null) { if (seen.has(cursor)) throw new Error('Repeated cursor'); seen.add(cursor); }
} while (cursor !== null);
console.log('Group previews:', count, '(zero is success)');

```

<a id="group-python"></a>
## Complete python Group read
Canonical passage: http://localhost:4173/v2/group-events#group-python

Use the first Event local instance/account setup and a legacy collection key permitting profile and Group reads. Set GROUPI_GROUP_ID to the intended Group. Save the complete script as recipe.mts (Node.js 22.18+ or 24), recipe.py (Python 3.10+) or recipe.sh (Bash, Python 3.10+, curl 7.76+). Run node recipe.mts, python3 recipe.py or bash recipe.sh. It follows opaque cursors even after an empty page and performs no writes. Private previews stay in your terminal; expected final output: Group previews: N (zero is success).

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
group_id = os.environ['GROUPI_GROUP_ID']
cursor, seen, count = None, set(), 0
while True:
    query = urllib.parse.urlencode(dict(limit=20, **({'cursor':cursor} if cursor else {})))
    page = request('GET', '/groups/' + urllib.parse.quote(group_id, safe='') + '/events?' + query)
    # These are private logistics previews, not full Event details; do not publish.
    for item in page['items']: print(json.dumps(item)); count += 1
    cursor = page['nextCursor']
    if cursor is None: break
    if cursor in seen: raise SystemExit('Repeated cursor; stop rather than loop.')
    seen.add(cursor)
print('Group previews:', count, '(zero is success)')

```

<a id="group-curl"></a>
## Complete curl Group read
Canonical passage: http://localhost:4173/v2/group-events#group-curl

Use the first Event local instance/account setup and a legacy collection key permitting profile and Group reads. Set GROUPI_GROUP_ID to the intended Group. Save the complete script as recipe.mts (Node.js 22.18+ or 24), recipe.py (Python 3.10+) or recipe.sh (Bash, Python 3.10+, curl 7.76+). Run node recipe.mts, python3 recipe.py or bash recipe.sh. It follows opaque cursors even after an empty page and performs no writes. Private previews stay in your terminal; expected final output: Group previews: N (zero is success).

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
group_id = os.environ['GROUPI_GROUP_ID']
cursor, seen, count = None, set(), 0
while True:
    query = urllib.parse.urlencode(dict(limit=20, **({'cursor':cursor} if cursor else {})))
    page = request('GET', '/groups/' + urllib.parse.quote(group_id, safe='') + '/events?' + query)
    # These are private logistics previews, not full Event details; do not publish.
    for item in page['items']: print(json.dumps(item)); count += 1
    cursor = page['nextCursor']
    if cursor is None: break
    if cursor in seen: raise SystemExit('Repeated cursor; stop rather than loop.')
    seen.add(cursor)
print('Group previews:', count, '(zero is success)')
PY

```

<a id="share"></a>
## Optional: explicitly share a separate Event
Canonical passage: http://localhost:4173/v2/group-events#share

Verify own-account identity and matching instance as in the first Event lesson. Inspect GET /events/{eventId}/audiences and the intended Group before changing its audience. With explicit user approval, POST /events/{eventId}/audiences/groups/{groupId}; this request has path identifiers and no JSON body. Expected HTTP 200 is {eventId,groupId,shared:true}. The Group policy chooses MANAGERS or MEMBERS; being an Event Organizer alone is insufficient. Never reconfigure Group policy merely to overcome denial.

```sh
curl --fail-with-body --max-time 30 -X POST \
  "$GROUPI_API_URL/events/$EVENT_ID/audiences/groups/$GROUP_ID" \
  -H "x-api-key: $GROUPI_API_KEY"
```

- [REST v2 exact schemas and operations](http://localhost:4173/v2/reference/api)
- [Download REST v2 OpenAPI](http://localhost:4173/exports/openapi-v2.json)

<a id="lifecycle"></a>
## Group Event lifecycle and participation
Canonical passage: http://localhost:4173/v2/group-events#lifecycle

Whole-Group sharing creates no invitation, membership or RSVP. Event admission is separate; an approved application creates Attendee membership with Pending RSVP under current audience/reviewer rules. Departure, bans, required-onboarding loss or withdrawal ends only the affected Group grant. Other audiences and independent Event membership/RSVP remain. Completed Events stop appearing in upcoming previews; a date poll needing new dates is a different lifecycle state.

<a id="recovery"></a>
## Verify and recover deliberately
Canonical passage: http://localhost:4173/v2/group-events#recovery

Done: the intended Group’s permitted page shows appropriate upcoming/undated previews or an explicit empty success, opaque pagination is respected, and no invitation, membership, RSVP or audience mutation was emitted. If the user separately authorized sharing, verify the intended audience grant by permitted read-back. On uncertain sharing or withdrawal, inspect current audiences before resubmitting; do not assume Event-create Idempotency-Key guarantees. 401/403 stops without credential fallback. A separately authorized DELETE /events/{eventId}/audiences/groups/{groupId} returns {eventId,groupId,shared:false}; it withdraws only that grant, not existing participation.

- [First Event identity and local setup](http://localhost:4173/v2/integrator)
- [Event updates](http://localhost:4173/v2/event-updates)
