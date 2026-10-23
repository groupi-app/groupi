# Groupi Python SDK

Unpublished dependency-free Python >=3.11 REST v2 candidate. It covers 238 public
operations: 249 generated named methods plus binary upload/discard. Runtime
TypedDict models, `.pyi` declarations and `py.typed` preserve required keys, enums,
nullable values, composed schemas and typed pagination. All generated resource
contracts have specific known types; external error details remain opaque.

```python
from groupi_sdk import Groupi
from groupi_sdk.client import CreateEventRequest
client = Groupi(instance=instance, api_key=api_key)
for event in client.iterate_events(limit=20):
    print(event['title'])
body: CreateEventRequest = {'title': 'Dinner'}
created = client.create_event(body=body, idempotency_key=replay_key)
```

Select `bounded_api_key=...` explicitly for `grp_b_` keys. Select exactly one of
`api_key`, `bounded_api_key`, or `token_provider` plus explicit `audience`.
Methods use the exact declared `path`, `query`, `body`, and `idempotency_key`
keywords. Methods ending in `_items` iterate their documented cursor envelope,
following empty pages and preserving completed items when a later page fails.

`Groupi` is synchronous; `AsyncGroupi` exposes typed async operations and async
iterators using `asyncio.to_thread`. Cancellation cannot interrupt OS DNS
resolution before a socket exists. A connected-socket deadline stops slow peers;
async writes raise `GroupiCancelledError` (an `asyncio.CancelledError` with
`uncertain=True`) when the worker may still commit. Default connected request
bounds are 30 seconds and 4 MiB; iteration defaults to 10,000 pages.

HTTPS is required outside loopback; redirects are refused. Reads retry at most
twice for transport failure or 429/502/503/504, with automatic Retry-After seconds
bounded to five. Writes never retry. Preserve replay key (`<unix-ms>.<uuid-v4>`)
and unchanged create payload before sending and recover explicitly within the
server's 24-hour retention. Errors preserve `status`, `code`, `details`, and
uncertain-write outcomes. Writes check API version and selected capabilities;
use `require_capability` for additional workflow-specific checks.

```python
attachment = client.upload(b'Notes', filename='notes.txt',
                           mime_type='text/plain', event_id=event_id)
client.create_post(path={'id': event_id}, body={
    'title': 'Notes', 'content': 'Details', 'attachments': [attachment]})
```

Uploads support 1 byte through 10 MiB. Bounded/delegated uploads require their
granted event and attachment purpose. `inspect_upload` reads a permitted
metadata descriptor; `discard_upload` discards an unused upload. Neither grants
new membership or content-decryption authority.

Concrete delegated access uses the approved native/confidential profile:

```python
from groupi_sdk import DelegatedSession, Groupi
session = DelegatedSession(instance=instance, issuer=instance+'/oauth',
    audience=instance+'/api/v2', client_id=client_id, actions=['events.read'])
request = session.authorization_request(redirect_uri=redirect_uri, background=True)
# Explicitly open request['url']; retain state and verifier securely.
session.exchange_authorization_code(code=code,
    code_verifier=request['code_verifier'], redirect_uri=redirect_uri,
    state=callback_state, expected_state=request['state'], background=True)
client = Groupi(instance=instance, audience=instance+'/api/v2',
               token_provider=session.get_token)
```

The adapter pins instance/issuer/audience/client; generates S256/state/nonce;
exchanges a code once; and performs serialized rotating renewal preserving the
exact accepted API actions. It never requests wider scope during refresh.
Confidential clients select `client_type='confidentialWeb'` and provide a
`get_client_assertion(token_endpoint=...,client_id=...)` private_key_jwt signer.
No unverified ID token is treated as identity, and no API call opens a browser.
There is no browser-refresh or hosted/API-key fallback.

Optional `store_tokens` receives a bound state or `None`. Applications own
secure storage. `DelegatedSession.restore(state=..., **config)` validates stored
instance/issuer/audience/client/profile/background binding. Python expiry values
are epoch **seconds**, unlike TypeScript milliseconds. Tokens stay in memory
unless an application explicitly supplies storage. An independently verified
external bearer provider remains supported through `token_provider`.

The sibling SDK's `type-check`, `test:run` and `test:package` commands include
Python strict mypy positive/negative consumers, real REST/OAuth journeys, and
clean wheel installation with runtime model imports and `py.typed` inspection.
Local observed runtime is Python 3.14.7; the declared >=3.11 matrix needs CI
results. Source evidence is not deployed API or published-package evidence.
Registry ownership and publication approval remain release prerequisites.
Realtime, encrypted-event decryption and per-instance mobile push are excluded.

### Selected Group participation (G5 source candidate)

Request only necessary `groups.events.join`, `groups.events.rsvp`,
`groups.events.leave` and `groups.leave` scopes with the selected Group grant.
Read scope is separate. Join sends `{}` and creates Pending, never Yes; explicitly
set own RSVP with the observed current-event `expectedRevision`. Event Leave also
sends `{expectedRevision}`. Group Leave sends `{expectedMembershipId}` from own
community context and preserves independent Event membership and RSVP.

Persist a UUID operation ID and unchanged payload for each deliberate intent before
sending. A lost response is uncertain: retry that original intent to retrieve its
minimal committed receipt, including after successful leave removed membership.
Replay never deletes a replacement membership or resets a later RSVP. Fresh stale
forms fail; refresh authorized current state before a new intent. Receipts describe
original commitment; use separately authorized reads for current state. Shared G3/G5
receipts last 30 days with permanent mismatch tombstones. Ownership/last-Organizer
conflicts require resolution; never display successful departure for those errors.
See the repository's `docs/community-integration-contract.md` for exact bodies,
result shapes, independent read/write authority and deployment gates.
