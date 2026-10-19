# Current Integration Status

This is the authoritative integration handoff. The developer-platform checkpoint below is **local source evidence as of 2026-10-15, America/New_York**. Earlier promotion/deployment records are historical, not fresh remote branch lookups.

## Red Room G5 source candidate — 2026-10-15

- Implements selected Group Join with Pending RSVP, explicit own RSVP and independent
  Event/Group Leave with minimal durable receipts. Group Leave preserves Event
  membership and RSVP; current owner/last-Organizer safeguards return typed conflicts.
- Coordinates exact Event Leave `{expectedRevision}`, own-context
  `membership.membershipId`, and Group Leave `{expectedMembershipId}` across backend,
  OpenAPI, generated TypeScript/Python and synthetic fixtures. Durable per-person/Event
  revisions prevent a stale form deleting same-millisecond replacement participation.
- Uses the G3 receipt window/binding/authority boundary. Original committed leave
  replay reconciles after membership removal and does not delete a replacement.
  Native web/mobile confirmation states independent participation consequences.
- Verification: 89 focused native/authenticated HTTP backend tests, 16 web and 37
  mobile confirmation/component tests, 20 real SDK integration tests plus Node/Python
  transport tests pass. Full `pnpm check` includes 756 canonical Convex contracts;
  workspace source resolution and generated SDK freshness pass. Ordinary Group ban
  retains independent Event reads/RSVP/Leave; explicit coordinated exclusion denies them.
- Matching deployed frontend/backend SHA, isolated signed-in browser/device, observed
  VoiceOver and provider acceptance remain unverified G10 prerequisites. Source tests
  and offline application declaration refresh are not deployment/component codegen.

## Red Room G8 source candidate — 2026-10-15

- Explicit coordinated exclusion is persistent and atomic before deferred cleanup,
  with captured Event IDs and generation. Ordinary Group/Event bans and membership
  records are unchanged by initiation. Protected Owner/Organizer authority remains
  independent; staff see committed exclusion separately from pending/blocked cleanup.
- Native staff operations, legacy-key staff REST, generated TypeScript/Python SDKs,
  staff roster controls and own-context exclusion state are source implemented.
  Canonical access/admission/RSVP/invitation/attachment/discussion and audience
  reactivation boundaries fence exclusion despite retained participation.
- Source evidence: 40 focused backend tests plus an additional ongoing RSVP/invite
  acceptance race, two staff component tests, and real SDK HTTP lost-response
  recovery. Repository lint/types/contracts/format and source workspace links pass.
- G9 owns cleanup scheduling/completion proof and reinstatement; exact durable
  generation seam is in the integration contract. Matching deployed frontend/backend,
  isolated staff browser/native sessions and live provider acceptance remain
  unverified G10 gates. No dev/build/deployment or live data mutation was performed.

## Red Room G4 source candidate — 2026-10-15

- Adds delegated `groups.events.read` current Event selection with native parity,
  explicit absence/conflict, authorized pre-Join logistics and retained independent
  Event membership access. Canonical completion uses recorded end at/before server
  time or explicit completion, never a past start alone.
- Existing Event details settings now expose Organizer completion, guarded reopen
  and reschedule beside existing audience and admission controls. Staff lifecycle
  operations share durable UUID receipts and current-role checks. The
  [integration contract](../../red-room-integration-contract.md#g4-current-event-and-staff-lifecycle)
  records exact native/REST/SDK methods and G8 exclusion hook boundaries.
- Source verification passes 56 focused backend tests, 21 Organizer/audience/consent
  component tests, 3 shared permission tests, and real generated Node/Python
  current-Event consumer journeys. SDK transport suites pass 8 Node and 7 Python
  tests, with 17 integration tests; generated client corpus contains 243 methods.
- Runtime readiness for this source: matching deployed frontend/backend SHA,
  isolated authenticated browser identity and live provider/email setup remain
  unverified. Local source tests are separate from G10 deployed acceptance;
  no dev server/build/deployment or live fixture mutation was performed.

## Red Room integration branch — 2026-10-15

- `codex/red-room-integration` starts at developer-platform prerequisite `45d00c14fb18d735b8cd2244400d22233509a5fd`. G1 merges at `3af0db2fc80ebdabcc201de6adc335b2b127f41b`; G2 merges at `bf98d7f29246d25e15e0ebd5219c95aae435070c`. [Draft PR #389](https://github.com/groupi-app/groupi/pull/389) targets a snapshot of that prerequisite, not main. Its prerequisite remains a separate integration/release concern.
- Selected-Group own-context/consent and themed hosted email-link authentication source are integrated. G2 covers account selection, explicit linking, minimal onboarding, consent and safe recovery; combined merger verification passed 27 backend and 13 web tests, workspace source resolution and unchanged tested worker tree. G1 evidence is recorded below.
- Application mutations (G3) are integrated at `d7de0d39c42ec50ac9775b65f4d3974c28101f0a` from worker `49452d9b`; current Event discovery/completion (G4) remains in progress. [Site draft PR #9](https://github.com/TheiaSurette/bound-in-red/pull/9) has public entrance, server session and application lifecycle merged; the single Event view is in progress. All current implementer and merger agents use GPT-6.1 Sol.
- These are source milestones. The normal GitHub preview for `bf98d7f` was BUILDING when inspected; matching frontend/backend source, hosted authentication, approved sender and actual mail delivery remain unverified. Full component-aware codegen requires deployment configuration. No production deployment, live fixture mutation or package publication is claimed. G10 and site B7 retain real deployed acceptance gates.
- Concrete changeset summaries and package/bump choices are being collected for the repository-required user approval batch; no new Red Room changeset files have been created.

## Red Room G3 source candidate — 2026-10-15

- Worker `codex/red-room-g3` started from integration `3af0db2f`. Shared authority/receipt checkpoint `5fe2ceed` exports `authorizeCommunity` and the reusable `operationReceipts` helper. This candidate adds selected-Group own-application HTTP writes, generated TypeScript/Python consumers, saved-snapshot edits, required delegated concurrency revisions and minimal replay receipts.
- Combined merger checks passed 60 backend, 17 web, eight mobile, eight Node SDK, seven Python SDK and 17 SDK integration tests, plus workspace source resolution. The official offline declaration refresh produced no combined-source diff.
- Receipt window is 30 days; permanent recognized-ID tombstones retain hashes and minimal IDs/status/revisions, never application answers. Live credential/grant/app/account/selected-Group authority is rechecked inside every write/replay transaction. Canonical Group application data remains the sole source of questions, answers and decisions.
- Passing local gates: `pnpm check` (740 contracts), workspace source resolution, 65 focused backend tests, 16 web tests, eight mobile tests, generated SDK transport tests (eight TypeScript/seven Python), and 17 SDK integration tests including real TypeScript/Python delegated TLS application journeys. Source evidence includes authenticated HTTP/domain lifecycle, scope/privacy/revocation, monotonic same-millisecond revisions, lost responses, mismatch/expiry, fresh decline/reapply, staff replay without re-admission, and generated SDK consumer tests. Web/mobile existing review views forward observed revisions. Local checks do not establish deployed provider/browser/email acceptance.
- Full component-aware `pnpm generate` is unavailable without `CONVEX_DEPLOYMENT`; the official offline application declaration refresh preserves component/runtime declarations. No runtime, build, deployment, push, issue update, PR or changeset is performed. G10 live acceptance and the coordinator's release batch approval remain open.

## Red Room G1 source candidate — 2026-10-15

- Worker branch `codex/red-room-g1` starts from integration base `45d00c14`. G1 adds selected-Group delegated applicant consent and an authoritative own-context HTTP read with generated TypeScript/Python SDK consumers. Its shared appearance dependency is cherry-picked from G2; G2 owns the full hosted authentication journey.
- [The versioned integration contract](../../red-room-integration-contract.md) publishes exact implemented/proposed operation mappings, typed intent/results, error/replay/reconciliation rules and synthetic fixtures at `@groupi/sdk/community-contract`. G3–G9 remain explicit implementation milestones; unsupported operations have no live SDK stubs.
- Source checks cover real protocol/HTTP reads, saved snapshots/history versus membership, scoped authority/revocation/expiry, pagination and private projections, both SDK consumers, fixture schema/service unavailability, and consent/settings UI. This is local source evidence, not deployed acceptance.
- Frontend/backend source matching, isolated live browser identity and provider/email delivery are unverified for this candidate. Full component-aware codegen lacks `CONVEX_DEPLOYMENT`; official offline application API refresh preserves existing component/runtime declarations. No server, build, deployment, live data mutation, push or PR is performed. Existing schema migration and security gates remain open through G10.
- Proposed changeset batch is awaiting coordinator/user approval; no G1 changeset is created.

## Developer platform candidate — 2026-10-15

- Local branch: `codex/developer-platform`, based on `da5ccb462f8b0ead9a4a32ea405641d5eddd5624`. Integrated checkpoints include SDK `bf5ce504`, authorization `b93e9c93`, consent UI `dd91dfdd`, and delegated protocol `44eb6930`, `c56b8835`, `95c08f54`. Final integration artifacts include the combined lockfile, generated portal corpus, cleanup schedule and verification record in this commit.
- Scope: static developer portal, strict TypeScript/Python SDK candidates, bounded user/integration credentials, independent discussion authorship, delegated sign-in and app review, and concrete backend query/mutation types. Self-hosting and encryption remain excluded. All parallel agents used GPT-6.1 Sol.
- `pnpm check` passes, including 735 generated and source query/mutation contracts with no loose-type exceptions. All 2,696 client/shared/CLI tests pass; SDK 25 and portal 11 pass. The backend full run passed 1,051 tests with one stale author assertion; after adding its required `kind: 'user'` expectation, the complete 20-test Posts suite passed. Three negative contract-guard tests pass. See [the detailed verification record](../../developer-platform-verification.md).
- The portal's approved temporary loopback server was used for desktop/narrow browser checks and then stopped. Portal exports are regenerated and freshness checked. Clean SDK tarball/wheel installs and strict installed consumers pass locally; no registry publication is claimed.
- Portal evolution documentation follow-up: the maintainer selected optional Convex subscription modules, a dependency-free REST core, separate durable delivery and recommended design defaults. [ADR-0007](../../adr/0007-optional-convex-sdk-subscriptions.md) and the [canonical design outline](../../api-sdk-evolution-design.md) feed `/v2/api-sdk-evolution`, with 26 Proposed passages, searchable/downloadable alongside the existing SDK guide. The corpus now has 15 pages, 661 passages and 35 exports. All 12 portal tests pass, including a regression keeping current OpenAPI controls off the future-design page; type/lint/token/freshness checks and five targeted design searches pass. These are documentation changes: realtime, durable feeds and complete runtime validation remain future implementation targets, and browser verification was not repeated for this follow-up.
- Independent reviews addressed consent browser binding, identity correlation, token scope ceilings, file projections, recovery, contract-guard erasure and consent expiry/selection. Actual application auth-screen browser checks, native runtime/VoiceOver, hosted CI matrix and external security assessment remain open gates.
- No PR, push, deployment or live database migration was performed for this candidate. The narrowed storage schema requires the [two-stage audit and normalization rollout](../../strict-backend-contract-rollout.md). Delegated issuer keys/cookies and matching application/backend environments still need operator configuration and runtime verification.
- The user approved all four changeset summaries and package/bump choices; the separate portal, SDK, authorization and strict-contract changesets are included. Earlier Groups promotion permissions do not authorize publication or deployment of this new candidate.

## Test promotion checkpoint — 2026-10-15

- User authorized combining the completed quick-win work with everything already on `test`, fully verifying staging, then merging into `main`. Package publication/versioning is separate. The user authorized the existing administrator exception for PR #373 and the subsequent verified test-to-main promotion; repository protection rules remain unchanged.
- UI [PR #372](https://github.com/groupi-app/groupi/pull/372) and return-contract [PR #368](https://github.com/groupi-app/groupi/pull/368) are merged into `codex/groups-invite-lists-combined`. The latter merged at `bea0ec409e13d866deb40645272c725c05c6a232`.
- Groups head `a4144fa8` additionally fixes individual Event invitation cleanup in the shared deletion cascade. Both ordinary and account-resolution deletions remove pending/accepted/declined invitations while preserving unrelated Events. The approved patch changeset is included; 23 focused tests and `pnpm check` passed.
- Candidate `codex/groups-test-integration` combines that Groups head, existing `test` at `6d29f19890f995d820e4311fbaeb24f82eb3c12d`, and completed CLI verification [PR #366](https://github.com/groupi-app/groupi/pull/366). Existing `test` includes feature/domain ownership refactors, shared package source/export alignment, CLI pagination, administrative deletion cleanup and staging/CI improvements.
- Integration preserves the relocated notification REST module and adapts its regression import. The sole merge conflict retained the existing 30-second CLI integration-test allowance rather than reducing it to 15 seconds. Canonical Convex declarations are regenerated from the combined source.
- [PR #373](https://github.com/groupi-app/groupi/pull/373) merged into `test` at `9ffbb2bead87f337c64d9370596a33ea781a2ce9`. All 20 executed hosted checks passed; the automatic authenticated-E2E job was intentionally skipped and is not counted as a pass. Local `pnpm check`, 3,685 package tests, 15 readiness tests and CLI documentation checks passed. Parallel backend, security and frontend architecture review found no confirmed blockers in inspected paths.
- That exact test source deployed READY as Vercel `dpl_AQ3DunvdqhYPqJHtYxPwCgtzNPKg`, immutable `https://groupi-cafv0ahia-theias-stuff.vercel.app`, served by `test.groupi.gg` with preview backend `scintillating-bullfrog-511`. Alias and immutable source/environment/backend bindings and trusted authentication origins matched before disposable fixture creation.
- Authenticated staging checks passed completed Group onboarding, private Form/Poll/List records and retained histories, notification null/object return contracts and pagination, account responsibility enumeration, installed CLI reads, and both Event deletion paths. All four targeted accepted/pending invitation rows were absent after deletion; an unrelated invitation remained unchanged. A browser Bring List claim persisted after reload, matched native and REST reads, and an identical REST retry kept one data row. Invite List save persisted its name and recipient, retained owner-only access, and sent no invitations. Keep Editing and Discard behaved correctly.
- Narrow-screen verification exposed a long Event-title withdrawal action overflowing the Group page at 390 pixels. The follow-up limits that action to its container and wraps its label; this checkpoint records the defect before its hosted re-verification. Production remains gated on the final test source's checks, responsive recheck and fixture cleanup. No production merge is claimed here.
- Cleanup additionally exposed duplicate add-on data deletion: Bring List lifecycle cleanup removes participant rows before the shared Event cascade deletes its stale snapshot. The Event transaction rolls back. A focused regression repair and fresh enabled-add-on deletion verification are required before promotion; disabling only the disposable add-on is a cleanup workaround, not acceptance of the bug.
- Detailed source-bound CI, runtime, screenshots and cleanup evidence is maintained at `/Users/theia/.codex/artifacts/test-promotion-2026-10-15/verification.md`. Native device/VoiceOver checks remain explicitly deferred. Known Sentry replay-integration load errors recur without blocking observed flows.

The exact `d1d9ddba` isolated repair preview already passed authenticated Form/Poll/List participation, privacy, retries, retained history after Group departure, account resource enumeration and Event application pages. Earlier `9de60662` passed ownership-transfer/deletion and Group notification announcement/null projections. All disposable data, API keys, sessions and temporary access were removed with exact cleanup receipts. These are evidence for those sources, not a substitute for the combined staging verification.

Native device/VoiceOver checks remain explicitly deferred by the user because installed builds predate Groups. Browser Back/Forward draft guards passed; the native unload warning remains unverified. Browser console recorded Sentry replay-integration loading errors without blocking the observed flows. Workstation evidence: `/Users/theia/.codex/artifacts/groups-verification-2026-10-14/verification.md`.

## Historical staging record — 2026-10-09

The following tables retain the previous checkpoint at **2026-10-09 15:08 America/New_York**. They do not describe the current promotion candidate.

## Table of Contents

- [Source and deployment](#source-and-deployment)
- [Verification and open gates](#verification-and-open-gates)
- [Evidence and maintenance](#evidence-and-maintenance)

## Source and deployment

| Boundary          | Last verified state                                                                                                                                                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Combined feature  | `codex/groups-invite-lists-combined` at `a087e7ac68bf20ca2c4ed925e80f06638bb4b80a`; [PR #282](https://github.com/groupi-app/groupi/pull/282) targets main                                                                    |
| Staging candidate | `ce89496072d7fcb587268794db472ec90de2e895`; combined feature plus test-domain authentication correction                                                                                                                      |
| Test merge        | [PR #284](https://github.com/groupi-app/groupi/pull/284), merged 2026-10-09 19:01:57 UTC; [`6ed7d0cfb68d261d4a7791d2ea1a8734cfea542d`](https://github.com/groupi-app/groupi/commit/6ed7d0cfb68d261d4a7791d2ea1a8734cfea542d) |
| Main              | `c307c779fd6907936c34303ac34f755c7fa266db`; this feature was not merged into main                                                                                                                                            |
| Frontend          | [test.groupi.gg](https://test.groupi.gg), Vercel `dpl_2XpPrxZoxv48p1PjVasitZu9BpRy`, READY at 19:07:22 UTC for exact test merge SHA                                                                                          |
| Backend           | Preview named `test`, `https://peaceful-wren-166.convex.cloud`; public config reported branch `test` at 19:05:58 UTC                                                                                                         |

Both Invite Lists (#254–259) and Groups (spec #261, tickets #263–281) are included. Initial staging PR #283 was superseded by #284. The user authorized the test merge and administrator override after all candidate checks passed; no repository rules were changed. That approval does not authorize future administrator overrides or production releases.

## Verification and open gates

Observed before/after staging integration:

- Final candidate hosted checks and Vercel passed, including all six CLI platform/Node combinations. The earlier Windows notification timeout passed on an unchanged retry; its original evidence remains preserved.
- Live health/OpenAPI and signed-out auth returned 200. Backend reported Invite Lists capability v2 (24-hour replay retention), Groups v1, five Invite List paths, and 54 Group paths.
- Isolated Chrome reached Settings Invite Lists and redirected to visible sign-in with zero page errors. This proves signed-out routing, not authenticated navigation.

Remaining gates:

1. An isolated signed-in test session, then actual Keep Editing / Discard / Back / Forward / unmount checks. The question about disposable preview-only accounts versus an owner-provided session was unanswered at this snapshot; account provisioning remains unapproved.
2. A matching native build/device and observed VoiceOver focus/announcements. The Oct 9 inventory had zero booted simulators; no device/app was started.

Draft-navigation checks must not send invitations or modify existing users' saved lists. Unknown-history manual recovery remains accepted and the Settings Discard fix is included. Production merge/deployment and package versioning/release have not been performed.

## Evidence and maintenance

Historical evidence remains untouched outside this repository, in the originating workstation directory `/Users/theia/Documents/Codex/2026-10-03/task-4/planning-docs/`:

- `invite-lists-staging-checkpoint.md` retains its original relative links to logs, screenshots, and scripts.
- `verification-test-e2e-config.json` records public runtime configuration.
- `verification-test-backend-summary.json` records backend verification.
- `verification-test-invite-list-smoke.json` records the Chrome smoke check.

These artifacts are workstation-local and are not required to resolve repository documentation links.

For portable source/merge evidence, use the exact GitHub commit and PR links above. Live URLs may move; a successful response today does not reproduce this snapshot.

When integration changes, update this file rather than creating another competing current-status memo. Record the new as-of time, exact source/base/merge SHAs, PR state, frontend deployment, matching backend, completed checks and open gates. Verify remote refs/deployment metadata before calling a state current; preserve historical evidence separately and link it here. Keep ownership boundaries and any new permissions explicit in the handoff. A feature is not fully verified merely because it is deployed.

## Architecture integration candidate — 2026-10-11

The architecture work is integrated on `codex/architecture-modularity-test`
from `test` base `70ee9c3c`. It adds feature-owned add-ons, domain-owned backend
operations, shared GDL, and source-first shared package resolution. The approved
patch changeset is `.changeset/metal-rings-sell.md`; no schema migration is needed.
Current lint, types, formatting and source resolution pass. Web (1,248), mobile
(580), shared (434), and CLI (399) tests pass; the CLI required one unchanged
retry after a timeout. All 1,010 backend tests also pass after preserving admin event deletion
cascades. [PR #290](https://github.com/groupi-app/groupi/pull/290) records hosted
checks. Its first Vercel attempt exposed a shared source module-format issue;
the candidate corrects ESM semantics and compiled publication paths. Earlier
deployment evidence above remains historical.

The user authorized merging this candidate into `test` with administrator
override only after all checks are green. This does not authorize production
release. Browser/native verification has not run for this candidate; matching
runtimes and an isolated signed-in session remain unverified.

## Red Room G6 source candidate — 2026-10-15

- `codex/red-room-g6` adds server-set application source app/grant linkage, administrator-approved `appearance.statusReturnUrl`, branded decision mail with operator-owned sender mailbox, durable per-application dispatch and staff retry controls on web/mobile. Decision and admission remain committed through delivery failure. Native reads and selected-Group HTTP/generated TypeScript/Python own-context expose recipient-free optional delivery state.
- Global email/type settings and DND apply independently of announcement subscription, at decision and dispatch. Frozen messages carry provider idempotency keys; retries preserve the same message and stop after 23 hours, before the provider's 24-hour key horizon. Current manager authority gates retries; current source app/grant/account/preferences gate queued delivery. Group/account/application cleanup removes private dispatch payloads. Approved messages also recheck Group eligibility; declined messages remain accurate despite later admission ineligibility.
- Trusted Groupi `/application-status/{applicationId}` authenticates the applicant, distinguishes historical approval from current membership and offers the exact approved site return only with live selected-Group/read authority. Bound in Red's configured destination is `https://<site-origin>/red-room/application`; the site must authenticate and reread authoritative context. No applicant email, answer, token or provider error is passed to the app.
- Local evidence includes lost decision/provider responses, retry key reuse, suppression, source app deletion/suspension, queued application deletion, native sender defaults, retry horizon, former membership, unrelated account return denial, and web/mobile retry-only controls. Matching deployed frontend/backend revisions, isolated authenticated browser/device sessions, actual sender/domain verification and inbox/return acceptance are **unverified** and remain G10 gates. Full `pnpm generate` is unavailable without `CONVEX_DEPLOYMENT`; the official offline helper preserves component/runtime declarations. No runtime/build/deployment, push, PR/issue mutation or changeset file is performed.
