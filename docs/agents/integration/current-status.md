# Current Integration Status

This is the authoritative integration handoff. Each dated section records its own source and verification scope; older deployment records are historical, not live branch lookups.

## Design-language implementation — 2026-10-24

- [Draft PR #431](https://github.com/groupi-app/groupi/pull/431) tracks specification #420 on `codex/design-language-integration`, based on main `13c02494`. Controls and localized usability corrections are integrated; the initial functional-fix patch changeset has explicit user approval.
- Functional corrections, derived theme treatment, and the actual-component gallery are integrated through source `6edd4c27`. Required checks and focused regressions pass. Chromium verification covers all 12 bundled themes, three custom examples, fonts, hover/press, independent card actions, checkbox glyphs, keyboard/menu focus, feedback/retry, narrow layouts, enlarged text and reduced motion. See [execution evidence and task graph](../../design-language-execution.md#rendered-gallery-checkpoint).
- The explicitly authorized local Storybook is running from the integration checkout at `http://127.0.0.1:6006/?path=/story/design-system-soft-lift--overview`, using the production theme adapter. This validates the isolated gallery, not authenticated app/backend behavior.
- The user approved the actual gallery on October 24 and authorized docs-first migration of all components, from primitives through page-specific UI, prioritizing web. #426 is closed and #427 is active. Migrated-screen validation gates the Groups structural review; native parity follows web validation.
- The October 24 sticker-book iteration is integrated through `1e17841b`: white cut edges persist in dark/custom themes, meaningful paper seams and staged people/overlay accents are present, and icons remain selective with none in headings. The user selected flat cut-out labels, attached index tabs, and annotation-strip alerts; these are now canonical opt-in soft treatments. Source `d1e74958` also adds interactive card tint, 12px menu icon spacing, and semantic toast-icon colors. [Material rationale and selected choices](../../design-language-material-review.md) and [runtime evidence](../../design-language-execution.md#sticker-book-review-iteration) supplement the earlier checkpoint; gallery approval is recorded; application migration is in progress.
- Runtime discovery: `test.groupi.gg` exposes preview commit `621f2dd8f809d8dd121b62e8099a733ba232b1c2` and public backend `zany-rooster-824.convex.cloud`; it is signed out in the connected browser and does not contain this migration. No local app server is listening. The repository script guard rejected the authorized Next dev launch; actual local-page validation awaits a user-started runtime.
- Source-matched authenticated app runtime, backend binding, isolated test session, native build/device, and observed VoiceOver/TalkBack remain unverified for this source. No backend deployment or production data changes were made. No inherited October 15 runtime result is claimed for this branch.

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
