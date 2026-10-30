/** Canonical HTTP examples: these strings never execute in the public portal. */
export type LearningLanguage = 'typescript' | 'python' | 'curl';
export const learningDefaults = {
  title: 'My first Groupi Event',
  instanceUrl: 'https://YOUR-INSTANCE.convex.site/api/v2',
  webUrl: 'https://YOUR-APP',
  eventId: 'event_fixture_001',
  requestId: '1793325600000.11111111-1111-4111-8111-111111111111',
};
export function createExamples({
  title,
  requestId,
}: {
  title: string;
  requestId: string;
}): Record<LearningLanguage, string> {
  const body = JSON.stringify({ title });
  const quote = (value: string) => `'${value.replaceAll("'", "'\\''")}'`;
  return {
    typescript: `// HTTP equivalent only. Use the complete local example for identity checks and recovery.\nconst body = ${JSON.stringify(body)};\nconst response = await fetch(process.env.GROUPI_API_URL + '/events', {\n  method: 'POST', redirect: 'error',\n  headers: { 'x-api-key': process.env.GROUPI_API_KEY!, 'Content-Type': 'application/json', 'Idempotency-Key': ${JSON.stringify(requestId)} },\n  body,\n});\nif (!response.ok) throw new Error('HTTP ' + response.status);\nconst { eventId } = await response.json();`,
    python: `# HTTP equivalent only; complete local example retains identity before sending.\nimport json, os, urllib.request\nbody = ${JSON.stringify(body)}\nrequest = urllib.request.Request(os.environ['GROUPI_API_URL'] + '/events',\n    data=body.encode(), method='POST', headers={\n    'x-api-key': os.environ['GROUPI_API_KEY'],\n    'Content-Type': 'application/json', 'Idempotency-Key': ${JSON.stringify(requestId)}})\n# Reject redirects: credentials must remain on the intended instance.\nclass NoRedirect(urllib.request.HTTPRedirectHandler):\n    def redirect_request(self, *args): return None\nwith urllib.request.build_opener(NoRedirect).open(request, timeout=30) as response:\n    event_id = json.load(response)['eventId']`,
    curl: `# HTTP equivalent only; do not use -L or automatically repeat an uncertain write.\ncurl --fail-with-body --max-time 30 "$GROUPI_API_URL/events" \\\n  -H "x-api-key: $GROUPI_API_KEY" -H 'Content-Type: application/json' \\\n  -H ${quote('Idempotency-Key: ' + requestId)} \\\n  --data-binary ${quote(body)}`,
  };
}

const pythonFlow = String.raw`import json, os, pathlib, sys, time, uuid, urllib.parse
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
`;
const pythonRequest = String.raw`import urllib.request
class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args): return None
def request(method, path, body=None, request_id=None):
    headers = {'x-api-key': key, 'Content-Type': 'application/json'}
    if request_id: headers['Idempotency-Key'] = request_id
    req = urllib.request.Request(api + path, data=body.encode() if body else None, headers=headers, method=method)
    with urllib.request.build_opener(NoRedirect).open(req, timeout=30) as response:
        return json.load(response)
`;
const curlRequest = String.raw`import subprocess
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
`;
export const localExamples: Record<LearningLanguage, string> = {
  python:
    '# Python 3.10+ standard library. Save as first-event.py; run python3 first-event.py.\n' +
    pythonRequest +
    pythonFlow,
  curl:
    "# Bash, Python 3.10+ and curl 7.76+. Save as first-event.sh; run bash first-event.sh.\nset -eu\npython3 - <<'PY'\n" +
    curlRequest +
    pythonFlow +
    'PY\n',
  typescript: String.raw`// Node.js 22.18+ or 24; save as first-event.mts, run node first-event.mts. No SDK install.
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
`,
};

// Identical secret-free display for each local transport; no framework required.
const widgetHtml = String.raw`<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width"><title>Private Groupi widget</title>
<h1>Private local Event preview</h1><p>Only on this computer. Manual refresh, not realtime. Do not publish.</p>
<button id="refresh">Refresh</button><section aria-busy="true"><p id="status" role="status">Loading…</p><h2 id="title"></h2><p id="date"></p><a id="open" hidden>Open in Groupi</a></section>
<script>
const status = document.getElementById('status'), title = document.getElementById('title'), date = document.getElementById('date'), link = document.getElementById('open'), button = document.getElementById('refresh'), section = document.querySelector('section');
async function refresh() {
  button.disabled = true; section.setAttribute('aria-busy', 'true'); status.setAttribute('role', 'status'); status.textContent = 'Loading…'; title.textContent = ''; date.textContent = ''; link.hidden = true;
  try {
    const response = await fetch('/data', {cache: 'no-store', redirect: 'error'});
    if (!response.ok) throw new Error('Request failed');
    const data = await response.json();
    if (!data.event) { status.textContent = 'No accessible Events to display.'; return; }
    status.textContent = 'Loaded private Event'; title.textContent = data.event.title;
    date.textContent = data.event.chosenDateTime === null ? 'Date not set' : new Date(data.event.chosenDateTime).toLocaleString();
    const url = new URL(data.url); if (url.protocol !== 'https:') throw new Error('Invalid link');
    link.href = url.href; link.hidden = false; link.rel = 'noreferrer';
  } catch { status.setAttribute('role', 'alert'); status.textContent = 'Unable to load Event. Check local setup and access, then Refresh.'; }
  finally { button.disabled = false; section.setAttribute('aria-busy', 'false'); }
}
button.addEventListener('click', refresh); refresh();
</script></html>`;
const pythonWidget =
  pythonFlow.slice(0, pythonFlow.indexOf("profile = request('GET'")) +
  `html = ${JSON.stringify(widgetHtml)}\n` +
  String.raw`import http.server
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
`;
export const widgetExamples: Record<LearningLanguage, string> = {
  python:
    '# Python 3.10+; save as private-widget.py; run python3 private-widget.py.\n' +
    pythonRequest +
    pythonWidget,
  curl:
    "# Bash, Python 3.10+ (local HTTP server), curl 7.76+ (all Groupi requests).\n# Save as private-widget.sh; run bash private-widget.sh.\nset -eu\npython3 - <<'PY'\n" +
    curlRequest +
    pythonWidget +
    'PY\n',
  typescript:
    localExamples.typescript.slice(
      0,
      localExamples.typescript.indexOf('const profile = await request(')
    ) +
    `\nconst html = ${JSON.stringify(widgetHtml)};\n` +
    String.raw`
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
`,
};

function ownAccountRecipe(
  python: string,
  typescript: string
): Record<LearningLanguage, string> {
  const flow =
    pythonFlow.slice(0, pythonFlow.indexOf("page = request('GET'")) + python;
  return {
    python:
      '# Python 3.10+ standard library; save as recipe.py, run python3 recipe.py.\n' +
      pythonRequest +
      flow,
    curl:
      "# Bash, Python 3.10+, curl 7.76+; save as recipe.sh, run bash recipe.sh.\nset -eu\npython3 - <<'PY'\n" +
      curlRequest +
      flow +
      'PY\n',
    typescript:
      localExamples.typescript.slice(
        0,
        localExamples.typescript.indexOf('const page = await request(')
      ) + typescript,
  };
}
export const groupExamples = ownAccountRecipe(
  String.raw`group_id = os.environ['GROUPI_GROUP_ID']
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
`,
  String.raw`const groupId = required('GROUPI_GROUP_ID');
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
`
);
export const updateExamples = ownAccountRecipe(
  String.raw`event_id = os.environ['GROUPI_EVENT_ID']
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
`,
  String.raw`const eventId = required('GROUPI_EVENT_ID'), title = required('GROUPI_EVENT_TITLE');
if (title.length < 1 || title.length > 200) throw new Error('Title must have 1–200 characters.');
const path = '/events/' + encodeURIComponent(eventId);
await request(path); // This recipe explicitly requires separate read scope.
if (env.GROUPI_ALLOW_UPDATE !== 'yes') throw new Error('Read verified. Authorize exact title change before GROUPI_ALLOW_UPDATE=yes.');
// One PATCH, never automatic retry. No Idempotency-Key guarantee for this operation.
await request(path, 'PATCH', JSON.stringify({title}));
const event = await request(path);
if (event.id !== eventId || event.title !== title) throw new Error('Read-back differs; inspect concurrent changes without retrying.');
console.log('Verified title update:', event.id, event.title);
`
);

// Post-consent resource transport only, deliberately not a sign-in implementation.
const delegatedPython = String.raw`import json, os, urllib.parse
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
`;
export const delegatedReadExamples: Record<LearningLanguage, string> = {
  python:
    '# Post-consent only. Python 3.10+; save delegated-read.py, run python3 delegated-read.py.\n' +
    pythonRequest.replace(
      "'x-api-key': key",
      "'Authorization': 'Bearer ' + key"
    ) +
    delegatedPython,
  curl:
    "# Post-consent only. Bash, Python 3.10+, curl 7.76+; save delegated-read.sh.\nset -eu\npython3 - <<'PY'\n" +
    curlRequest.replace(
      "'x-api-key: ' + key",
      "'Authorization: Bearer ' + key"
    ) +
    delegatedPython +
    'PY\n',
  typescript: String.raw`// Post-consent only. Node.js 22.18+ or 24; save delegated-read.mts, run node delegated-read.mts.
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
`,
};
