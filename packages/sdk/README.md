# Groupi TypeScript SDK

An unpublished, dependency-free REST v2 release candidate for Node.js 22/24.
It exposes **251 public operations**: 249 generated named methods and two binary
upload/discard adapters. All 81 source schema types and every generated operation
input/response have specific types. `GroupiError.details` alone is opaque because
it may contain an external exception. Browser owner-key use is rejected.

```ts
import { Groupi } from '@groupi/sdk';
const client = new Groupi({
  instance: 'https://your-instance.convex.site',
  credential: { type: 'apiKey', key: process.env.GROUPI_API_KEY! },
});
for await (const event of client.iterateEvents({ limit: 20 })) {
  console.log(event.title);
}
const created = await client.createEvent(
  { body: { title: 'Dinner' } },
  {
    idempotencyKey: `${Date.now()}.${crypto.randomUUID()}`,
  }
);
```

Use `{type:'boundedApiKey', key}` explicitly for `grp_b_` keys. Such grants retain
current event, action, membership and role restrictions; a method confers no
extra authority. Methods accept the exact declared `{path, query, body}` fields.
`src/index.d.ts` lists their strict signatures. `operations.json` and
`supplemental-operations.json` inventory the generated and binary adapters.

Methods ending in `Items` opt into pagination for their particular documented
page shape. They preserve filters/instance/credential, follow empty pages, reject
cycles and malformed/oversized pages, and yield completed items before a later
failure. The default iteration limit is 10,000 pages. Event pages use
`items/nextCursor`; Group tool history uses `page/isDone/continueCursor`.

Instances are HTTPS origins; loopback HTTP is allowed for isolated tests.
Redirects are refused. Reads retry at most twice on transport failure or
429/502/503/504; automatic Retry-After seconds are bounded to five. Writes never
retry automatically. Persist create replay key and unchanged body before sending;
recover explicitly within the server's 24-hour replay window. Disconnected,
malformed, cancelled or server-5xx writes may have committed and expose
`GroupiError.uncertain=true`. HTTP errors preserve `status`, `code` and `details`.
Use `options.signal` for cancellation. Requests have a 30-second timeout and a
4 MiB response limit. Writes preflight API version and selected capability flags;
use `requireCapability(name, version)` for additional workflow-specific features.

```ts
const attachment = await client.upload(new TextEncoder().encode('Notes'), {
  filename: 'notes.txt',
  mimeType: 'text/plain',
  eventId,
});
await client.createPost({
  path: { id: eventId },
  body: {
    title: 'Notes',
    content: 'Details',
    attachments: [attachment],
  },
});
```

Upload supports 1 byte through 10 MiB and purpose `attachment`, `avatar` or
`cover`. Bounded/delegated uploads require their granted event and attachment
purpose. `inspectUpload` reads an authorized descriptor; `discardUpload`
discards an unused upload. Uploads grant no event access or content-decryption key.

Approved delegated access has a concrete `DelegatedSession` adapter:

```ts
import { Groupi, DelegatedSession, type DelegatedConfig } from '@groupi/sdk';
const config: DelegatedConfig = {
  instance,
  issuer: `${instance}/oauth`,
  audience: `${instance}/api/v2`,
  clientId,
  clientType: 'native' as const,
  actions: ['events.read'] as const,
};
const request = await DelegatedSession.authorizationRequest(config, {
  redirectUri,
  background: true,
});
// Explicitly open request.url and retain request.state/codeVerifier securely.
const session = await DelegatedSession.fromAuthorizationCode(config, {
  code,
  codeVerifier: request.codeVerifier,
  redirectUri,
  state: callbackState,
  expectedState: request.state,
  background: true,
});
const client = new Groupi({ instance, credential: session.credential() });
```

The adapter pins instance, issuer, API audience and client; generates S256/state/
nonce; exchanges a code once; and renews an expiring opaque API token once with a
rotating refresh token. Concurrent renewal is shared. Narrower initial action
consent is preserved exactly during renewal. Failed/uncertain renewal clears
local state and never falls back to an API key, hosted issuer or popup.
Confidential web clients use `clientType:'confidentialWeb'` with an explicit
`getClientAssertion({tokenEndpoint,clientId,signal})` private_key_jwt signer.
This adapter does not consume unverified ID tokens as identity. Browser refresh
is outside the approved native/confidential profile; browser callers can inject
an independently verified, instance/audience-bound bearer provider explicitly.

Optional `storeTokens` receives `DelegatedState | null`; the application owns
secure storage. `DelegatedSession.restore(config,state)` checks persisted
instance/issuer/audience/client/profile/background bindings before use. TypeScript
expiry timestamps are epoch **milliseconds**. No token is logged or persisted by
default. Ordinary API calls never open consent UI.

`pnpm --filter @groupi/sdk type-check` checks live backend/OpenAPI and generated
contract freshness without changing files, then compiles strict positive/negative
TypeScript consumers and checks Python stubs/consumers with mypy. `test:run`
includes both languages and real authenticated REST/OAuth journeys.
`test:package` installs a local npm tarball and Python wheel into clean temporary
locations and checks actual imports and strict installed-package typing.
`type-audit.json` records the exact source schema SHA-256 and zero-loose-contract
inventory. To regenerate, run `pnpm --filter @groupi/sdk generate`.

Local evidence covers Node 22.23.3 and Python 3.14.7; other declared runtimes need
the CI matrix evidence. This is source-tested candidate evidence, not a deployed
API or published-package claim. Registry ownership and explicit publication
approval remain release prerequisites. Realtime, mobile push and encrypted-event
decryption are excluded; legacy profile data is never an identity-only fallback.

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
See the repository's `docs/red-room-integration-contract.md` for exact bodies,
result shapes, independent read/write authority and deployment gates.
