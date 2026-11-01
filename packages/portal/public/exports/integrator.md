# Read and create your first event

v2 · Current · Source: convex/api/v2/routes/events.ts
Canonical document: http://localhost:4173/v2/integrator.md
Public contract baseline: ec33a44dce0ba9be828c3d8916d768ae81060a8c · verified 2026-10-30

Source availability does not establish hosted deployment or registry publication.

## Table of Contents

- [Your finished Event — simulated](#outcome)
- [1. Choose an instance and credential](#credentials)
- [2. Verify your account and read Events](#read-events)
- [Empty success and pagination](#empty-pages)
- [3. Create one undated Event](#create-event)
- [4. Read back and open in Groupi](#read-back)
- [Recover an uncertain create](#uncertain-write)
- [Wrong account or permission denied](#authority)
- [Run against my account](#run-locally)
- [Local TypeScript example](#local-typescript)
- [Local Python example](#local-python)
- [Local cURL example](#local-curl)
- [Keep or remove your test Event](#cleanup)

<a id="outcome"></a>
## Your finished Event — simulated
Canonical passage: http://localhost:4173/v2/integrator#outcome

My first Groupi Event · Date not set · event_fixture_001. You will create one undated Event, read it back, and open it in the matching Groupi website. This finished card is a fixture, not an account result. The minimal source flow creates Organizer membership and a private-by-default Event without invitations or audience changes. No visibility field is sent: the create schema has none. Private-default and nonmember behavior still require verification on the intended deployed release.

<a id="credentials"></a>
## 1. Choose an instance and credential
Canonical passage: http://localhost:4173/v2/integrator#credentials

Use your own account and an explicitly labeled legacy collection API key with events read/write and profile-read authority, obtained in Settings → Account → API Keys on the intended instance. Bounded keys and delegated access tokens cannot create Events. Select the HTTPS HTTP-actions origin plus /api/v2 and the separate matching website origin; never assume these hosts are interchangeable. Verify their pairing independently in the instance settings. Keep keys in local environment variables or a secret manager, never prompts, URLs, browser code, logs or the public simulation. REST v2; source baseline ec33a44dce0ba9be828c3d8916d768ae81060a8c inspected 2026-10-30. Source support only. Deployment, issuer configuration and package registry availability are separately unverified. No SDK installation is required by these direct HTTP examples.

- [REST v2 exact schemas and operations](http://localhost:4173/v2/reference/api)
- [Download REST v2 OpenAPI](http://localhost:4173/exports/openapi-v2.json)

<a id="read-events"></a>
## 2. Verify your account and read Events
Canonical passage: http://localhost:4173/v2/integrator#read-events

GET /profile with your legacy key returns a direct object including personId. Compare it privately against the intended account identifier, then GET /events?pagination=cursor&limit=20. Stop on the wrong account, wrong instance, 401 or 403 before any write. This own-account check is not a delegated identity check: delegated integrations use validated signed OIDC claims/userinfo, not global /profile.

<a id="empty-pages"></a>
## Empty success and pagination
Canonical passage: http://localhost:4173/v2/integrator#empty-pages

An empty list is a successful response: {"items":[],"nextCursor":null}. Keep following the opaque nextCursor until null, even after an empty page. The quickstart reads only the first page and does not claim that it lists every Event. REST v2 returns resource bodies directly, without the v1 success/data wrapper.

<a id="create-event"></a>
## 3. Create one undated Event
Canonical passage: http://localhost:4173/v2/integrator#create-event

Input is exactly {"title":"My first Groupi Event"}; title must be 1–200 characters. Persist a fresh <unix-ms>.<uuid-v4> request identity and the exact JSON body before POST /events with Idempotency-Key. Expected HTTP 201 body is {"eventId":"…","membershipId":"…"}. Do not add visibility, attendees, invitations or Group audiences. The examples below deliberately stop unless GROUPI_ALLOW_CREATE=yes is set locally after identity verification.

<a id="read-back"></a>
## 4. Read back and open in Groupi
Canonical passage: http://localhost:4173/v2/integrator#read-back

GET /events/{eventId} returns the Event object directly. Verify id and title match the retained request and chosenDateTime is null. Open the trusted matching website origin plus /event/{encodedEventId}, not the API origin. Done means one undated Event read back and a matching-instance link; report “verified” only after real permitted responses, otherwise “simulated” or “prepared”.

```text
Expected local terminal output (illustrative identifiers):
Accessible Events in first page: 0 (zero is success)
Verified one undated Event: EVENT_ID My first Groupi Event
Open in Groupi: https://YOUR-APP/event/EVENT_ID
```

<a id="uncertain-write"></a>
## Recover an uncertain create
Canonical passage: http://localhost:4173/v2/integrator#uncertain-write

A timeout can mean the create committed. Keep groupi-first-event.json and replay the same identity and unchanged payload within 24 hours of the request timestamp. These scripts retain state before the first write and reuse it after a lost response; after storing eventId they only read back. Editing the title, a different account/instance, a conflict or an expired identity stops the flow: inspect the account and retained request rather than blindly generating another create. Never automatically retry arbitrary mutations. Do not delete the state file to solve a failure.

<a id="authority"></a>
## Wrong account or permission denied
Canonical passage: http://localhost:4173/v2/integrator#authority

A credential never grants more than current account authority. Organizer and Moderator are Event roles; a platform administrator is separate. 401 means credential/account eligibility; 403 means insufficient scope or current authority. Keep authorization failures as failures, with no owner-key fallback. A collection scope is not an Event-specific grant. Independent attendee/Organizer verification must use the appropriate identity mechanism for each credential mode.

<a id="run-locally"></a>
## Run against my account
Canonical passage: http://localhost:4173/v2/integrator#run-locally

Copy one complete example below into a private local directory. TypeScript requires Node.js 22.18+ or 24 with native type stripping; Python requires Python 3.10+ standard library; cURL requires Bash, Python 3.10+ for safe JSON/state handling and curl 7.76+. These are runtime requirements, not registry-release claims. Set GROUPI_API_KEY privately; do not paste it into this portal. First omit GROUPI_ALLOW_CREATE to verify identity without writing. Only after approving the intended account, operation and matching origins, set it to yes and rerun the same file. HTTP redirects are rejected. Request state stays in groupi-first-event.json (owner-only file); keep it private. Do not run competing copies in the same directory.

```sh
export GROUPI_API_URL="https://YOUR-INSTANCE.convex.site/api/v2"
export GROUPI_WEB_URL="https://YOUR-APP"
export GROUPI_EXPECTED_PERSON_ID="YOUR_VERIFIED_PERSON_ID"
# Independently verify these origins belong to your intended instance:
export GROUPI_CONFIRMED_API_URL="$GROUPI_API_URL"
export GROUPI_CONFIRMED_WEB_URL="$GROUPI_WEB_URL"
# Set GROUPI_API_KEY privately. Do not enable shell tracing.
# First run without GROUPI_ALLOW_CREATE. Then explicitly authorize one Event:
# export GROUPI_ALLOW_CREATE=yes
```

<a id="local-typescript"></a>
## Local TypeScript example
Canonical passage: http://localhost:4173/v2/integrator#local-typescript

Complete direct HTTP example; local execution only. No unpublished SDK package is needed. Keep the state file for recovery and stop on authorization failures.

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
const page = await request('/events?pagination=cursor&limit=20');
console.log('Accessible Events in first page:', page.items.length, '(zero is success)');
if (env.GROUPI_ALLOW_CREATE !== 'yes') throw new Error('Identity verified. Authorize one Event before setting GROUPI_ALLOW_CREATE=yes.');
const file = 'groupi-first-event.json';
const title = env.GROUPI_EVENT_TITLE ?? 'My first Groupi Event';
if (title.length < 1 || title.length > 200) throw new Error('Title must have 1–200 characters.');
const state: { api: string; web: string; personId: string; requestId: string; body: string; eventId?: string } = existsSync(file)
  ? JSON.parse(readFileSync(file, 'utf8'))
  : { api, web, personId, requestId: Date.now() + '.' + randomUUID(), body: JSON.stringify({title}) };
if (state.api !== api || state.web !== web || state.personId !== personId) throw new Error('Retained request belongs to another instance/account.');
if (env.GROUPI_EVENT_TITLE && JSON.parse(state.body).title !== title) throw new Error('Changed payload; inspect retained request.');
if (!existsSync(file)) writeFileSync(file, JSON.stringify(state), {flag:'wx', mode:0o600});
if (!state.eventId) {
  const age = Date.now() - Number(state.requestId.split('.')[0]);
  if (age < -300000 || age >= 86400000) throw new Error('Expired/future request; inspect, do not replace identity.');
  state.eventId = (await request('/events', 'POST', state.body, state.requestId)).eventId;
  writeFileSync(file, JSON.stringify(state), {mode:0o600});
}
const event = await request('/events/' + encodeURIComponent(state.eventId!));
if (event.id !== state.eventId || event.title !== JSON.parse(state.body).title || event.chosenDateTime !== null) throw new Error('Read-back mismatch; inspect without another create.');
console.log('Verified one undated Event:', event.id, event.title);
console.log('Open in Groupi:', web + '/event/' + encodeURIComponent(event.id));

```

<a id="local-python"></a>
## Local Python example
Canonical passage: http://localhost:4173/v2/integrator#local-python

Complete direct HTTP example; local execution only. No unpublished SDK package is needed. Keep the state file for recovery and stop on authorization failures.

```python
# Python 3.10+ standard library. Save as first-event.py; run python3 first-event.py.
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
page = request('GET', '/events?pagination=cursor&limit=20')
print('Accessible Events in first page:', len(page['items']), '(zero is success)')
if os.environ.get('GROUPI_ALLOW_CREATE') != 'yes':
    raise SystemExit('Identity verified. Set GROUPI_ALLOW_CREATE=yes only after authorizing one Event.')
state_path = pathlib.Path('groupi-first-event.json')
if state_path.exists():
    state = json.loads(state_path.read_text())
    if (state['api'], state['web'], state['personId']) != (api, web, expected):
        raise SystemExit('Stop: retained request belongs to another instance/account.')
else:
    title = os.environ.get('GROUPI_EVENT_TITLE', 'My first Groupi Event')
    if not 1 <= len(title) <= 200: raise SystemExit('Title must have 1–200 characters.')
    state = dict(api=api, web=web, personId=expected,
        requestId=str(int(time.time()*1000))+'.'+str(uuid.uuid4()),
        body=json.dumps(dict(title=title), separators=(',', ':')))
    with state_path.open('x') as file:
        os.chmod(state_path, 0o600)
        json.dump(state, file)
# Keep this file private: it contains account/resource identifiers, never the key.
if os.environ.get('GROUPI_EVENT_TITLE', json.loads(state['body'])['title']) != json.loads(state['body'])['title']:
    raise SystemExit('Stop: changed payload; inspect retained request, do not create again.')
if 'eventId' not in state:
    age = int(time.time()*1000) - int(state['requestId'].split('.')[0])
    if age < -300000 or age >= 86400000:
        raise SystemExit('Stop: expired/future request. Inspect account; do not blindly replace identity.')
    created = request('POST', '/events', state['body'], state['requestId'])
    state['eventId'] = created['eventId']
    state_path.write_text(json.dumps(state))
event = request('GET', '/events/' + urllib.parse.quote(state['eventId'], safe=''))
if event['id'] != state['eventId'] or event['title'] != json.loads(state['body'])['title'] or event['chosenDateTime'] is not None:
    raise SystemExit('Stop: read-back did not match the undated request; inspect without another create.')
print('Verified one undated Event:', event['id'], event['title'])
print('Open in Groupi:', web + '/event/' + urllib.parse.quote(event['id'], safe=''))

```

<a id="local-curl"></a>
## Local cURL example
Canonical passage: http://localhost:4173/v2/integrator#local-curl

Complete direct HTTP example; local execution only. No unpublished SDK package is needed. Keep the state file for recovery and stop on authorization failures.

```sh
# Bash, Python 3.10+ and curl 7.76+. Save as first-event.sh; run bash first-event.sh.
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
page = request('GET', '/events?pagination=cursor&limit=20')
print('Accessible Events in first page:', len(page['items']), '(zero is success)')
if os.environ.get('GROUPI_ALLOW_CREATE') != 'yes':
    raise SystemExit('Identity verified. Set GROUPI_ALLOW_CREATE=yes only after authorizing one Event.')
state_path = pathlib.Path('groupi-first-event.json')
if state_path.exists():
    state = json.loads(state_path.read_text())
    if (state['api'], state['web'], state['personId']) != (api, web, expected):
        raise SystemExit('Stop: retained request belongs to another instance/account.')
else:
    title = os.environ.get('GROUPI_EVENT_TITLE', 'My first Groupi Event')
    if not 1 <= len(title) <= 200: raise SystemExit('Title must have 1–200 characters.')
    state = dict(api=api, web=web, personId=expected,
        requestId=str(int(time.time()*1000))+'.'+str(uuid.uuid4()),
        body=json.dumps(dict(title=title), separators=(',', ':')))
    with state_path.open('x') as file:
        os.chmod(state_path, 0o600)
        json.dump(state, file)
# Keep this file private: it contains account/resource identifiers, never the key.
if os.environ.get('GROUPI_EVENT_TITLE', json.loads(state['body'])['title']) != json.loads(state['body'])['title']:
    raise SystemExit('Stop: changed payload; inspect retained request, do not create again.')
if 'eventId' not in state:
    age = int(time.time()*1000) - int(state['requestId'].split('.')[0])
    if age < -300000 or age >= 86400000:
        raise SystemExit('Stop: expired/future request. Inspect account; do not blindly replace identity.')
    created = request('POST', '/events', state['body'], state['requestId'])
    state['eventId'] = created['eventId']
    state_path.write_text(json.dumps(state))
event = request('GET', '/events/' + urllib.parse.quote(state['eventId'], safe=''))
if event['id'] != state['eventId'] or event['title'] != json.loads(state['body'])['title'] or event['chosenDateTime'] is not None:
    raise SystemExit('Stop: read-back did not match the undated request; inspect without another create.')
print('Verified one undated Event:', event['id'], event['title'])
print('Open in Groupi:', web + '/event/' + urllib.parse.quote(event['id'], safe=''))
PY

```

<a id="cleanup"></a>
## Keep or remove your test Event
Canonical passage: http://localhost:4173/v2/integrator#cleanup

Keep the Event if useful, or deliberately remove this exact test Event through the matching Groupi website after reviewing it. Cleanup is not automatic and must not remove a different Event. Revoke a temporary key in that instance’s API Key settings when finished. Retain the request record until the outcome is established, then securely remove local test state if no longer needed. Next build a private Event widget.

- [Build a private Event widget](http://localhost:4173/v2/event-widget)
- [Build with an agent — Markdown](http://localhost:4173/agents.md)
