# Developer platform implementation and verification

Implementation baseline: `da5ccb462f8b0ead9a4a32ea405641d5eddd5624`.
Scope: the portal, TypeScript/Python SDKs, bounded authorization and delegated
sign-in tracks in [#350](https://github.com/groupi-app/groupi/issues/350), including
selected agent exports and API explorer work. Self-hosting and encrypted Events
remain deferred. This record separates implementation evidence from release
readiness; an unchecked requirement is not a passing result.

## Approved public test boundaries

The maintainer approved these four boundaries on 15 October 2026 for
[#291](https://github.com/groupi-app/groupi/issues/291):

1. Portal browser journeys: navigation, search, versioned documentation and
   runnable examples. Native application UI is outside this portal boundary.
2. Public TypeScript/Python SDK calls against an isolated REST service:
   contracts, pagination, retries and packaged installs.
3. Authenticated public backend/API operations using separate users and grants:
   resource isolation, current authority and revocation.
4. Delegated sign-in protocol and browser consent: PKCE, redirects, token
   refresh, disconnect and client failures.

Tests exercise observable public behavior. Rendered portal journeys can use a
DOM test environment; actual browser accessibility, layout and performance need
separate browser evidence. An isolated HTTP fixture establishes client transport
behavior, not real backend authorization. Backend tests must exercise actual
domain operations and state rather than mock the authorization helper. Protocol
tests must use real protocol and cryptographic primitives.

## Parallel work and dependencies

| Track                 | Tickets                                  | Dependency                                                        |
| --------------------- | ---------------------------------------- | ----------------------------------------------------------------- |
| Portal                | #293, #299, #307–#311, #322              | Approved content/publishing contract and current source inventory |
| Exports/explorer      | #298, #321, #330                         | Portal corpus and explicit explorer mode                          |
| SDKs                  | #294, #300, #301, #312–#315, #323        | Current operation catalog and runtime/package contract            |
| Bounded authorization | #295, #302, #316, #317, #324             | Principal, grant, projection and revocation policy                |
| Delegated sign-in     | #303, #318, #325, #331, #335, #339, #346 | Protocol/client policy and transactionally enforced grants        |
| Delegated SDK access  | #342                                     | SDK transport plus verified delegated access contract             |

Portal and API-key SDK work can proceed independently. The authorization core
owns grants and current-authority enforcement. Delegated protocol records bind
to those grants; SDK clients consume the resulting credentials without silently
switching instance or opening a browser during an ordinary API call.

## Approved implementation choices

The maintainer approved these choices on 15 October 2026:

- Separate static React portal, local search, versioned API/CLI references,
  downloadable documentation and an explicitly simulated API explorer.
- Dependency-free TypeScript and Python SDK transports, with synchronous and
  asynchronous Python adapters. Publication and portal deployment are separate
  operations.
- User credentials select Events or explicitly include all current and future
  Events within current authority. Independent integrations select Events and
  require Organizer sponsorship. Integrations have their own visible discussion
  authorship; they do not post as the sponsoring person.
- Owner-visible authorization audit metadata is retained for 90 days.
- Delegated authorization code flow with PKCE S256 and OIDC, app/instance-specific
  identity, 60-second codes and 5-minute access tokens. Separately consented
  rotating background refresh has a 30-day absolute limit and a 7-day inactivity
  limit. Initial clients are confidential web and native clients. Browser-only
  refresh remains unavailable until its security requirements are verified.
- Apps begin with developer-only testing; other users require platform
  administrator approval. User consent remains independently required.

## Current API inventory comparison

The previous [corpus audit](developer-corpus-audit.md) remains a historical
snapshot at `c307c779fd6907936c34303ac34f755c7fa266db`. Its 209 total operations
include 124 generated v2 operations, v1 operations and other endpoints.

At this implementation baseline, generation from the v2 Hono application exposes
235 documented v2 operations. Comparing canonical HTTP method and path shows
111 added operations and no removed v2 identities: 78 under Groups, 15 under
Events, eight Invite List operations, four Group invitation operations, four
account operations and two Event application operations. These source counts
are not claims that every endpoint has been exercised or released. Current SDK
and portal catalogs must use the current generated reference, rather than copy
the old audit's operation count or imply that v1 and v2 share wire contracts.

## Evidence still required

- Per-track red/green observations and focused validation, followed by combined
  lint, type, formatting and full-suite checks.
- Independent code and security review of the resulting implementation.
- Actual portal browser journeys at desktop and narrow widths, keyboard use,
  query quality and specified performance conditions.
- Clean SDK package installation and public workflows in supported runtimes.
- Real authorization denial and revocation observations, including role changes,
  guessed related-resource identifiers and independently attributed integrations.
- Two-client and two-instance delegated identity isolation, code/refresh replay,
  suspension, disconnect and permission-change behavior.

Local tests do not establish deployment, package registry availability, native
device behavior, production issuer configuration or independent external security
audit. Those need their own recorded evidence. No package publication, production
deployment, outside reviewer engagement or legal review is implied by this record.

Self-host install/upgrade/restore and encrypted multi-client privacy verification
are outside the selected implementation scope. Their absence must remain visible
in portal availability labels rather than being represented as supported features.
