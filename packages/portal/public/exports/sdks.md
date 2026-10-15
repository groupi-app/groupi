# TypeScript and Python SDK availability

v2 · Upcoming · Source: packages/sdk/README.md

Source availability does not establish hosted deployment or registry publication.

## Source candidates and published packages
Canonical passage: /v2/sdks#availability

The repository contains unpublished TypeScript and Python REST v2 SDK candidates. TypeScript supports Node.js 22 and 24; Python requires 3.11 or later and provides synchronous and asynchronous clients. Publication, hosted API compatibility and additional runtime support require separate release evidence. Use the source package instructions rather than assuming a registry package is available.

## Specific request and response types
Canonical passage: /v2/sdks#strict-types

Named SDK methods derive their inputs and results from the current OpenAPI operation catalog. TypeScript declarations and Python TypedDict models describe known fields, required arguments, literal choices and nullable results. Python includes runtime-importable schema types and py.typed metadata. Source freshness and positive and negative consumer type checks guard the generated contracts. Static types do not validate every response field from an arbitrary server at runtime.

## Read Events with an explicit instance and credential
Canonical passage: /v2/sdks#read-events

Use a server-side owner credential for this legacy API-key example. Keep it out of browser bundles. Iteration follows opaque cursors, including empty pages, and raises an error on malformed or repeated continuations. Use the explicit bounded-key or delegated credential mode when the intended workflow has narrower grants.

```typescript
import { Groupi } from "@groupi/sdk";
const client = new Groupi({
  instance: "https://YOUR-INSTANCE.convex.site",
  credential: { type: "apiKey", key: process.env.GROUPI_API_KEY! },
});
for await (const event of client.iterateEvents({ limit: 20 })) {
  console.log(event.title);
}
```

## Use Python sync or async adapters
Canonical passage: /v2/sdks#python

Groupi is synchronous; AsyncGroupi runs standard-library I/O in a worker thread. Cancelling an await cannot undo a write already sent by that worker. Connected sockets have bounded deadlines, while operating-system DNS resolution can exceed the deadline before a socket exists. The Python package README documents this runtime limit and uncertain-write errors.

```python
from groupi_sdk import Groupi
client = Groupi(instance="https://YOUR-INSTANCE.convex.site", api_key=api_key)
for event in client.iterate_events(limit=20):
    print(event["title"])
```

## Handle uncertainty without duplicate writes
Canonical passage: /v2/sdks#writes

Reads have bounded retries; writes never retry automatically. Errors preserve status and uncertainty. Persist an Event creation replay key and the unchanged body before sending, then deliberately reuse that key after an uncertain response within the server retention window. Inspect state before repeating other writes. Capability checks verify the selected instance; they never substitute a different host or a broader credential.

## Keep delegated tokens bound to the approved client
Canonical passage: /v2/sdks#delegated

DelegatedSession supports the approved native and confidential-web authorization-code profile with S256, state and an explicit issuer, audience, instance and client. Confidential web callers supply their own private-key assertion signer. Background refresh is separately consented and cannot expand access. Restored token state retains these bindings. The API adapter does not treat an unverified identity token as a signed-in user and never opens a browser or falls back to an owner key during an API call. See the SDK source README for the exact exchange and persistence interfaces.
