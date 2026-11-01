# Realtime and API/SDK evolution

The maintainer selected this architecture and authorized recommended design
defaults on 15 October 2026. This is a future contract and implementation outline,
not a claim that these packages, endpoints or capabilities are available.

## Table of Contents

- [Current availability](#current-availability)
- [Selected architecture](#selected-architecture)
- [Convex realtime subscriptions](#convex-realtime-subscriptions)
- [Live views and durable change records](#live-views-and-durable-change-records)
- [Initial resource views and permissions](#initial-resource-views-and-permissions)
- [Optional modules and runtimes](#optional-modules-and-runtimes)
- [Typed subscription interface](#typed-subscription-interface)
- [Live windows and pagination](#live-windows-and-pagination)
- [Connection status and stale data](#connection-status-and-stale-data)
- [Reconnection and cancellation](#reconnection-and-cancellation)
- [Subscription credentials](#subscription-credentials)
- [Browser authentication](#browser-authentication)
- [Current authority and revocation](#current-authority-and-revocation)
- [Time-based expiry](#time-based-expiry)
- [Runtime response validation](#runtime-response-validation)
- [Compatibility and discovery](#compatibility-and-discovery)
- [Write replay and recovery](#write-replay-and-recovery)
- [Separate durable delivery](#separate-durable-delivery)
- [Change ordering and cursors](#change-ordering-and-cursors)
- [Retention and recovery gaps](#retention-and-recovery-gaps)
- [Historical access and deletion](#historical-access-and-deletion)
- [Signed webhooks](#signed-webhooks)
- [Webhook destination security](#webhook-destination-security)
- [Authorization breadth and bulk work](#authorization-breadth-and-bulk-work)
- [Delivery phases and evidence](#delivery-phases-and-evidence)
- [Source references](#source-references)

## Current availability

The unpublished REST v2 SDK candidates cover the operations recorded in
`packages/sdk/type-audit.json` with specific
TypeScript declarations and Python TypedDict models, bounded retries, pagination
and delegated sessions. Realtime modules, subscription credential exchange,
durable change feeds, general integration webhooks and complete runtime response
validation are not implemented. Static types and runtime-importable Python models
do not validate arbitrary server responses. Planned browser support does not
change today's Node-only TypeScript SDK support or delegated-client profiles.

## Selected architecture

Keep the REST core dependency-free and provide optional SDK modules backed by
Convex subscriptions. Groupi owns versioned public views and types; consumers
do not import private application function paths. Durable delivery has a separate
contract. ADR-0007 records this direction. CLI/TUI transport continues under
ADR-0001; adopting subscriptions there requires its own decision.
The maintainer selected this direction and recommended design defaults on
15 October 2026; the following sections describe those planned contracts.

## Convex realtime subscriptions

A reactive client subscribes to a query over a WebSocket. Convex tracks its
database dependencies and updates the result when relevant writes commit,
keeping a client's subscriptions consistent with a database snapshot. Changes
through REST, web or mobile can update the same view. Ordinary REST requests
remain point-in-time reads. Public queries need focused indexes, bounded joins
and small projections to control invalidation work and payload size.

## Live views and durable change records

A live resource view presents the latest permitted state, such as an attendee
list. Intermediate states may be coalesced; reconnect retrieves current state.
A change record describes an occurrence such as an RSVP change. Durable consumers
need ordering, retention and replay after downtime. Live revisions, durable feed
cursors and REST pagination cursors are distinct. A Groupi Event is the gathering;
a change record is an occurrence about a resource.

## Initial resource views and permissions

Initially target authorized Event summary/detail, attendee/RSVP views, posts and
replies. Require events.read, members.read or discussion.read respectively;
attachments additionally require files.read. Attendee fields follow the current
Event visibility policy: public projection means permitted to this caller, not
anonymous access. Private RSVP notes, attendee email and unrelated profile fields
remain excluded. RSVP viewing does not grant RSVP mutation. Group, invitation
and add-on streams follow separately defined actions and grants.

## Optional modules and runtimes

Target Node.js 22/24, Python 3.11 or later and browser TypeScript ES modules.
Working package names are @groupi/sdk-realtime and groupi-sdk[realtime]; neither
is available to install yet. Convex/WebSocket dependencies belong only to optional
modules and must not load with REST-core imports. Python consumption is async.
Framework hooks are separate adapters. React Native/Expo and other native clients
follow after lifecycle, backgrounding, callback and secure-storage verification.
Actual supported versions require release-matrix evidence.

## Typed subscription interface

Provide named typed resource watches, snapshots, discriminated connection states,
an error channel and explicit unsubscribe. Python also provides async iteration
and context-managed cleanup. Snapshots include contract version, opaque view
revision and freshness metadata. Revision equality supports deduplication within
a view; it is not a global transaction timestamp or replay cursor. This example
illustrates the intended interface only and is not executable today.

```typescript
// Proposed interface; unavailable in the current SDK.
const watch = realtime.watchEvent(
  { eventId },
  {
    onSnapshot: snapshot => renderEvent(snapshot.value, snapshot.status),
    onError: error => showConnectionProblem(error),
  }
);
// When the owning screen or task is disposed:
watch.unsubscribe();
```

## Live windows and pagination

Initial design limits are 20 items by default, 100 maximum per live list window,
4 MiB per decoded message and 20 distinct watches per client context. Servers
advertise and enforce their limits; these defaults are not measured capacity
guarantees. Share identical watches only within the same instance, credential,
contract and query context. Historical pages use REST pagination. Merging them
with a changing live window requires ID-based deduplication and refresh and does
not promise an immutable snapshot or gap-free history across pages.

## Connection status and stale data

Expose connecting, live, reconnecting, closed and error states. Retain the last
snapshot during transient transport loss, explicitly marked stale with its last
observation time. Authorization denial stops the affected watch and invalidates
inaccessible SDK-held data. Reduced field grants remove those fields from an
otherwise permitted view. Identity or instance switches clear their subscription
context. Applications may already hold copies that the SDK cannot erase.

## Reconnection and cancellation

Use exponential backoff with jitter, capped at 30 seconds between reconnect
attempts. Reauthorize and fetch a fresh snapshot before reporting live. Auth,
contract and permission failures are explicit errors, not reasons to change host,
widen credentials or open consent UI. Unsubscribe, AbortSignal and Python context
exit/cancellation stop future callbacks and release owned watches. Reconnection
does not replay missed changes.

## Subscription credentials

Exchange a supported bounded key or delegated REST access token through an
authenticated endpoint for a separate read-only realtime JWT. Reject legacy
collection/owner keys for exchange. Maximum lifetime is five minutes, capped by
source credential and grant expiry. Pin issuer, instance, deployment, dedicated
audience and contract version; reference an opaque principal/session. Permission
is the intersection of issued bounds and live authority. Raw source secrets
never enter query arguments, URLs or logs. JWTs cannot renew themselves or grant
writes; ordinary native app functions must reject realtime identities.

## Browser authentication

Use a confidential web application's backend to retain refresh credentials and
signing keys and exchange current authorization for ephemeral realtime JWTs.
The browser obtains them through its own authenticated backend and holds them
in memory. It receives no owner key, bounded service key, confidential key or
refresh token. This permits browser consumption without browser-only OAuth
refresh; that public-client profile remains a separately reviewed extension.
Server SDKs exchange credentials from their secure server context. Ordinary
watches never trigger interactive sign-in.

## Current authority and revocation

Each allowlisted query reads its exchange/session record and relevant credential,
grant, app, account, membership and policy records so changes invalidate the view.
Derive resource parents server-side. A signature does not freeze permission until
expiry, and capabilities never confer authority. Use a separate Convex client
per instance/credential context. Revocation denies subsequent authorized
evaluations in committed transaction order; buffered, delivered or copied data
cannot be recalled. Unrelated authorized watches can remain live.

## Time-based expiry

Wall-clock passage alone does not rerun a Convex query. A time check in a cached
query, client heartbeat or client-supplied now value cannot be the security
boundary. Server/transport checks must reject new protected results after expiry;
JWT expiry cannot exceed source expiry. Scheduled server-record invalidation is
defense in depth without exact timing promises. Clients renew through a valid
source credential. At JWT expiry, invalidate its held result even if renewal is
pending; resume only after authenticated confirmation. An
idle disconnected client may retain earlier data; expiry is not remote erasure.

## Runtime response validation

Generate dependency-free validators from the same versioned contracts as SDK
types. Validate REST successes, subscription snapshots and supported error/page
envelopes by default. Check required fields, known types, nullability, variants
and enums; tolerate additive object fields and expose the declared typed resource
projection. Incompatible responses raise typed INVALID_RESPONSE errors. Preserve
uncertain-write classification if the server may have committed first. Reject
incompatible snapshots before callbacks receive them, without silently changing
contracts.

## Compatibility and discovery

Negotiate versioned subscription contracts and advertised resources before
connecting. Unsupported instances produce typed compatibility errors without
silent polling or host fallback. Cache successful REST version/capability
discovery in memory for 60 seconds by canonical instance/API major, share in-flight
work, offer explicit refresh and invalidate incompatible responses. Never cache
permission decisions or permanently cache failures. Additive fields are compatible;
removals, changed types and unknown closed-enum values require explicit version
or compatibility handling.

## Write replay and recovery

Retain bounded read retries and no automatic write retries. Advertise replay
support, retention and key requirements per operation; accepting Idempotency-Key
does not make arbitrary writes replay-safe. Recover supported uncertain creates
using the persisted identical key/body within retention, with current permissions
governing recovery responses. Inspect other writes only where an authorized read
can establish the outcome; otherwise retain uncertainty. Live observations are
not acknowledgements that a particular write committed exactly once.

## Separate durable delivery

Use a transactional outbox and authenticated REST cursor pull for durable
recovery. Signed HTTPS webhooks adapt the same records. Initial families target
Event changed, RSVP changed and post/reply created/changed/deleted. Record
changes in the same domain-owned transaction as their effects, using stable change
IDs, resource IDs, type/schema version and minimal metadata. Avoid copied private
discussion/profile bodies by default. This independently gated phase is separate
from initial live views.

## Change ordering and cursors

Use immutable unique change IDs and monotonic sequence numbers within each parent
Event stream. Consumers tolerate duplicates and deduplicate by change ID; there
is no global or webhook arrival ordering guarantee. Pull retrieves eligible retained
records in stream order. Bind opaque cursors to instance, grant, filters and schema
version. Initial pull is scoped to one Event stream; multi-Event merge ordering
and cursors are deferred. Publish continuation only after fully scanning a page. Empty pages may
continue. Consumers persist progress after durable processing, not receipt. There
is no exactly-once delivery promise.

## Retention and recovery gaps

The initial retention target is seven days with explicit retention floor and
high-water mark. Replay/delivery remains subject to retention and current authority.
Expired cursors return HTTP 410 with CURSOR_EXPIRED and resynchronization guidance;
never silently jump ahead. A fresh snapshot recovers present state, not lost
business history. Consumers that require every occurrence must alert and reconcile
gaps. Live revisions and reconnects do not extend durable retention.

## Historical access and deletion

Check authority during selection, replay and dispatch. History requires eligibility
at occurrence and current authority; new grants do not automatically expose old
private changes. Retain enough eligibility evidence to prove access or deny records
whose eligibility is unproven. Event deletion removes current Event authority;
prior eligibility alone does not authorize subsequent external replay or dispatch.
Event-deleted records may be retained internally, but external delivery is deferred
until a separate deletion-only authorization contract is approved. Post/reply
deletion may produce minimal tombstones while the parent Event exists and current
authority remains valid. Revocation stops future dispatch/replay. Authorized
refetch returns current state; inaccessible or deleted resources use a
non-enumerating response and never imply access to historical bodies.

## Signed webhooks

Use HTTPS and HMAC verification over raw body and timestamp, stable delivery/change
IDs and rotating secrets. Retry with jitter for up to 24 hours, bounded by retention
and current eligibility, and expose exhausted-delivery status. Successful 2xx
acknowledges delivery; consumers persist before acknowledging and tolerate retries.
Manual replay preserves original change IDs. Publish versioned envelopes and
verification helpers. Existing notification webhooks and add-on actions are not
this general delivery API.

## Webhook destination security

Verify destination ownership, require HTTPS and refuse redirects. Validate all
resolved IPv4/IPv6 addresses at registration and each connection; deny private,
loopback, link-local and reserved destinations. Pin validated connection addresses
while checking TLS hostname; enforce outbound network controls, timeouts and
payload bounds. Changed destinations require verification again. Private self-hosted
destinations need a separate operator policy outside this initial hosted design.
Signing a delivery does not prevent SSRF.

## Authorization breadth and bulk work

Expand external permissions around concrete Group, invitation and add-on workflows
with explicit actions/resource selectors. SDK coverage does not confer those
permissions, and reads never imply membership or management writes. Account and
platform-admin operations remain separately controlled. General bulk writes are
follow-up work: define per-item outcomes, partial success and recovery first,
without implying an all-or-nothing transaction. Cursor iteration remains the
default for large reads.

## Delivery phases and evidence

First deliver contract-driven runtime validation and compatibility improvements,
then optional live modules, versioned views and the credential bridge. Verify
Node/Python/browser matrices, strict types, dependency isolation, limits, cancellation,
reconnect, context switches, scope reduction and expiry before publication. Prove
idle-expiry behavior followed by data mutations and suspended browser timers.
Independently test durable transaction/replay/gap/duplicate and webhook SSRF behavior.
Group/add-on streams and React Native follow their acceptance gates. Names,
examples and design limits here do not certify release availability. Self-hosting
and encryption remain deferred.

## Source references

Groupi's bounded authorization, delegated sign-in and SDK contracts and
ADR-0001/0003/0006/0007 define existing boundaries. Convex docs establish mechanisms,
not the existence of the proposed Groupi bridge. Pin deployed versions and verify
behavior before claiming release support.

[Convex realtime](https://docs.convex.dev/realtime),
[JavaScript clients](https://docs.convex.dev/client/javascript/overview),
[Python client](https://github.com/get-convex/convex-py),
[Custom JWT providers](https://docs.convex.dev/auth/advanced/custom-jwt),
[Query best practices](https://docs.convex.dev/understanding/best-practices),
[WHATWG SSE](https://html.spec.whatwg.org/multipage/server-sent-events.html),
[SSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).
