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

## Implemented source and focused evidence

- The static portal has versioned API/CLI references, local search, canonical
  Markdown/text/JSON exports and a clearly simulated explorer. Desktop and
  390-pixel browser journeys covered navigation, keyboard access, exact-operation
  search, downloads, failure states and retained-key Event replay. The temporary
  loopback-only portal server was stopped after verification. See
  [the portal evidence](developer-portal-verification.md) for screenshots and
  conditions; this does not claim screen-reader or throttled-network testing.
- Bounded credentials distinguish named user keys, integration actors and
  delegated access. Public backend tests cover selected Event isolation,
  current authority, related-resource projections, uncertainty, revocation and
  independent discussion authorship. Write-only operations return identifiers
  instead of leaking readable discussion bodies or attachment URLs.
- Delegated sign-in uses the maintained OIDC provider and real cryptographic
  protocol tests. Approval is bound to the initiating browser's signed cookie;
  the authenticated approval ticket is short-lived and single-use, and creates
  no grant until the provider validates that browser. Administrator review,
  developer-only eligibility, Connected Apps, recovery and owner resubmission
  have backend and rendered UI coverage.
- SDK source candidates provide specific TypeScript declarations and Python
  TypedDict models, synchronous/asynchronous Python clients, bounded transport
  and pagination, explicit credential modes, and delegated session adapters.
  Real protocol tests cover both languages and native/confidential clients,
  selected/broad Event grants, missing actions, refresh, expiry and disconnect.
  Registry publication is not part of implementation verification.
- Backend query/mutation contracts no longer rely on `any` or `unknown`.
  The checker inspects generated contracts and source exports and rejects
  annotations or aliases that erase a function's registration type. Negative
  checker tests are part of CI. Add-on hooks derive their payloads from Convex
  and preserve editable incomplete drafts; 67 web and 9 mobile focused tests
  passed for these call-site changes.

Independent review has covered protocol/authorization security, portal behavior,
SDK transport and type consumers, schema compatibility, cleanup, dependency
alignment and CI configuration. Confirmed findings are repaired and regression
checked before final acceptance. Combined lint, type, format, generated-artifact
freshness and full-suite results must be recorded against the final integrated
source, rather than inferred from individual worktrees.

## Integrated verification, 15 October 2026

Local runtimes: Node 22.23.3, Python 3.14.7, pnpm 10.12.1.

| Suite                       | Result                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Web                         | 97 files, 1,276 tests passed                                                                                           |
| Mobile component/unit tests | 80 files, 587 tests passed                                                                                             |
| Shared                      | 15 files, 434 tests passed                                                                                             |
| CLI                         | 30 files, 399 tests passed                                                                                             |
| Backend                     | 119 files passed initially; one legacy author assertion updated as described below                                     |
| SDK                         | 8 Node tests, 7 Python tests, 10 real REST/protocol integration tests passed                                           |
| Portal                      | 11 tests passed; 14 pages, 634 passages and 33 exports regenerated and freshness checked                               |
| Contract guard              | 735 generated and 735 source query/mutation contracts; zero loose-type findings; 3 negative checker regressions passed |

The backend full run had 1,051 passing tests and one outdated exact-object
expectation in the post pagination test: user authors now include `kind: 'user'`
to distinguish integration authors. The assertion was updated to require that
field while retaining the existing name/image and pagination checks. The complete
20-test Posts suite then passed; no production code changed after the full run.

Strict TypeScript/Python consumers and clean tarball/wheel installations passed.
Semantic-token checks passed their exit gate, retaining the 30 pre-existing web
warnings; the portal token scan is clean. One combined check found four unformatted
SDK test drivers; those files were formatted without changing their behavior.
Final combined `pnpm check` passes lint, types, contract enforcement and formatting;
its output is retained with the task's validation artifacts. This record does not substitute remote CI matrix results.

## Release gates and verification limits

No live database audit, normalization or schema deployment has run. The narrower
storage contracts require the separate migration-only release and clean paged
preflight described in [the strict-contract rollout](strict-backend-contract-rollout.md).
Do not deploy the narrowed schema directly to an unaudited database.

Local tests do not establish deployment, package registry availability, native
device behavior, production issuer configuration or an independent external
security audit. Native runtime acceptance and actual browser verification of the
new application authorization screens remain separate from rendered component
and protocol fixtures. CI defines Node 22/24 and Python 3.11/3.13 jobs; a local
run is not evidence that both remote matrix jobs have executed. No package
publication, production deployment, outside reviewer engagement or legal review
is implied by this record.

Self-host install/upgrade/restore and encrypted multi-client privacy verification
are outside the selected implementation scope. Their absence remains visible
in portal availability labels rather than being represented as supported features.
