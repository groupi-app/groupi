# Developer corpus and public API contract audit

Source-grounded research for [#292](https://github.com/groupi-app/groupi/issues/292),
part of [the developer portal map](https://github.com/groupi-app/groupi/issues/350).
Audited on **13 October 2026** against **`c307c779fd6907936c34303ac34f755c7fa266db`**.
This is a maintainer decision artifact, not a published product guide, API support
policy, deployment certification, or security audit. Application behavior and
existing documentation are unchanged.

## Table of Contents

- [Outcome and evidence boundary](#outcome-and-evidence-boundary)
- [Corpus inventory and ownership](#corpus-inventory-and-ownership)
- [Public operation contracts](#public-operation-contracts)
- [Publication risks and corrections](#publication-risks-and-corrections)
- [Release and runtime evidence](#release-and-runtime-evidence)
- [Decision handoff](#decision-handoff)
- [Acceptance and validation record](#acceptance-and-validation-record)

## Outcome and evidence boundary

There is substantial reusable documentation and implemented CLI/API functionality.
The immediate gaps are content accuracy, catalog completeness, version policy,
and release evidence. A new portal must not turn historical plans or source-level
capabilities into claims of currently supported deployment behavior.

The accompanying artifacts are deliberately bounded snapshots:

| Artifact                                                              | Contents and use                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Corpus inventory](developer-corpus-inventory.json)                   | 53 entries: tracked developer/root/package Markdown, CLI JSON sources, the existing web API page, and both generated REST catalogs. Each entry records audience, canonical identity, version, availability, owner, freshness and publication disposition.                                                                                                       |
| [Operation inventory](developer-api-operation-inventory.json)         | 209 operations: 76 generated v1 operations, 124 generated v2 operations, two implemented v2 uploads missing from OpenAPI, six public health/reference endpoints, and one unversioned public invite-preview endpoint. Each resource operation records authority/scope, pagination, declared responses, error/replay profiles, source and compatibility evidence. |
| [Existing CLI reference](../packages/cli/docs/command-reference.json) | Canonical `@groupi/cli 0.1.0` reference with 158 command entries, including root/group entries. It is reused, not recreated here.                                                                                                                                                                                                                               |

Operation counts describe the local Hono applications and source registrations.
One advertised v1 operation lacks outer-router forwarding. Counts therefore do
not mean that 209 externally reachable operations have been verified. No hosted
endpoint, registry package, real account, secret store, or third-party service
was exercised for this audit.

The inventory's GitHub evidence links are pinned to the audited commit. A file's
last commit date is an editing date, not proof that its instructions still work.
The JSON artifacts are audit metadata, not replacement generated OpenAPI or CLI
references. Refresh them when the underlying source changes.

## Corpus inventory and ownership

### Current guide candidates

| Audience                     | Existing canonical material                                                                                                                                                                                                                                                                                                                            | Availability and curation                                                                                                                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Integrator                   | [Web API page](../packages/web/app/docs/api/page.tsx), generated `/api/v1/openapi.json` and `/api/v2/openapi.json`, [date language](groupi-date-language-spec.md)                                                                                                                                                                                      | v2 is the CLI transport and recommendation for new integrations. The handwritten page has material drift; generated schemas also have omissions listed below. A clean read-and-create first-success guide is still needed. |
| Contributor                  | [README](../README.md), [contributing](../CONTRIBUTING.md), [getting started](getting-started.md), [testing](testing.md), [changesets](changesets.md), [glossary](../GLOSSARY.md)                                                                                                                                                                      | Reuse after correcting setup/runtime examples. No new contributor workflow or business feature is required to resolve this audit.                                                                                          |
| Backend/platform contributor | [Architecture](architecture.md), [auth](auth-architecture.md), [schema](database-schema.md), [presence](presence.md), [Convex introduction](../convex/README.md), [transport ADR](adr/0001-cli-rest-transport.md)                                                                                                                                      | Source review required for stale implementation assessments. Keep native Convex and versioned REST concepts distinct.                                                                                                      |
| UI/mobile contributor        | [Design system](ui-design-system.md), [web introduction](../packages/web/README.md), [mobile components](../packages/mobile/COMPONENTS.md)                                                                                                                                                                                                             | Contributor material; correct obsolete examples and use native development-build guidance.                                                                                                                                 |
| CLI user/automation author   | [CLI README](../packages/cli/README.md), [generated command reference](../packages/cli/docs/command-reference.md), [generated workflows](../packages/cli/docs/workflow-examples.md), [portable guidance](../packages/cli/skills/groupi/SKILL.md), [terminal](../packages/cli/docs/terminal.md), [discussion/media](../packages/cli/docs/discussion.md) | Implemented in this snapshot, including discussion, media, social, TUI and custom authoring. Public publication/staging verification remains a separate evidence gate.                                                     |
| Add-on author/participant    | [Framework](addon-framework.md), [CLI participation](../packages/cli/docs/addon-participation.md), [CLI authoring](../packages/cli/docs/addon-authoring.md)                                                                                                                                                                                            | Distinguish built-in/framework development, configuring existing add-ons, participant actions, and portable custom-definition authoring. New authoring does not support `send_webhook`.                                    |
| Maintainer                   | [CLI release](cli-release.md), [mobile release](mobile-release.md), [iOS testing](ios-testing.md), [mobile update boundary](mobile-update-boundary.md), [guidance verification](../packages/cli/docs/guidance-verification.md), [maintainers](../MAINTAINERS.md), [security](../SECURITY.md), [conduct](../CODE_OF_CONDUCT.md)                         | Publish only reviewed generic procedures and appropriate governance pages. Separate operational evidence and account-specific details.                                                                                     |

The complete per-file inventory is in JSON; the table groups audiences without
creating a second command reference. The generated CLI reference and examples
come from Commander definitions, package version and `agent-workflows.json` via
the [existing generator](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/packages/cli/scripts/generate-reference.js).
`docs:check`, the reference tests and `prepack` already own drift detection.
Future portal/search exports should ingest or link those artifacts with their
package version rather than hand-copy command flags.

### Excluded and planned material

Use an explicit allowlist for public ingestion. Do not recursively index the
repository's documentation directory.

- `docs/self-hosting.md` and `docs/data-exports.md` explicitly describe planned
  capabilities. They are not supported quickstarts. Any deliberate publication
  as a design must preserve the planned status and keep it out of current-guide
  search results.
- Agent instructions and repository development skills, internal planning,
  historical gap/readiness/integration audits, release evidence records, and
  account/deployment-specific app-review/store material are excluded from the
  default public corpus. The inventory identifies their paths without copying
  private planning contents or account details.
- The portable **CLI user** guidance in the distributed CLI package is a distinct
  public candidate. It is not permission to publish repository agent instructions.
- Never index environment files, credentials, authorization codes, bearer invite
  tokens, real user responses, generated coverage, logs, or personal account and
  service identifiers. This audit contains none of those values. RADAR material
  is outside scope and was not used.

### Owner and freshness model

[CODEOWNERS](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/.github/CODEOWNERS#L1)
assigns repository/docs ownership to `@TheiaSurette`. It does not assign a
separate API, CLI, self-hosting, search, or release evidence reviewer. Existing
Markdown lacks a consistent shared audience/version/availability/freshness
metadata contract; some files carry useful prose status, and generated CLI JSON
already carries package/version. The
[documentation rules](../.agents/rules/documentation.md) define formatting but
not a publication lifecycle.

Proposed inputs for #293 to decide, not an adopted framework schema: content ID,
audience, publication disposition, owning source/generator, reviewed source SHA,
API/package version, availability, verification evidence and date, responsible
reviewer, and replacement/redirect relationship. A changed source dependency
should trigger review. Do not treat all source edits as renewed verification or
choose a stale-age threshold without an owner and release policy.

## Public operation contracts

### Identity, transport and versions

The [HTTP router](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/http.ts)
mounts v1 and v2 separately. Their OpenAPI metadata declares `1.0.0` and `2.0.0`.
Neither catalog declares `operationId`. The audit uses **HTTP method + versioned
source path** as the canonical observed identity. SDK method names and future
stable operation IDs still need a compatibility decision. Matching methods and
parameter-normalized paths across versions are recorded as comparison evidence,
not as wire or permission equivalence.

The [transport ADR](adr/0001-cli-rest-transport.md) selects REST v2 for CLI/TUI.
The [CLI profile source](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/packages/cli/src/profiles.js#L6)
contains the hosted default; the handwritten API page uses a different API host.
This audit did not verify DNS, redirects or deployment equivalence. Confirm a
canonical public origin using exact deployed-release evidence before publishing
working URLs. For self-hosted targets, use each instance's HTTP-actions origin;
do not infer supported self-hosting from a profile accepting a URL.

v1 resource successes generally wrap `{success:true,data:...}`; v2 generally
returns resource bodies directly. Deletes must be handled **per operation**:
v2 uses both `204` without a body and `200` JSON results, including image removal,
availability clearing and some other actions. Blanket “all v2 deletes return
204” migration advice is false. v1 is present in source, but no retirement date,
maintenance duration or deployed-version compatibility matrix is established.

### Credentials and current authority

Both handlers authenticate resource requests with `x-api-key`, including bearer
invitation inspection. Health, Swagger and OpenAPI are public; v2 CLI exchange
instead uses a single-use browser authorization code, PKCE proof, state and
callback port. The unversioned invite-preview endpoint is separately public.
See the [v2 handler](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/api/v2/index.ts#L319)
and [shared verifier](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/api/v1/internal/auth.ts#L49).

Keys without stored permissions retain account-level access subject to domain
checks. Scoped keys need the **exact top-level REST collection** and `read` for
GET/HEAD or `write` for other methods. `/events/{id}/posts` uses `events`, while
`/posts/{id}` uses `posts`; analogous invitation, reply, upload and add-on paths
must not be collapsed into one assumed “events” scope. An exact collection grant
is not an event-specific resource grant. Malformed permission structures fail
closed; an ungranted/unknown collection or action does not authorize the request.
Expiry, disabled/revoked keys, account existence/bans, quotas and rate limits
also apply. Self-revocation has a deliberate scope/quota bypass but still needs a
valid enabled, unexpired key and eligible account.

CLI browser exchange currently issues a 90-day account key without stored
resource permissions. It is not the future bounded named-event key or delegated
third-party app connection. The account's current authority still bounds domain
actions. Do not publish the future principal/selected-event/background-consent
model as current behavior. See
[CLI authorization](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/cliAuth/mutations.ts#L138).

The inventory's authority profiles distinguish event organizers/moderators,
attendees, content authors, invitation recipients, template owners and platform
administrators. Event write, discussion, attendance, invitation, media and
management modules contain actor-aware domain operations. Some legacy routes
and platform-admin operations still perform HTTP preflight then invoke internal
functions without actor identity. Those paths need transaction-level review;
this audit does not certify their resistance to authority changing between calls.
See [admin route preflight](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/api/v2/routes/admin.ts#L30)
and [admin mutation](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/api/v1/internal/admin.ts#L87).

### Pagination and projections

| Observed contract                        | Operations                                                                                                                                                                 | Continuation and compatibility                                                                                                                                                                                                                      |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Legacy unpaged array or cursor page      | v2 events, members, potential dates, link/email invitations, friends and incoming/outgoing friend requests, notifications, published templates, add-on configurations/data | Request `pagination=cursor` to activate paging. Most reject limit/cursor without that flag; add-on paging schemas are more permissive but activation still needs the flag. Pages use `{items,nextCursor}`, with extra `isOptedOut` for add-on data. |
| Always paged with shared flag validation | v2 discovery, own availability, availability responses, username invitation lists, blocked users                                                                           | Returns `{items,nextCursor}` even with no paging arguments. Shared query validation requires `pagination=cursor` when supplying limit/cursor.                                                                                                       |
| Discussion's separate opt-in             | v2 event posts and post replies                                                                                                                                            | Any of `pagination=cursor`, `limit` or `cursor` activates `{items,nextCursor}`; no arguments retain arrays. This behavior is not typed in current OpenAPI.                                                                                          |
| Always paged without flag                | v2 custom definition list and Discord guild list                                                                                                                           | `limit`/`cursor`, `{items,nextCursor}`; no `pagination` flag required.                                                                                                                                                                              |
| Legacy v1 paging exception               | Published template and event add-on configuration lists                                                                                                                    | Cursor pages live inside `{success:true,data:{items,nextCursor}}`; other v1 list routes have no documented cursor contract. The outer router currently does not forward the template list.                                                          |
| No cursor contract                       | Theme lists, muted-item aggregates, platform admin lists, full availability grid, friend search and other ordinary detail/action routes                                    | Do not infer pagination from unused common schemas. Friend search has a limit without continuation. Some arrays/embedded collections can remain unbounded.                                                                                          |

Cursor pages default to 20 with maximum 100 in the listed paging schemas. Keep
cursors opaque and tied to the original operation/filter/identity; continue
until `nextCursor` is null, including after empty pages. Invalid cursors require
restart. No snapshot-isolation or fixed-total guarantee was established. The
unused generic `{data,pagination:{hasMore,nextCursor}}` helper in
[common schemas](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/api/v2/schemas/common.ts#L41)
is not the actual shared wire contract.

Related-data projections deserve explicit review in #316: resource responses
embed author/user identifiers and email, membership data, invitation tokens and
attachment URLs. The catalog records the current API shape; it is not approval
to retain every field under future narrowly bounded grants. Paginating a parent
list also does not bound all embedded data: discussion post detail includes its
replies. See
[discussion projection](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/discussion/rest.ts#L39).

### Errors and uncertain writes

The inventory separates **declared OpenAPI response statuses** from **runtime
error profiles**. Auth 401/403/429, generic 500 and domain failures can occur even
when omitted from an operation's response declaration. v1's primary error
envelope includes `success:false`; v2's primary shape is
`{error:{code,message}}`. v2's shared validation hook returns 400
`VALIDATION_ERROR`, but CLI exchange uses `BAD_REQUEST`, authoring can add
`error.issues`, and route-specific HTTP errors can use `ERROR` or `BAD_REQUEST`.
Legacy v1 validation is not uniformly normalized. Temporary rate limiting
includes `Retry-After` seconds; quota exhaustion need not include it.

Only the following v2 creations expose the audited 24-hour `Idempotency-Key`
contract: event creation, link invitation creation, email invitations, username
member invitations, and pending-email invitation sending. The identifier is
`<unix-ms>.<uuid-v4>`, lowercase and within five minutes of future clock skew.
Expiry is 24 hours **from the identifier timestamp**, not from the last retry.
Reuse by the same account and operation with the same input returns the retained
result; changed input or expired identifiers returns 409. Current invitation
authority is checked before replay. A missing key provides no replay guarantee.
See [event creation](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/events/rest.ts#L54),
[invitation creation](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/invites/rest.ts#L30)
and [identifier validation](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/lib/requestId.ts#L24).

Other writes have no general replay promise, including discussion, uploads,
image changes, roles, settings, participation and authoring. `expectedVersion`
is an authoring concurrency guard, not request deduplication. Inspect current
state after an uncertain result; do not advertise blanket mutation retries.
CLI authorization exchange is single-use: a lost response cannot recover its
issued secret by repeating the exchange. Follow existing CLI guidance to inspect
and revoke a possibly issued key before restarting login.

## Publication risks and corrections

These are source-grounded findings and proposed owning follow-ups. No existing
guide or runtime behavior was changed as part of this read-only task.

| Priority                                | Finding and evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Required correction / owner handoff                                                                                                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before full generated API coverage      | `POST /api/v2/uploads` and `DELETE /api/v2/uploads/{storageId}` are plain Hono handlers, absent from generated OpenAPI. [Source](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/api/v2/routes/uploads.ts)                                                                                                                                                                                                                                                   | #294/#312 must include upload transport, ownership, size/purpose, cleanup and failure contracts before SDK/explorer completeness claims.                                                          |
| Before full generated API coverage      | Ten discussion operations omit `security` and expose `z.any()` results; mutation routes declare 200/201/204 collectively rather than their exact result. [Source](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/api/v2/routes/discussion.ts)                                                                                                                                                                                                               | #294/#312 need typed request/results and operation-specific statuses. Omitted OpenAPI security is a documentation defect; the outer handler still authenticates.                                  |
| Before publishing v1 template reference | `/api/v1/addon-templates` is in Hono OpenAPI but lacks matching outer HTTP forwarding. [Hono source](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/api/v1/routes/addons.ts#L45), [outer router](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/http.ts)                                                                                                                                                         | #299/compatibility owner must resolve exposure or withdraw the advertised operation without silently changing existing version contracts.                                                         |
| Before browser explorer promise         | Auth runs before Hono CORS for protected paths; unauthenticated OPTIONS follows key validation. Upload's `X-Filename` is absent from allowed headers. [Handler/CORS](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/api/v2/index.ts#L62)                                                                                                                                                                                                                    | #298/#330 need actual browser/preflight/error-response verification against the chosen origin. A permissive CORS configuration alone is insufficient evidence.                                    |
| Before integrator first success         | Handwritten API page assumes an unverified alternate host, says all endpoints need keys/all deletes use 204, lacks cursor/idempotency guidance, and labels v2 invalid GDL `GDL_PARSE_ERROR` although v2 source emits `VALIDATION_ERROR`. [Page](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/packages/web/app/docs/api/page.tsx#L147), [v2 write](https://github.com/groupi-app/groupi/blob/c307c779fd6907936c34303ac34f755c7fa266db/convex/events/rest.ts#L111) | #299/#307 should reuse corrected generated contracts and verify a bounded read/create example. Current `/api/docs` redirects specifically to v1: [source](../packages/web/app/api/docs/route.ts). |
| Before contributor first success        | README recommends nonexistent `dev:full`, calls root `dev` web-only, starts Convex twice, links missing `packages/ui`, and recommends Expo Go. [README](../README.md), [scripts](../package.json), [native guidance](ios-testing.md)                                                                                                                                                                                                                                                                   | #308 should correct examples using source scripts and native development builds; no service was started in this audit.                                                                            |
| Before contributor first success        | README/contributing/getting-started allow Node 18, below locked Next/RN requirements. CLI has a separate explicit Node 22/24 matrix. Getting-started labels `CONVEX_DEPLOYMENT` a URL. [Guide](getting-started.md), [lockfile](../pnpm-lock.yaml), [CLI engines](../packages/cli/package.json), [environment example](../.env.example)                                                                                                                                                                 | #308 chooses and executes a supported contributor runtime setup, distinguishes deployment identifier from URLs and backend secret configuration.                                                  |
| Before source guides become reference   | Web README uses nonexistent `api.events.queries.list` / `mutations.create`; schema guide types Better Auth `persons.userId` as a Convex users-table ID; auth guide says magic links only log although Resend sending exists. [Web guide](../packages/web/README.md), [schema guide](database-schema.md), [actual schema](../convex/schema.ts), [actual auth](../convex/auth.ts#L198)                                                                                                                   | Domain owners correct these facts and review adjacent examples. Static presence of Resend sending still does not prove delivery.                                                                  |
| Before CLI journey publication          | `guidance-verification.md` says discussion/media, everyday TUI and custom authoring are deferred despite implemented commands and focused guides; completion-plan progress also predates delivered login. [Guidance](../packages/cli/docs/guidance-verification.md), [capabilities](cli-capabilities.md), [current reference](../packages/cli/docs/command-reference.json)                                                                                                                             | #309 reuses the actual full command surface and keeps staging/package evidence pending. Fix handwritten status claims through their owning CLI track; do not duplicate command docs.              |
| Before bounded-auth assurances          | Collection grants are broad; related-data projection and admin/legacy preflight separation need current-authority review. [Verifier](../convex/api/v1/internal/auth.ts), [admin mutation](../convex/api/v1/internal/admin.ts)                                                                                                                                                                                                                                                                          | #295/#316/#324 own principal, projection, migration and invalidation decisions. This audit neither redesigns auth nor certifies security.                                                         |

Historical readiness/planning statements must not overrule current source or
governance. For example, the old open-source plan predates existing root
governance files and suggests a different license; the actual repository is
GPL-3.0. Keep planning documents outside current guide navigation rather than
silently presenting their old assessments as facts.

Subsequent remediation outside this immutable source snapshot:
[PR #366](https://github.com/groupi-app/groupi/pull/366), documentation commit
`46c79395237569a8725cc901e0ba76a3105d0e56`, corrects stale CLI README and guidance
claims and adds a separate beta-verification record. Its changed file list was
checked when this audit was prepared. It does not retroactively change the
baseline inventory or certify package publication/deployment. Review that PR's
own evidence before treating a release gate as satisfied; avoid duplicating its
copy corrections in later portal work.

## Release and runtime evidence

| Layer                    | Observed evidence                                                                                                                       | What remains unproven                                                                                                                                       |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API source               | Both local Hono apps produce OpenAPI; outer registrations, shared verifier and domain implementations inspected                         | Exact hosted deployment SHA, authenticated behavior, browser CORS and compatibility across maintained releases                                              |
| CLI package source       | Package `0.1.0`, generated reference `0.1.0`, 158 command entries; distribution includes docs/skill; package engine declares Node 22/24 | Fresh installed-artifact generation check in this checkout, complete clean-package/staging workflows, compatible agent discovery                            |
| CLI release tooling      | Six OS/runtime CI jobs and disabled-by-default beta publication workflow exist                                                          | npm scope rights, configured protected environment, approved publication credential, actual publication, public-registry install and repeat staging flow    |
| CLI capability evidence  | Source contains #229–241 and #243 functionality; existing capability document separates local/staging status                            | Real two-identity isolated-staging acceptance, native credential stores on all OSes, manual TUI/reconnect/privacy checks, notification side effects         |
| Self-hosting             | Planned specification, arbitrary CLI instance profiles                                                                                  | Supported Linux Compose artifacts, enrollment/recovery/backup/restore and device access evidence; these belong to #296/#304 and later P5 work               |
| SDK/delegated/encryption | Existing REST boundary and future work map                                                                                              | General TS/Python SDK releases, bounded named-event keys, delegated apps and encrypted-event support are not current capabilities established by this audit |

The [release runbook](cli-release.md) deliberately leaves release evidence
pending; workflow configuration is not publication. The older hosted health
record in [CLI capabilities](cli-capabilities.md#endpoint-evidence) proves only
the reachability/version observed on its recorded date, not deployment of this
snapshot's full API changes. No public npm query was used to infer ownership or
release availability.

## Decision handoff

| Owning ticket(s)                           | Concrete input from this audit                                                                                                                                         | Still requires a decision or new evidence                                                                                                                                                                                           |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| #291 validation seams                      | Actual boundaries: outer Convex HTTP router → API-key verifier → domain writes; generated CLI reference → public binary → installed artifact; browser/native flows     | #291 remains unconfirmed in the tracker at audit time. Ratify its phase seams; do not treat local app/catalog creation or fixture tests as deployed security evidence.                                                              |
| #293 publishing/retrieval                  | Per-file allowlist candidates/dispositions, generated ownership, version/availability metadata needs, known endpoint/link drift                                        | Framework/build/deploy, stable page/passage/reference IDs, metadata schema, maintained-version/redirect policy, retrieval provider, maintenance reviewers, measured query/device/network conditions, self-hosting launch dependency |
| #294, #300–315 SDK coverage                | Complete method/path inventory, per-operation scopes, variable paging, nonuniform errors, five replay-protected creations, undocumented uploads and untyped discussion | Final operation IDs/method naming, TS/Python runtime/generation/package strategy, correction of generation blockers, exact compatible deployment/package release evidence; split large coverage tickets if needed                   |
| #295, #302, #316–317, #324 auth            | Existing account keys and collection scopes; CLI exchange is account-level; related projections and preflight gaps identified                                          | Bounded principal/action/resource/current-authority, selected resources, independent integration identities, legacy migration and revocation/invalidation policy                                                                    |
| #299, #307–310 journeys                    | Reusable current guides; exact contributor/API/CLI status drift; four distinct add-on author/participant paths                                                         | Observable integrator read/create and contributor run/test/submit success; preserve auth/version/secret-handling boundaries; do not implement Invite Lists or Groups here                                                           |
| #311, #322 search quality                  | Canonical generated-source ownership and allowlisted current versus planned/maintainer content                                                                         | Final 30–50 queries and performance/accessibility thresholds in #293; use current-source exact command/operation matches and inspectable passage links                                                                              |
| #296, #304 and P5                          | Self-hosting guide is planned, not a supported installation                                                                                                            | Certified runtime/client matrix, enrollment/recovery/optional delivery and durable backup/restore design and isolated lifecycle execution                                                                                           |
| #298, #321, #330 optional exports/explorer | Public-content boundaries, missing schemas/security/status declarations, browser CORS concern                                                                          | Versioned export identity and credential/write safety; explicit authorization and isolated execution for explorer mutations                                                                                                         |

The approved Build/Contribute balance, dedicated same-repository portal,
generated-reference reuse, source search, self-hosting direction and future
principal/privacy baselines are not reopened. This handoff does not select a
provider/framework, promise a release, implement Groups/Invite Lists, or grant
new credentials.

## Acceptance and validation record

| #292 acceptance criterion                                                                                | Evidence delivered                                                                                                                                             | Limit                                                                                                             |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Inventory guides and existing API/CLI reference with version, availability, owner and canonical identity | 53-entry corpus JSON; versioned 209-operation JSON; canonical 158-entry CLI reference pointer; ownership/generator policy                                      | Named domain/release reviewers and maintained-version policy await #293/#294 decisions                            |
| Record REST credential/authority, paging, errors, replay and compatibility                               | Per-operation metadata and shared evidence-linked profiles; raw generated statuses separated from runtime contracts; v1/v2 comparison and forwarding exception | Source review/local extraction does not prove hosted release, transaction security or third-party delivery        |
| Identify quickstart drift, release uncertainty and gaps without duplicating owned features               | Prioritized correction table; release matrix; existing CLI/authoring functionality acknowledged; concrete successor handoff                                    | Corrections remain in their owning implementation/content tickets; no CLI reference or business feature recreated |
| Read-only task and publishable-corpus exclusions                                                         | Only audit artifacts added; no product/config/doc source fixes, services, deployment, package publication, credentials, data writes or tracker changes         | Maintainer review still chooses what to publish; the audit itself is not product guide content                    |

Validation performed:

1. Verified the worktree's audited HEAD and read #292/#350, relevant adjacent
   tickets, glossary, transport ADR, tracker/domain and documentation rules.
2. Imported `createApiV1App` and `createApiV2App` in Node 22 and requested their
   local `/openapi.json` endpoints without a server or database. Counted 56/88
   paths and 76/124 operations. This exercises catalog generation only.
3. Compared catalog entries with route modules, outer HTTP registrations,
   authentication, domain operations, schemas, tests and CLI reference metadata.
   Manually included plain upload and public utility handlers omitted from
   resource OpenAPI; no helper output is mistaken for runtime auth evidence.
4. Validated audit JSON, identity uniqueness, source path/line references,
   inventory coverage against both locally extracted catalogs and formatting.
5. The existing CLI `docs:check` passed against this snapshot's package and
   command definitions. Initial checks could not resolve dependencies from the
   older root installation; reusing the parallel current-main track's installed
   dependency directories resolved that environment problem. No source or
   dependency manifests were changed. This checks local generated guidance,
   not a registry-installed release.
6. `pnpm check` passed: lint, all five package type checks and repository
   formatting. Existing lint warnings remain. The catalog coverage/source-link
   checks above passed independently of those package checks.
7. An independent read-only review checked acceptance coverage, publication
   exclusions, source evidence and authority metadata. Corrected the template
   list's owner-only authority and distinguished cover reads from image writes;
   no additional substantive findings remained.

No behavioral tests were added for these documentation-only artifacts. Existing
tests such as [REST contracts](../convex/tests/rest-api-contracts.test.ts),
[CLI reference](../packages/cli/tests/reference.test.ts), and the domain REST
suites are reusable validation seams, not claims of successful execution during
this audit. No changeset is needed for this research-only documentation change.
