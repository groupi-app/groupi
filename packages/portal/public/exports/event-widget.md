# Build a private Event widget

v2 · Current · Source: packages/portal/src/learning-content.ts
Canonical document: http://localhost:4173/v2/event-widget.md
Public contract baseline: ec33a44dce0ba9be828c3d8916d768ae81060a8c · verified 2026-10-30

Source availability does not establish hosted deployment or registry publication.

## Table of Contents

- [Finished private widget — simulated](#outcome)
- [1. Connect locally, not in the browser](#connect)
- [2. Retrieve only the Event you need](#retrieve)
- [Private widget TypeScript complete example](#widget-typescript)
- [Private widget Python complete example](#widget-python)
- [Private widget cURL complete example](#widget-curl)
- [3. Render four visible states](#display)
- [4. Keep your Event widget private](#privacy)
- [Check your private result](#done)

<a id="outcome"></a>
## Finished private widget — simulated
Canonical passage: http://localhost:4173/v2/event-widget#outcome

My first Groupi Event · Date not set · Open in Groupi. The finished preview above/below uses fixture data only. Your goal is the same small card in your existing framework, backed by a permitted Event read in a private local context. This is not a public website feed and not a realtime subscription. REST v2; source baseline ec33a44dce0ba9be828c3d8916d768ae81060a8c inspected 2026-10-30. Source support only. Deployment, issuer configuration and package registry availability are separately unverified. No SDK installation is required by these direct HTTP examples.

<a id="connect"></a>
## 1. Connect locally, not in the browser
Canonical passage: http://localhost:4173/v2/event-widget#connect

Prerequisites: an existing Event you may read, its ID, matching API and website origins, and one local runtime from the first Event lesson. Use the same identity-verified own-account local configuration for the examples below; GROUPI_ALLOW_CREATE is not needed because they only read. A separately designed bounded reader needs events.read and selected Event authority; do not reuse the legacy /profile preflight for a delegated token. Keep the key in the local process, never the browser bundle. Any development service must be loopback-only (127.0.0.1 or ::1), with no public tunnel, host binding, public cache or hosted proxy.

- [Local instance and account setup](http://localhost:4173/v2/integrator#run-locally)
- [Delegated identity branch](http://localhost:4173/v2/connect-users)

<a id="retrieve"></a>
## 2. Retrieve only the Event you need
Canonical passage: http://localhost:4173/v2/event-widget#retrieve

Optionally set GROUPI_EVENT_ID locally, then GET /events/{eventId}. The direct response has id, title and nullable chosenDateTime; it is not {event:{…}}. Keep only the display fields. A successful empty list means no selected Event to display, not a failed connection. A denied single-Event request is an error, not an empty result. Leave GROUPI_EVENT_ID unset to follow opaque cursors until the first accessible Event, or explicit empty success only when nextCursor is null. An empty intermediate page is not an empty result. Each complete example starts a loopback-only local HTTP service; cURL performs the upstream requests with Python providing the local display server.

```sh
export GROUPI_EVENT_ID="YOUR_PERMITTED_EVENT_ID"
# Run exactly one local example below after setting the verified instance/account variables.
# Expected local projection, illustrative only:
# {"id":"EVENT_ID","title":"My first Groupi Event","chosenDateTime":null}
```

- [REST v2 exact schemas and operations](http://localhost:4173/v2/reference/api)
- [Download REST v2 OpenAPI](http://localhost:4173/exports/openapi-v2.json)

<a id="widget-typescript"></a>
## Private widget TypeScript complete example
Canonical passage: http://localhost:4173/v2/event-widget#widget-typescript

Complete local read-only widget. Use the first Event setup variables, but GROUPI_ALLOW_CREATE is not used. Save and run the matching script; open its printed http://127.0.0.1:PORT/ URL on this computer. The API key stays in the local server process, never in browser code. Ctrl-C stops the server. Never forward the port.

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

const html = "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width\"><title>Private Groupi widget</title>\n<h1>Private local Event preview</h1><p>Only on this computer. Manual refresh, not realtime. Do not publish.</p>\n<button id=\"refresh\">Refresh</button><section aria-busy=\"true\"><p id=\"status\" role=\"status\">Loading…</p><h2 id=\"title\"></h2><p id=\"date\"></p><a id=\"open\" hidden>Open in Groupi</a></section>\n<script>\nconst status = document.getElementById('status'), title = document.getElementById('title'), date = document.getElementById('date'), link = document.getElementById('open'), button = document.getElementById('refresh'), section = document.querySelector('section');\nasync function refresh() {\n  button.disabled = true; section.setAttribute('aria-busy', 'true'); status.setAttribute('role', 'status'); status.textContent = 'Loading…'; title.textContent = ''; date.textContent = ''; link.hidden = true;\n  try {\n    const response = await fetch('/data', {cache: 'no-store', redirect: 'error'});\n    if (!response.ok) throw new Error('Request failed');\n    const data = await response.json();\n    if (!data.event) { status.textContent = 'No accessible Events to display.'; return; }\n    status.textContent = 'Loaded private Event'; title.textContent = data.event.title;\n    date.textContent = data.event.chosenDateTime === null ? 'Date not set' : new Date(data.event.chosenDateTime).toLocaleString();\n    const url = new URL(data.url); if (url.protocol !== 'https:') throw new Error('Invalid link');\n    link.href = url.href; link.hidden = false; link.rel = 'noreferrer';\n  } catch { status.setAttribute('role', 'alert'); status.textContent = 'Unable to load Event. Check local setup and access, then Refresh.'; }\n  finally { button.disabled = false; section.setAttribute('aria-busy', 'false'); }\n}\nbutton.addEventListener('click', refresh); refresh();\n</script></html>";

const { createServer } = await import('node:http');
const server = createServer(async (req, res) => {
  const address = server.address(); if (!address || typeof address === 'string') return;
  const host = '127.0.0.1:' + address.port, origin = 'http://' + host;
  if (req.method !== 'GET' || req.headers.host !== host || (req.headers.origin && req.headers.origin !== origin) || !['same-origin', 'none'].includes(String(req.headers['sec-fetch-site'] ?? 'same-origin'))) { res.writeHead(403); res.end(); return; }
  const headers = {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'"};
  if (req.url === '/') { res.writeHead(200, {...headers, 'Content-Type':'text/html; charset=utf-8'}); res.end(html); return; }
  if (req.url !== '/data') { res.writeHead(404, headers); res.end(); return; }
  try {
    if ((await request('/profile')).personId !== personId) throw new Error('Wrong account');
    let eventId = env.GROUPI_EVENT_ID;
    if (!eventId) {
      let cursor: string | null = null;
      const seen = new Set<string>();
      do {
        const query = new URLSearchParams({pagination:'cursor', limit:'20'});
        if (cursor) query.set('cursor', cursor);
        const page = await request('/events?' + query);
        if (page.items.length) { eventId = page.items[0].id; break; }
        cursor = page.nextCursor;
        if (cursor !== null) { if (seen.has(cursor)) throw new Error('Repeated cursor'); seen.add(cursor); }
      } while (cursor !== null);
    }
    const event = eventId ? await request('/events/' + encodeURIComponent(eventId)) : null;
    const data = event ? {event: {id:event.id, title:event.title, chosenDateTime:event.chosenDateTime}, url:web+'/event/'+encodeURIComponent(event.id)} : {event:null};
    res.writeHead(200, {...headers, 'Content-Type':'application/json'}); res.end(JSON.stringify(data));
  } catch { res.writeHead(502, {...headers, 'Content-Type':'application/json'}); res.end(JSON.stringify({error:'Unable to retrieve Event; check local setup and access.'})); }
});
server.listen(0, '127.0.0.1', () => {
  const address = server.address(); if (address && typeof address !== 'string') console.log('http://127.0.0.1:' + address.port + '/');
});
// Save as private-widget.mts, run node private-widget.mts. Open printed URL locally.
// Ctrl-C stops the server. Never forward this port or publish this private feed.

```

<a id="widget-python"></a>
## Private widget Python complete example
Canonical passage: http://localhost:4173/v2/event-widget#widget-python

Complete local read-only widget. Use the first Event setup variables, but GROUPI_ALLOW_CREATE is not used. Save and run the matching script; open its printed http://127.0.0.1:PORT/ URL on this computer. The API key stays in the local server process, never in browser code. Ctrl-C stops the server. Never forward the port.

```python
# Python 3.10+; save as private-widget.py; run python3 private-widget.py.
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
html = "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width\"><title>Private Groupi widget</title>\n<h1>Private local Event preview</h1><p>Only on this computer. Manual refresh, not realtime. Do not publish.</p>\n<button id=\"refresh\">Refresh</button><section aria-busy=\"true\"><p id=\"status\" role=\"status\">Loading…</p><h2 id=\"title\"></h2><p id=\"date\"></p><a id=\"open\" hidden>Open in Groupi</a></section>\n<script>\nconst status = document.getElementById('status'), title = document.getElementById('title'), date = document.getElementById('date'), link = document.getElementById('open'), button = document.getElementById('refresh'), section = document.querySelector('section');\nasync function refresh() {\n  button.disabled = true; section.setAttribute('aria-busy', 'true'); status.setAttribute('role', 'status'); status.textContent = 'Loading…'; title.textContent = ''; date.textContent = ''; link.hidden = true;\n  try {\n    const response = await fetch('/data', {cache: 'no-store', redirect: 'error'});\n    if (!response.ok) throw new Error('Request failed');\n    const data = await response.json();\n    if (!data.event) { status.textContent = 'No accessible Events to display.'; return; }\n    status.textContent = 'Loaded private Event'; title.textContent = data.event.title;\n    date.textContent = data.event.chosenDateTime === null ? 'Date not set' : new Date(data.event.chosenDateTime).toLocaleString();\n    const url = new URL(data.url); if (url.protocol !== 'https:') throw new Error('Invalid link');\n    link.href = url.href; link.hidden = false; link.rel = 'noreferrer';\n  } catch { status.setAttribute('role', 'alert'); status.textContent = 'Unable to load Event. Check local setup and access, then Refresh.'; }\n  finally { button.disabled = false; section.setAttribute('aria-busy', 'false'); }\n}\nbutton.addEventListener('click', refresh); refresh();\n</script></html>"
import http.server
class Widget(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args): pass  # Do not log private paths/data.
    def do_GET(self):
        origin = 'http://127.0.0.1:' + str(self.server.server_port)
        if self.headers.get('Host') != origin.removeprefix('http://') or self.headers.get('Sec-Fetch-Site', 'same-origin') not in ('same-origin', 'none') or self.headers.get('Origin', origin) != origin:
            self.send_error(403); return
        status, content_type = 200, 'text/html; charset=utf-8'
        if self.path == '/': body = html.encode()
        elif self.path == '/data':
            content_type = 'application/json'
            try:
                if request('GET', '/profile').get('personId') != expected: raise ValueError('Wrong account')
                event_id = os.environ.get('GROUPI_EVENT_ID')
                if not event_id:
                    cursor, seen = None, set()
                    while True:
                        query = urllib.parse.urlencode(dict(pagination='cursor', limit=20, **({'cursor':cursor} if cursor else {})))
                        page = request('GET', '/events?' + query)
                        if page['items']:
                            event_id = page['items'][0]['id']; break
                        cursor = page['nextCursor']
                        if cursor is None: break
                        if cursor in seen: raise ValueError('Repeated cursor')
                        seen.add(cursor)
                event = request('GET', '/events/' + urllib.parse.quote(event_id, safe='')) if event_id else None
                data = dict(event=None) if event is None else dict(event={name:event[name] for name in ('id','title','chosenDateTime')}, url=web+'/event/'+urllib.parse.quote(event['id'], safe=''))
                body = json.dumps(data).encode()
            except (Exception, SystemExit):
                status, body = 502, b'{"error":"Unable to retrieve Event; check local setup and access."}'
        else: self.send_error(404); return
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'")
        self.send_header('Content-Length', str(len(body)))
        self.end_headers(); self.wfile.write(body)
server = http.server.HTTPServer(('127.0.0.1', 0), Widget)
print('http://127.0.0.1:' + str(server.server_port) + '/', flush=True)
server.serve_forever()  # Open printed URL locally. Ctrl-C stops; never forward this port.

```

<a id="widget-curl"></a>
## Private widget cURL complete example
Canonical passage: http://localhost:4173/v2/event-widget#widget-curl

Complete local read-only widget. Use the first Event setup variables, but GROUPI_ALLOW_CREATE is not used. Save and run the matching script; open its printed http://127.0.0.1:PORT/ URL on this computer. The API key stays in the local server process, never in browser code. Ctrl-C stops the server. Never forward the port.

```sh
# Bash, Python 3.10+ (local HTTP server), curl 7.76+ (all Groupi requests).
# Save as private-widget.sh; run bash private-widget.sh.
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
html = "<!doctype html><html lang=\"en\"><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width\"><title>Private Groupi widget</title>\n<h1>Private local Event preview</h1><p>Only on this computer. Manual refresh, not realtime. Do not publish.</p>\n<button id=\"refresh\">Refresh</button><section aria-busy=\"true\"><p id=\"status\" role=\"status\">Loading…</p><h2 id=\"title\"></h2><p id=\"date\"></p><a id=\"open\" hidden>Open in Groupi</a></section>\n<script>\nconst status = document.getElementById('status'), title = document.getElementById('title'), date = document.getElementById('date'), link = document.getElementById('open'), button = document.getElementById('refresh'), section = document.querySelector('section');\nasync function refresh() {\n  button.disabled = true; section.setAttribute('aria-busy', 'true'); status.setAttribute('role', 'status'); status.textContent = 'Loading…'; title.textContent = ''; date.textContent = ''; link.hidden = true;\n  try {\n    const response = await fetch('/data', {cache: 'no-store', redirect: 'error'});\n    if (!response.ok) throw new Error('Request failed');\n    const data = await response.json();\n    if (!data.event) { status.textContent = 'No accessible Events to display.'; return; }\n    status.textContent = 'Loaded private Event'; title.textContent = data.event.title;\n    date.textContent = data.event.chosenDateTime === null ? 'Date not set' : new Date(data.event.chosenDateTime).toLocaleString();\n    const url = new URL(data.url); if (url.protocol !== 'https:') throw new Error('Invalid link');\n    link.href = url.href; link.hidden = false; link.rel = 'noreferrer';\n  } catch { status.setAttribute('role', 'alert'); status.textContent = 'Unable to load Event. Check local setup and access, then Refresh.'; }\n  finally { button.disabled = false; section.setAttribute('aria-busy', 'false'); }\n}\nbutton.addEventListener('click', refresh); refresh();\n</script></html>"
import http.server
class Widget(http.server.BaseHTTPRequestHandler):
    def log_message(self, *args): pass  # Do not log private paths/data.
    def do_GET(self):
        origin = 'http://127.0.0.1:' + str(self.server.server_port)
        if self.headers.get('Host') != origin.removeprefix('http://') or self.headers.get('Sec-Fetch-Site', 'same-origin') not in ('same-origin', 'none') or self.headers.get('Origin', origin) != origin:
            self.send_error(403); return
        status, content_type = 200, 'text/html; charset=utf-8'
        if self.path == '/': body = html.encode()
        elif self.path == '/data':
            content_type = 'application/json'
            try:
                if request('GET', '/profile').get('personId') != expected: raise ValueError('Wrong account')
                event_id = os.environ.get('GROUPI_EVENT_ID')
                if not event_id:
                    cursor, seen = None, set()
                    while True:
                        query = urllib.parse.urlencode(dict(pagination='cursor', limit=20, **({'cursor':cursor} if cursor else {})))
                        page = request('GET', '/events?' + query)
                        if page['items']:
                            event_id = page['items'][0]['id']; break
                        cursor = page['nextCursor']
                        if cursor is None: break
                        if cursor in seen: raise ValueError('Repeated cursor')
                        seen.add(cursor)
                event = request('GET', '/events/' + urllib.parse.quote(event_id, safe='')) if event_id else None
                data = dict(event=None) if event is None else dict(event={name:event[name] for name in ('id','title','chosenDateTime')}, url=web+'/event/'+urllib.parse.quote(event['id'], safe=''))
                body = json.dumps(data).encode()
            except (Exception, SystemExit):
                status, body = 502, b'{"error":"Unable to retrieve Event; check local setup and access."}'
        else: self.send_error(404); return
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'")
        self.send_header('Content-Length', str(len(body)))
        self.end_headers(); self.wfile.write(body)
server = http.server.HTTPServer(('127.0.0.1', 0), Widget)
print('http://127.0.0.1:' + str(server.server_port) + '/', flush=True)
server.serve_forever()  # Open printed URL locally. Ctrl-C stops; never forward this port.
PY

```

<a id="display"></a>
## 3. Render four visible states
Canonical passage: http://localhost:4173/v2/event-widget#display

Loading: announce that the private Event is being retrieved. Empty: show “No Event selected” for an empty successful collection. Success: display the title, “Date not set” for null, and the matching website /event/{encodedId} link. Error: show a safe failure and an explicit retry action; do not show stale private data after a denied read. Insert title as text, never raw HTML. The complete examples above serve this working display without a framework. Use Refresh for each new read. Adapt it to your preferred framework without changing the secret boundary; changing TypeScript/Python/cURL changes only the local transport.

<a id="privacy"></a>
## 4. Keep your Event widget private
Canonical passage: http://localhost:4173/v2/event-widget#privacy

Your read access is not permission to republish Event data. Keep the local output and preview private; do not put it in static public files, browser storage, a public feed or a shared log. Public publishing needs a separate design, explicit permission and appropriate data/authorization boundaries. Refresh is an explicit read, not a realtime guarantee. Never add a public proxy holding an owner key.

<a id="done"></a>
## Check your private result
Canonical passage: http://localhost:4173/v2/event-widget#done

Done: the permitted title and date state match read-back; the Open in Groupi destination uses the matching website; loading, empty, success and error are visible and distinguishable; real credentials are absent from browser code and public assets. On 401/403 or lost access clear the private card and stop; recheck the intended instance, account and permission without escalating credentials. No write recovery is needed because this lesson only reads. Report fixture versus verified results honestly.

- [Group Events recipe](http://localhost:4173/v2/group-events)
- [Event updates recipe](http://localhost:4173/v2/event-updates)
- [Build with an agent — Markdown](http://localhost:4173/agents.md)
