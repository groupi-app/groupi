# Connect another user

v2 · Upcoming · Source: docs/delegated-sign-in.md
Canonical document: http://localhost:4173/v2/connect-users.md
Public contract baseline: ec33a44dce0ba9be828c3d8916d768ae81060a8c · verified 2026-10-30

Source availability does not establish hosted deployment or registry publication.

## Table of Contents

- [Outcome and prerequisites](#outcome)
- [1. Complete the supported consent protocol](#protocol)
- [Implementation gate — sign-in is not complete](#implementation-gate)
- [2. Verify permitted identity](#identity)
- [3. Read one selected Event](#read)
- [Post-consent typescript resource read](#delegated-typescript)
- [Post-consent python resource read](#delegated-python)
- [Post-consent curl resource read](#delegated-curl)
- [Supported actions are explicit](#actions)
- [4. Handle expiry and disconnect](#disconnect)
- [Check the connected result](#done)

<a id="outcome"></a>
## Outcome and prerequisites
Canonical passage: http://localhost:4173/v2/connect-users#outcome

An explicitly consenting user connects an eligible Developer app to selected Events on one configured instance. This is not the own-account API-key quickstart. Prerequisites are a verified deployed issuer, registered eligible app, exact registered callback and approved client type. Registration, wider-access review and consent are separate actions requiring authorization; receiving this guide performs none of them. New apps are owner-only for testing until eligible for wider access. REST v2; source baseline ec33a44dce0ba9be828c3d8916d768ae81060a8c inspected 2026-10-30. Source support only. Deployment, issuer configuration and package registry availability are separately unverified. No SDK installation is required by these direct HTTP examples.

<a id="protocol"></a>
## 1. Complete the supported consent protocol
Canonical passage: http://localhost:4173/v2/connect-users#protocol

Use authorization code with PKCE S256, exact issuer and API audience validation, callback state and ID-token nonce verification. Discover protocol endpoints only from the trusted pinned issuer under /oauth; never follow arbitrary credential redirects or switch instances on failure. Confidential web clients use private_key_jwt with their private key kept local/server-side; native clients use the system browser and no token-endpoint secret. Exact callback rules apply. Implicit, password, client-credentials and browser-only refresh clients are outside this profile. Preserve the user’s existing framework and use its audited OIDC client rather than inventing a token parser.

- [Authorization public guide](http://localhost:4173/v2/auth)

<a id="implementation-gate"></a>
## Implementation gate — sign-in is not complete
Canonical passage: http://localhost:4173/v2/connect-users#implementation-gate

Full runnable connection setup is not yet supplied here. The source SDK DelegatedSession creates state, nonce and PKCE S256 and checks exchange state, but explicitly does not consume or verify identity ID tokens. Its successful token exchange is not verified sign-in. A complete tutorial still needs a selected, audited OIDC client integrated with the exact callback, signed ID-token verification against pinned issuer keys, client audience, expiry and nonce checks, and an explicitly authorized configured issuer/app. Do not substitute decoded JWT claims, a preobtained bearer, environment assertions or global /profile for this missing verification. The examples below are complete post-consent resource reads only; they do not meet the end-to-end connection done condition. Issuer configuration, app registration and live consent remain separately gated. No unpublished npm/PyPI install is required or claimed.

- [Delegated source contract and verification limits](https://github.com/groupi-app/groupi/blob/ec33a44dce0ba9be828c3d8916d768ae81060a8c/docs/delegated-sign-in.md)

<a id="identity"></a>
## 2. Verify permitted identity
Canonical passage: http://localhost:4173/v2/connect-users#identity

Do not call global REST /profile with a delegated credential. openid provides an opaque app-and-instance-specific subject through validated signed ID-token claims; display name and email require independent identity.display-name and identity.email consent. Pin the issuer and account selected in consent. An identity-only token has no Event API actions. Never infer a global personId or reuse the legacy expected-personId check from the own-account scripts.

<a id="read"></a>
## 3. Read one selected Event
Canonical passage: http://localhost:4173/v2/connect-users#read

After the user explicitly grants events.read and selects the Event (or explicitly selects all current and future Events), send exactly one Authorization: Bearer credential to the pinned REST v2 resource. GET /events/{eventId} returns the permitted direct Event projection. Current membership and grant state are still enforced. Missing/expired/revoked consent returns failure; never attach an owner key, launch a consent popup or silently choose broader resources as fallback.

```sh
curl --fail-with-body --max-time 30 \
  "$GROUPI_API_URL/events/$EVENT_ID" \
  -H "Authorization: Bearer $GROUPI_ACCESS_TOKEN"
# Token stays local. Do not use x-api-key alongside Bearer or add -L.
```

- [REST v2 exact schemas and operations](http://localhost:4173/v2/reference/api)
- [Download REST v2 OpenAPI](http://localhost:4173/exports/openapi-v2.json)

<a id="delegated-typescript"></a>
## Post-consent typescript resource read
Canonical passage: http://localhost:4173/v2/connect-users#delegated-typescript

Not a connection tutorial or identity check. Run only after your audited OIDC client completes the protocol and establishes the intended issuer/subject and explicit events.read grant. Set GROUPI_ISSUER to the confirmed https://INSTANCE/oauth issuer, GROUPI_API_URL and GROUPI_CONFIRMED_API_URL to its /api/v2 resource, GROUPI_EVENT_ID to the selected Event, and GROUPI_ACCESS_TOKEN privately from that verified session. No legacy-key variables are used. Save as delegated-read.mts/.py/.sh and run node/python3/bash with the stated runtime. Expected private terminal output is the direct {id,title,chosenDateTime} projection. A denied request remains an error; the script never creates an Event or starts consent.

```typescript
// Post-consent only. Node.js 22.18+ or 24; save delegated-read.mts, run node delegated-read.mts.
const env = process.env;
function required(name: string) { const value = env[name]; if (!value) throw new Error('Missing ' + name); return value; }
const api = required('GROUPI_API_URL').replace(/\/$/, '');
const issuer = required('GROUPI_ISSUER').replace(/\/$/, '');
const url = new URL(api);
if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/api/v2') throw new Error('Trusted HTTPS /api/v2 required.');
if (issuer !== url.origin + '/oauth' || env.GROUPI_CONFIRMED_API_URL !== api) throw new Error('Pinned issuer/API mismatch.');
// Your audited OIDC client must already validate signed identity, issuer,
// audience, state and nonce. Environment variables alone do not verify identity.
const token = required('GROUPI_ACCESS_TOKEN');
const response = await fetch(api + '/events/' + encodeURIComponent(required('GROUPI_EVENT_ID')), {
  headers: {Authorization:'Bearer ' + token}, redirect:'error', signal:AbortSignal.timeout(30000),
});
if (!response.ok) throw new Error('HTTP ' + response.status + '; stop, no credential fallback or automatic consent.');
const event = await response.json();
console.log(JSON.stringify({id:event.id,title:event.title,chosenDateTime:event.chosenDateTime}));

```

<a id="delegated-python"></a>
## Post-consent python resource read
Canonical passage: http://localhost:4173/v2/connect-users#delegated-python

Not a connection tutorial or identity check. Run only after your audited OIDC client completes the protocol and establishes the intended issuer/subject and explicit events.read grant. Set GROUPI_ISSUER to the confirmed https://INSTANCE/oauth issuer, GROUPI_API_URL and GROUPI_CONFIRMED_API_URL to its /api/v2 resource, GROUPI_EVENT_ID to the selected Event, and GROUPI_ACCESS_TOKEN privately from that verified session. No legacy-key variables are used. Save as delegated-read.mts/.py/.sh and run node/python3/bash with the stated runtime. Expected private terminal output is the direct {id,title,chosenDateTime} projection. A denied request remains an error; the script never creates an Event or starts consent.

```python
# Post-consent only. Python 3.10+; save delegated-read.py, run python3 delegated-read.py.
import urllib.request
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args): return None
def request(method, path, body=None, request_id=None):
    headers = {'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'}
    if request_id: headers['Idempotency-Key'] = request_id
    req = urllib.request.Request(api + path, data=body.encode() if body else None, headers=headers, method=method)
    with urllib.request.build_opener(NoRedirect).open(req, timeout=30) as response:
        return json.load(response)
import json, os, urllib.parse
api = os.environ['GROUPI_API_URL'].rstrip('/')
issuer = os.environ['GROUPI_ISSUER'].rstrip('/')
key = os.environ['GROUPI_ACCESS_TOKEN']
url = urllib.parse.urlsplit(api)
if url.scheme != 'https' or not url.hostname or url.username or url.password or url.query or url.fragment or url.path != '/api/v2':
    raise SystemExit('Stop: trusted HTTPS /api/v2 URL required.')
if issuer != urllib.parse.urlunsplit((url.scheme,url.netloc,'/oauth','','')) or os.environ['GROUPI_CONFIRMED_API_URL'] != api:
    raise SystemExit('Stop: pinned issuer/API mismatch; never switch instances.')
if not key or '\n' in key or '\r' in key: raise SystemExit('Invalid token')
# Prerequisite: your audited OIDC client already validated signed identity,
# issuer, audience, state and nonce; these environment values are NOT proof.
# Never send this bearer to global /profile or replace it with an API key.
event = request('GET', '/events/' + urllib.parse.quote(os.environ['GROUPI_EVENT_ID'], safe=''))
print(json.dumps({name:event[name] for name in ('id','title','chosenDateTime')}))

```

<a id="delegated-curl"></a>
## Post-consent curl resource read
Canonical passage: http://localhost:4173/v2/connect-users#delegated-curl

Not a connection tutorial or identity check. Run only after your audited OIDC client completes the protocol and establishes the intended issuer/subject and explicit events.read grant. Set GROUPI_ISSUER to the confirmed https://INSTANCE/oauth issuer, GROUPI_API_URL and GROUPI_CONFIRMED_API_URL to its /api/v2 resource, GROUPI_EVENT_ID to the selected Event, and GROUPI_ACCESS_TOKEN privately from that verified session. No legacy-key variables are used. Save as delegated-read.mts/.py/.sh and run node/python3/bash with the stated runtime. Expected private terminal output is the direct {id,title,chosenDateTime} projection. A denied request remains an error; the script never creates an Event or starts consent.

```sh
# Post-consent only. Bash, Python 3.10+, curl 7.76+; save delegated-read.sh.
set -eu
python3 - <<'PY'
import subprocess
def request(method, path, body=None, request_id=None):
    # Headers travel on stdin, not the command line. Never print them or enable tracing.
    headers = 'Authorization: Bearer ' + key + '\nContent-Type: application/json\n'
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
import json, os, urllib.parse
api = os.environ['GROUPI_API_URL'].rstrip('/')
issuer = os.environ['GROUPI_ISSUER'].rstrip('/')
key = os.environ['GROUPI_ACCESS_TOKEN']
url = urllib.parse.urlsplit(api)
if url.scheme != 'https' or not url.hostname or url.username or url.password or url.query or url.fragment or url.path != '/api/v2':
    raise SystemExit('Stop: trusted HTTPS /api/v2 URL required.')
if issuer != urllib.parse.urlunsplit((url.scheme,url.netloc,'/oauth','','')) or os.environ['GROUPI_CONFIRMED_API_URL'] != api:
    raise SystemExit('Stop: pinned issuer/API mismatch; never switch instances.')
if not key or '\n' in key or '\r' in key: raise SystemExit('Invalid token')
# Prerequisite: your audited OIDC client already validated signed identity,
# issuer, audience, state and nonce; these environment values are NOT proof.
# Never send this bearer to global /profile or replace it with an API key.
event = request('GET', '/events/' + urllib.parse.quote(os.environ['GROUPI_EVENT_ID'], safe=''))
print(json.dumps({name:event[name] for name in ('id','title','chosenDateTime')}))
PY

```

<a id="actions"></a>
## Supported actions are explicit
Canonical passage: http://localhost:4173/v2/connect-users#actions

Event read and update, member read, discussion actions and file access have distinct actions and resource checks. Event creation and deletion, invitations and general membership administration are not inferred from events.read/events.update. A selected community/Discord grant, where separately deployed and consented, is a different capability, not blanket Group management. An unsupported delegated create fails closed; stop and explain the missing capability instead of changing credentials. events.update still requires current Event management authority and returns only {eventId}; file expansion requires its own permission.

<a id="disconnect"></a>
## 4. Handle expiry and disconnect
Canonical passage: http://localhost:4173/v2/connect-users#disconnect

Access tokens last five minutes. Background access requires separate offline_access consent; rotating refresh has a 30-day absolute and seven-day inactivity ceiling. Codes are single-use and short-lived; do not blindly replay an uncertain token exchange. Use the protocol client’s documented recovery, and request fresh consent only when explicitly authorized. Disconnect in Connected Apps stops future delegated access after committed revocation, but does not erase copied data or terminate the app’s own session. Already committed writes and acquired file URLs are not undone.

<a id="done"></a>
## Check the connected result
Canonical passage: http://localhost:4173/v2/connect-users#done

Done: validated instance-specific identity, the expressly granted selected-Event read returns permitted data, denied actions remain denied, and the app exposes disconnect handling without claiming that it deletes copied information. If authorized to test revocation, observe a later resource request denied after disconnect; otherwise record that live gate as unverified. Never claim issuer configuration, security review or deployed acceptance from source examples alone.

- [Private Event widget](http://localhost:4173/v2/event-widget)
- [Update a permitted Event](http://localhost:4173/v2/event-updates)
