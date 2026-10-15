# Delegated sign-in

Groupi's initial delegated profile uses OAuth authorization code, mandatory PKCE
S256 and signed OpenID Connect ID tokens. Each installation is its own issuer.
The implementation uses `oidc-provider` 9.12.2 in a Convex Node action, with
`fetch-to-node` 2.1.0 bridging HTTP requests and domain-owned Convex persistence.
It does not use Better Auth's legacy embedded OIDC provider. Better Auth continues
to authenticate the local account that reviews consent.

This is source implementation documentation, not a deployment or security
certification. No instance configuration, credentials, deployment, independent
security review or physical-device acceptance is implied by the local tests.

## Initial client profile

- Confidential web clients authenticate with `private_key_jwt`. Register a bounded
  inline public JWKS containing distinct RS256 or ES256 signing keys. Private key
  members and remote `jwks_uri` registration are rejected. The app keeps its private
  key; Groupi stores only its public keys.
- Native clients use the system browser, `token_endpoint_auth_method=none` and S256.
  Exact HTTPS callbacks, literal loopback HTTP callbacks (`127.0.0.1` or `::1`) and
  reverse-domain private-use callbacks such as `com.example.calendar:/callback`
  are supported. Private schemes require at least three DNS-style segments, an
  absolute non-root path and no authority form. Reverse-domain naming is a syntax
  convention, not proof of ownership. Claimed HTTPS association and OS URI dispatch
  remain the native app's responsibility.
- Confidential callbacks require HTTPS. All registrations reject wildcards,
  fragments, userinfo and malformed callbacks. The provider enforces callback
  matching, including the native loopback-port rules of RFC 8252.
- Browser-only refresh clients, implicit/password/client-credentials grants and
  automatic app enrollment are outside this profile. A client-type declaration
  is not device attestation. Wider review must evaluate the actual client.

The issuer is explicitly configured and pinned. The API resource audience is
`{issuer-origin}/api/v2`; delegated bearers are accepted only by that API version.
Discovery, authorization, token and signing-key endpoints are under the issuer's
`/oauth` mount. Clients validate the exact issuer and audience, callback state,
S256 verifier and ID-token nonce. They do not follow credential redirects, fetch
arbitrary backend discovery URLs or switch to hosted Groupi on failure.

## Registration and consent

Register apps from Developer settings. New apps can be tested only with the
registering developer's own account. A platform administrator reviews wider access
at `/admin/developer-apps`. Approval permits wider eligibility; rejection preserves
owner-only testing and permits a later review request; suspension denies testing,
new authorizations, exchange, renewal and API requests. Review is not a guarantee
that an app is safe and never substitutes for each user's consent.

The consent page names the instance, current account, app, purpose and every
requested permission. `openid` grants only an opaque identifier. Display name and
email require separate `identity.display-name` and `identity.email` consent; no
profile/email fallback is performed. The persisted subject is specific to the app,
instance and person. Two apps sharing a callback host get different subjects;
disconnecting and reconnecting the same app does not change its subject.

API actions are explicitly named: `events.read`, `events.update`, `members.read`,
`discussion.read`, `discussion.create`, `discussion.update`, `discussion.delete`,
`files.read`, `files.upload` and `profiles.read`. Identity permission is delivered
through the signed ID token, not the global REST `/profile` projection. An identity-
only API token has no API actions. Unimplemented actions and unrelated global,
Group, Invite List, administrator and account operations fail closed.

The user selects events or explicitly chooses all current and future events within
current authority. API requests still check current membership, policy and role.
Added selected resources or actions require new consent. Separately disclosed
background access requires `offline_access`; foreground-only grants receive no
refresh token. This avoids relying on a client's unverified foreground claim.

Approval and denial are bound to the initiating browser. The authenticated native
mutation creates a hash-only, one-use, 60-second approval ticket without creating
a grant. A top-level navigation must also present the provider's signed interaction
cookie for the exact request. Only then does one transaction consume the ticket,
recheck account/app/resource authority and commit the decision. Copying a consent
link into a different browser cannot approve the original request. Tickets are
removed from the continuation URL and never sent to the third-party callback;
responses use no-store and no-referrer policies.

## Tokens and disconnect

| State                   | Lifetime                                               |
| ----------------------- | ------------------------------------------------------ |
| Authorization code      | 60 seconds, one use                                    |
| Access token / ID token | 5 minutes                                              |
| Browser interaction     | 10 minutes                                             |
| Approval ticket         | 60 seconds, one use                                    |
| Background refresh      | Rotating; 7-day inactivity and 30-day absolute ceiling |

API access and refresh tokens are opaque. Raw opaque token identifiers are removed
from persisted payloads and indexed by SHA-256 hashes. Access credentials record
their actual action and audience snapshot; permission requires both that snapshot
and the still-active grant. Refresh preserves the existing consent: this profile
rejects a `scope` parameter on the token endpoint rather than silently changing
permissions. SDK requests never fall back to an API key or open a consent popup.

Provider persistence operations use Convex transactions with live grant checks.
Single-use consumption is conditional and replay revokes the authoritative grant.
Permanent revocation tombstones deny late token inserts as well as later reads;
provider calls are not falsely described as one multi-call database transaction.
Strict, model-specific serialized payload schemas reject unsupported upstream
fields. Provider upgrades require reviewing this pinned persistence contract.

Connected Apps shows actions, selected/broad resources, background mode and status,
including expiry. Its display clock does not grant authority. At most 100 active
connections are allowed, all active connections remain visible, and the most
recent 100 disconnected records are shown. Registration is bounded to 100 owned
apps. Disconnect acknowledges a committed revocation: transactions ordered after
it are denied, while transactions committed earlier may finish delivery. It cannot
erase copied data, revoke an app-owned session or invalidate already-issued signed
file URLs before their expiry. Account recovery revokes user connections through
the authorization core. Encrypted-event decryption and self-host policy remain
outside this implementation.

## Configuration and migration handoff

Operators must provision these environment names through their normal secret
management process; no values are included here:

- `DELEGATED_ISSUER`: the exact HTTPS Convex HTTP origin plus `/oauth`.
- `DELEGATED_SIGNING_JWKS`: stable private RS256 signing JWKS with key IDs; rotate
  with an overlap that preserves verification of still-valid ID tokens.
- `DELEGATED_COOKIE_KEYS`: a JSON array of sufficiently random cookie signing keys,
  each at least 32 characters, newest first.
- `SITE_URL`: the intended local web application's HTTPS origin for consent.

Without all four settings, protocol requests return `temporarily_unavailable`.
Node 22 is required by the selected provider and is already configured in
`convex.json`. New delegated tables and indexes must be included with the core
principals/grants/discriminated-credentials schema. These tables have not been
introduced to a live deployment by this work; no existing delegated rows require
backfill in that baseline. If an intermediate schema was deployed elsewhere,
backfill binding activity and credential snapshots before requiring those fields;
missing snapshots must never inherit wider grant permissions. Regenerate types
with `pnpm generate`. The five-minute `pruneExpired` cron removes expired protocol
artifacts, requests and approval tickets in bounded batches; revocation tombstones
are intentionally retained.

## Validation evidence and remaining gates

The local public seam runs the actual HTTP-to-Node provider bridge, native browser
consent mutations, Convex transactions and JOSE signing/verification. Executed
cases include S256 code exchange, minimal claims, wrong issuer/audience verification,
confidential JWT client authentication, native private-use callback/verifier failures,
bounded REST use, refresh narrowing/expansion rejection, rotation/replay/concurrent redemption,
disconnect, copied consent-link denial, approval-ticket expiry/replay/concurrent finalization,
two-app subject isolation with global-profile denial, expiry status and platform-admin review
transitions. Additional matrix cases are recorded in `convex/tests/delegatedProtocol.test.ts`.

These results establish local behavior, not production interoperability. A deployed
issuer/discovery/key-rotation matrix, actual native platform callback dispatch,
private-network reachability/trust, browser cookie behavior across the configured
origins, independent security assessment and operational migration review remain
release gates. Tests, upstream documentation and a configured CI job do not replace
that evidence. No external reviewer contact, credential grant or deployment is
authorized by these docs.

Protocol references: [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html),
[RFC 7636](https://www.rfc-editor.org/rfc/rfc7636.html),
[RFC 8252](https://www.rfc-editor.org/rfc/rfc8252.html),
[OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html),
and the [provider's maintained adapter contract](https://github.com/panva/node-oidc-provider/blob/main/example/my_adapter.js).
