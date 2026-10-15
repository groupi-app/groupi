# Developer portal candidate verification

Implementation evidence for #293, #299, #307–311, #322 and optional #298, #321,
#330. Recorded on 15 October 2026. This is candidate evidence, not a deployment,
package publication or independent security certification.

## Table of Contents

- [Delivered reader flows](#delivered-reader-flows)
- [Executed validation](#executed-validation)
- [Search conditions and results](#search-conditions-and-results)
- [Source and publication boundaries](#source-and-publication-boundaries)
- [Remaining acceptance](#remaining-acceptance)

## Delivered reader flows

| Flow                | Observable states exercised through the public React entry point                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Build / Contribute  | Equal journey links; integrator guide; contributor focused-check instructions; add-on source-handler and template paths                                                                                           |
| Reference           | REST v2 and v1 selection; generated operation headings; preserved CLI command anchors                                                                                                                             |
| Search              | Natural tasks, exact commands and HTTP operations, unversioned HTTP operation aliases, typo recovery, explicit versions, availability filtering, highlighted passages, keyboard activation and no-result recovery |
| Exports             | Canonical per-page Markdown/text links; copied executable code; public corpus/index/llms and generated OpenAPI downloads                                                                                          |
| Simulated explorer  | Empty-list success, identity permission denial, uncertain committed create, retained replay producing one event, expired credential, wrong instance, unsupported version and upcoming capability                  |
| Navigation recovery | Unknown route recovery; stable passage links; source/version/status context                                                                                                                                       |

The simulator uses local component state only. Its Organizer and Attendee are
synthetic identities with explicitly chosen demo grants; they do not redefine
real event roles or prove live authorization behavior. It accepts no credential,
performs no network request and persists nothing.

## Executed validation

| Check                                              | Result                                                                                                           |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Portal public-entry journey suite                  | 11 tests passed in 2 files                                                                                       |
| Portal TypeScript                                  | Passed                                                                                                           |
| Portal ESLint                                      | Passed; five console-report warnings, no errors                                                                  |
| Portal semantic token scan                         | Passed                                                                                                           |
| Root `pnpm lint:tokens`                            | Passed in existing warn-only mode; 30 pre-existing violations across three web files                             |
| Curated/generated source freshness                 | Passed: 14 public pages, 621 passages and 33 public exports                                                      |
| Freshness negative control                         | A deliberately modified public text export was rejected; original restored and check passed                      |
| CLI generator freshness                            | Existing `docs:check` passed; portal generation invokes this checker rather than duplicating its command catalog |
| Local CLI executable                               | `node packages/cli/bin/groupi.js --version` returned `0.1.0`                                                     |
| Contributor first focused check                    | Existing shared GDL conformance suite: 49 tests passed                                                           |
| Existing shared suite                              | 434 tests passed (initial script invocation ran the full suite)                                                  |
| Existing authenticated CLI/add-on fixture journeys | 8 tests passed in CLI workflows, add-on authoring and add-on participation files                                 |
| Owned source formatting                            | Passed                                                                                                           |

The authenticated fixture suites use synthetic accounts and Convex test storage.
Expected missing Google/Discord provider configuration warnings were observed.
No live account, secret, hosted mutation or third-party delivery was exercised.

## Search conditions and results

The fixed 40-query acceptance set is in
`packages/portal/tests/search-acceptance.ts`; its independent expected passage
links are recorded in the publishing contract. Tests interact with the rendered
public portal and inspect visible result links, without importing private search
helpers or mocking internal modules.

- Top-three relevance: **39/40 (97.5%)**, exceeding the agreed 90% bar.
- Supported exact fully qualified HTTP operations and CLI commands: **first**.
- Additional regression: `GET /events` returns the v2 collection operation first
  by default and the v1 collection operation with an explicit v1 filter.
- Remaining query miss: `v1 events response` ranks deletion responses above the
  event list response. This remains visible in test output; expectations were
  not relaxed to hide it.
- Latest rendered-query p95: **50.5 ms** in the local Node 22/jsdom runner. This
  includes event dispatch, rendering and reading result links and is not a
  throttled browser or physical-device measurement.
- Compressed index size: **25,724 bytes**, below the proposed 300 KiB budget;
  corpus: **78,714 bytes** compressed. Final integration should remeasure after
  schema regeneration.

## Source and publication boundaries

Curated guides and generated API/CLI reference share one explicit public corpus.
The generator obtains Hono OpenAPI schemas locally without a service or network
request. It records source hashes and emits identical client assets and public
exports. CLI command help remains owned by its existing generator. The source
handler example is copied directly from its allowlisted current implementation.

Generated exports are not an approved registry release or proof of a hosted
instance's compatibility. Self-hosting remains Proposed and outside this scope.
SDK and delegated/bounded auth status pages remain Upcoming until the coordinating
agent integrates their final source contracts and evidence. Parent integration
must regenerate the corpus after stricter backend schemas are incorporated.

## Remaining acceptance

The parent agent owns actual CUA browser verification and the authorized temporary
loopback runtime. This component-test evidence claims no verified viewport size,
physical screen reader session, browser accessibility audit, throttled network
measurement or visual acceptance. Browser observations and any resulting fixes
must be recorded by that coordinating agent.

Independent review, integrated workspace checks, static production build and
CI execution remain parent-owned. No build, server, deployment, package
publication, changeset or push was executed by this implementation agent.
