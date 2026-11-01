# Developer portal publishing contract

Approved implementation inputs for issues #293 and #298, confirmed by the user
on 15 October 2026, updated by the approved learning specification on 30 October 2026. This document does not claim a deployed portal or published packages.

## Table of Contents

- [Publication](#publication)
- [Public corpus](#public-corpus)
- [Retrieval and validation](#retrieval-and-validation)
- [Optional exports and explorer](#optional-exports-and-explorer)
- [Maintenance and evidence](#maintenance-and-evidence)

## Publication

Use a dedicated `@groupi/portal` React client application in `packages/portal`,
with Vite static output and the existing Groupi semantic design tokens. It has
no authentication provider, server rendering, API routes or server actions.
Hosting requires a static fallback to `index.html` for reader routes. Deployment
remains separately authorized work. Local builds and previews are permitted for verification.

Canonical reader routes are `/v2/<page>#<passage>`, `/v1/reference/api#<operation>`
and `/cli/0.1.0/reference#<command>`. Learn and Reference are the primary journeys.
The Introduction links directly to CONTRIBUTING.md; there is no separate contributor course.
The old contributor reader path redirects to that blurb. CLI, add-on, SDK and
authorization references remain directly available. The current API
recommendation is v2; v1 remains explicitly versioned without an invented
retirement date. Self-hosting is a Proposed page and is excluded from this
implementation's launch dependency because self-host implementation is out of
scope.

## Public corpus

Use an explicit publication allowlist and curated guides. Never ingest `docs/`
recursively. Exclude planning, agent instructions, audit evidence, account-specific
material, credentials and user data. Generated CLI command help comes from the
existing CLI generator; generated API reference comes from both Hono OpenAPI
applications without making a network request.

Each page or generated passage records a stable identity, title, audience,
version, availability, owning source, source revision and evidence boundary.
Source availability is not registry availability or proof of hosted behavior.
Curated guides replace known stale setup claims rather than republishing the
historical getting-started guide unchanged. Existing architecture and add-on
material remains linked as supporting source.

## Retrieval and validation

Deliver a public passage index with the static corpus. Rank exact identifiers
before title and body matches; support task synonyms, conservative typo fallback,
explicit version intent and availability filters. Show highlighted matching
passages and stable section links. No hosted answer assistant or private search
service is included.

Finalize 40 representative queries against independent expected passage IDs
before implementing retrieval. Acceptance is at least 90% correct passage in the
first three results, with supported exact identifiers first. Proposed local
budgets are search p95 below 100 ms and compressed index below 300 KiB; these
measurements do not establish throttled physical-device performance.

The approved seam is browser reader journeys: navigation, search, versioned docs
and runnable examples. Native applications are excluded. Parent-owned CUA
verification will record actual viewport sizes, keyboard behavior, accessibility
observations and runtime limitations. Browser test definitions may be authored,
but no Playwright subprocess or source-serving test adapter is authorized.

## Optional exports and explorer

Exports include Markdown, plain text, JSON passage index and `llms.txt`, all
from the same canonical public corpus with version and availability metadata.
The integration-only `/agents.md` entry aliases `/v2/agents.md`; task-specific raw
Markdown uses the same canonical source as human lessons. Absolute links use the
configured, verified documentation origin. There is no new authenticated agent-query endpoint.

The proposed early explorer is fixture-only. It identifies itself as Demo,
explains the instance and identity boundary, and simulates eligible event list
and replay-safe event creation. It accepts no credential, sends no live request,
persists nothing and performs no destructive operation. Examples must distinguish
fixture success from verified REST integration. Live access would require a
separate explicit credential, origin, write confirmation and cleanup decision.

## Maintenance and evidence

Repository CODEOWNERS currently names `@TheiaSurette`; source authors remain
responsible for reference freshness. Publication generation records dependency
hashes and fails freshness checks when any allowlisted source changes. Generated
API and CLI content is versioned by its declared contract or package version.
Current, Upcoming and Proposed labels describe evidence and must never imply
that an unpublished SDK is installable.

The release dossier records actual executed checks and limitations. Configured
CI, authored tests, fixture demos and source schema generation are distinct from
runtime passing evidence, registry publication, deployment and independent
security review.

## Proposed query acceptance set

Expected passages are independently selected reader tasks. These are acceptance
inputs, not strings derived from ranking output. A no-result query is checked
for recovery guidance rather than scored for relevance.

| Query                                   | Expected passage                   |
| --------------------------------------- | ---------------------------------- |
| read my events                          | integrator:read-events             |
| list events empty response              | integrator:empty-pages             |
| create an event                         | integrator:create-event            |
| retry after timeout                     | integrator:uncertain-write         |
| Idempotency-Key                         | integrator:uncertain-write         |
| wrong account permission denied         | integrator:authority               |
| x-api-key                               | integrator:credentials             |
| event cursor next page                  | integrator:empty-pages             |
| GET /api/v2/events                      | generated v2 GET /events           |
| POST /api/v2/events                     | generated v2 POST /events          |
| v1 events response                      | versions:v1                        |
| v2 REST reference                       | versions:v2                        |
| groupi events create                    | generated CLI groupi events create |
| groupi auth status                      | generated CLI groupi auth status   |
| groupi profile add                      | generated CLI groupi profile add   |
| groupi events list                      | generated CLI groupi events list   |
| groupi auth logout                      | generated CLI groupi auth logout   |
| install CLI from source                 | cli:installation                   |
| JSON automation exit codes              | cli:automation                     |
| malformed continuation                  | cli:pagination                     |
| temporary credential stdin              | cli:credentials                    |
| pagnation                               | integrator:empty-pages             |
| autentcation                            | integrator:credentials             |
| contrbute                               | contributor:setup                  |
| local focused test                      | contributor:tests                  |
| pnpm check                              | contributor:tests                  |
| contribute pull request                 | contributor:submit                 |
| Node version prerequisites              | contributor:setup                  |
| domain-owned backend operations         | architecture:boundaries            |
| shared platform hooks                   | architecture:shared                |
| organizer versus platform administrator | concepts:roles                     |
| invite list versus Group                | concepts:groups                    |
| add-on source handler                   | addons:source-handlers             |
| add-on template authoring               | addons:templates                   |
| event add-on saved version              | addons:templates                   |
| add-on isolation permissions            | addons:authorization               |
| self-host Linux Compose                 | self-hosting:status                |
| Python SDK install                      | sdks:availability                  |
| delegated sign-in availability          | auth:availability                  |
| export docs for my agent                | exports:formats                    |

Additional recovery case: `quasar wombat telemetry` returns no results and offers
reference navigation, version/availability reset and simpler query guidance.
