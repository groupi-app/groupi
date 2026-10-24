# Current Integration Status

## Discord handback and teardown — source evidence as of 2026-10-23

- Source branch `codex/discord-group-410`, based on integration `272c8eefc3b5c2083bb18c243a76640882b7b63a`. Shared transactional handback stops new grants, retains roles/membership under Discord staff, and preserves owed cleanup and in-flight compensation across disable, reconfiguration and deletion. Connection epochs never reset on re-enable; setup completion also requires its exact reservation epoch.
- Native settings and deletion confirmations explain handback. Group-owner deletion accepts explicit acknowledgement through authenticated native and REST query interfaces; the CLI forwards an explicit acknowledgement flag. Existing owner/cascade/exclusion restrictions remain enforced. Recorded managers/deleting actors can read retired cleanup status without a live Group; other actors cannot.
- Deterministic authenticated/provider tests cover warning, monotonic re-enable, retained access/fresh Connect after mode change, deleted-Group status authorization, partial grant retirement and cleanup retry. Native web/mobile tests exercise explicit acknowledgement. Runtime/browser/device/VoiceOver and controlled Discord checks remain unverified: no matching deployed feature/session/provider credentials were established and no runtime/build/deployment or live guild mutation was performed.
- Identity integration (#409), shared recovery/notifications/audit-gap hardening (#411), delegated integration (#412), and live nonproduction acceptance remain rollout gates. See [warned handback](../../discord-group-setup.md#warned-handback-and-deletion).

## Discord Server membership — source evidence as of 2026-10-23

- Source branch `codex/discord-group-408`, based on integration checkpoint `02701b30a6a2032e305a77acfe25774e7e44acde`. Server membership uses the existing shared enrollment, grant fencing, immutable cleanup, audit and snapshot dispatcher. Explicit consent adopts or joins eligible members; setup excludes every other Group binding without purging the guild population.
- Ordinary departure/removal/onboarding suspension kicks, while Group bans/coordinated exclusion ban. Discord bans remain independent and are never automatically lifted. Known owner/hierarchy exceptions are captured at Connect; later permission loss remains blocked cleanup. Numeric snowflake ordering handles equal-position roles. Both web and native expose membership consent, screening, status and exception guidance.
- Deterministic API/provider tests cover both modes, consent/screening, moderation and fresh Connect, kick/ban/exclusion, restored ineligible membership, permission recovery, ban-lookup errors, hierarchy ties and a late join after generation change. Approved preview generation and full `pnpm check` pass, including 797 source/generated contracts; 157 backend tests across 16 suites, ten web tests and five mobile tests pass. Live Discord/browser/device acceptance remains unverified.
- No live guild mutation or rollout. Identity retirement (#409), warned teardown (#410), shared recovery/notifications/audit-gap hardening (#411) and controlled nonproduction acceptance remain release gates. Existing test bot/OAuth credentials and matching signed-in runtimes remain unavailable or unverified. See [Server membership lifecycle](../../discord-group-setup.md#server-membership-lifecycle).

## Discord Group Role revocation — source evidence as of 2026-10-23

- Source branch `codex/discord-group-407`, based on Discord integration checkpoint `429f4a70`. Group leave/removal/ban/coordinated exclusion now revoke enrolled Role authority at owning domain boundaries. Required onboarding reconfiguration checks existing enrollments in bounded pages. Returning eligibility requires explicit Connect; immutable cleanup targets survive deleted configuration.
- One shared Role reconciler performs bounded prioritized cleanup, targeted provider observations and persisted guild/action audit ingestion with deduplication and recent-history overlap. Removed-then-restored staff access invalidates enrollment when observed. Ineligible restored managed roles are removed again; unrelated roles and handed-back access remain outside management. Pending cleanup and observation failures are visible to members and managers. Exclusion UI explicitly distinguishes Event cleanup from independent Discord cleanup retained through reinstatement.
- Deterministic verification: 126 backend tests across 12 Discord/auth/Group lifecycle suites pass, including 56 Group Discord tests. Preview code generation and full `pnpm check` pass, including 797 source/generated contracts; 11 web and four mobile tests pass. Source tests do not establish live provider/browser/device acceptance.
- No rollout or real guild mutation. Server membership (#408), identity retirement (#409), warned teardown (#410), and shared recovery/notification/audit-gap hardening (#411) remain integration gates. The initial bounded audit mechanism has no atomic ordering with staff actions or complete-history guarantee; #411 extends this same reconciler. Matching deployed source, existing test bot/OAuth resources, isolated signed-in browser/device and assistive-technology acceptance remain unavailable or unverified. See [the Role lifecycle contract](../../discord-group-setup.md#role-eligibility-and-moderation-lifecycle).

## Discord Group Role enrollment — source evidence as of 2026-10-23

- Source branch `codex/discord-group-406`, based on the Discord integration setup checkpoint `3da6bb1a`. Explicit eligible member Connect now separates account linking, scoped join consent and managed enrollment. Web and native Group views show the linked Discord identity, current eligibility, screening/access progress, external owner/Administrator exceptions and Open Discord. Ordinary Discord sign-in retains its existing scopes and prompt behavior.
- Bot-only initial role work persists intended access, enrollment/connection generations, attempt leases and retries. Current membership/onboarding, linked identity, ban state, dedicated-role safety and bot capability fence grants. Stale writes retain exact independent cleanup targets before compensation. Actor-aware domain operations are reusable by later transports; delegated initiation/status endpoints remain subsequent work.
- Verification passes: the Discord Group suite contains 36 tests, and the eight backend Discord/auth/onboarding suites pass 84 tests together. Web Group/Discord suites pass 17 tests; mobile passes nine. Approved preview code generation and full `pnpm check` pass, including seven-package lint/types, 790 source/generated Convex contracts and repository formatting. These are deterministic source checks, not live provider/browser/device acceptance.
- No production rollout or live guild mutation. Ongoing moderation observation/audit ingestion, revocation, identity retirement, handback and shared provider recovery remain release gates. Matching deployed source, isolated signed-in browser/device, live bot credentials and assistive-technology acceptance are unverified. See [the setup and enrollment contract](../../discord-group-setup.md).

## Groups web design refinement — source evidence as of 2026-10-23

- Uncommitted review batch on `codex/refine-group-pages`, based on provider feature `865859b4`: Group detail and unlisted landing identity, tool navigation, Groups chooser, member roster, and shared Event layout. Existing data hooks, permission branches, onboarding, applications, confirmations, and management operations remain intact.
- `pnpm check` passes (seven-package lint/types, 774 source/generated contracts, repository formatting). Seven existing web behavior suites pass: 85 tests covering Groups, invitations, applications, questionnaire, moderation, shared Events, and ownership transfer. Token lint reports no violations in the changed components; its 30 existing warnings remain in three unrelated files.
- Runtime gates remain open: no deployed frontend includes this uncommitted batch, matching frontend/backend source is unverified, and an isolated signed-in browser session has not been established. Desktop/narrow-screen rendering, dark mode, keyboard focus, and actual assistive-technology behavior still require runtime observation. No local server/build, deployment, commit, or push was performed.
- Approved release note: `@groupi/web`, patch — “Refine Group pages with clearer identity, compact tool navigation, and responsive member and shared Event layouts.” Recorded in `.changeset/refine-group-pages.md`; no package versioning or publication was performed.

## Universal community integration — source evidence as of 2026-10-19

- The source integration includes selected-Group delegated own-context and application writes, independent Event Join/RSVP/leave, Group leave, configurable hosted app appearance, decision delivery, explicit announcement opt-in, and coordinated exclusion cleanup/reinstatement. The provider baseline is `45d00c14`.
- The public integration contract is named `community.v1`; see [Community integration contract](../../community-integration-contract.md). Its routes and scopes accept the explicitly selected Group and verified app configuration. No particular client app, domain, callback path, Group identity or branded presentation is a provider default.
- Fresh Group admission defaults announcement consent off. Exclusion is immediate; cleanup respects independent Event authority, completion history and generation fences. Explicit reinstatement restores no membership, invitation, RSVP, ban or subscription.
- Canonical pagination return validation and independent account-profile/developer-registration form ownership are verified. Current source checks pass: 1,144 backend tests, 1,303 web coverage tests, 21 SDK integration tests, eight Node transport tests, eight Python tests, 12 portal tests, generated SDK/portal freshness, and the full seven-package check with 772 canonical contracts.
- The exact nine-entry release-note batch was approved on 2026-10-19; the approved entries are included. Filenames are descriptive bookkeeping, while approved package bumps and summary bodies remain unchanged. No versioning, publication or production deployment is implied.
- Hosted deployment, isolated app/Group identities, operational signing keys, email/inbox delivery, browser/native accessibility and independent security review require explicit runtime evidence. Source tests and generated fixtures do not establish live acceptance.

## Historical provider checkpoint

This is the authoritative integration handoff. The developer-platform checkpoint below is **local source evidence as of 2026-10-15, America/New_York**. Earlier promotion/deployment records are historical, not fresh remote branch lookups.

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
