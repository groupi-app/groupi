# Current Integration Status

This is the authoritative handoff for Invite Lists and Groups integration. The current promotion checkpoint is **2026-10-15, America/New_York**. Earlier deployment records below are historical, not live branch lookups.

## Test promotion checkpoint — 2026-10-15

- User authorized combining the completed quick-win work with everything already on `test`, fully verifying staging, then merging into `main`. Package publication/versioning is separate. Future administrator exceptions still require explicit authorization.
- UI [PR #372](https://github.com/groupi-app/groupi/pull/372) and return-contract [PR #368](https://github.com/groupi-app/groupi/pull/368) are merged into `codex/groups-invite-lists-combined`. The latter merged at `bea0ec409e13d866deb40645272c725c05c6a232`.
- Groups head `a4144fa8` additionally fixes individual Event invitation cleanup in the shared deletion cascade. Both ordinary and account-resolution deletions remove pending/accepted/declined invitations while preserving unrelated Events. The approved patch changeset is included; 23 focused tests and `pnpm check` passed.
- Candidate `codex/groups-test-integration` combines that Groups head, existing `test` at `6d29f19890f995d820e4311fbaeb24f82eb3c12d`, and completed CLI verification [PR #366](https://github.com/groupi-app/groupi/pull/366). Existing `test` includes feature/domain ownership refactors, shared package source/export alignment, CLI pagination, administrative deletion cleanup and staging/CI improvements.
- Integration preserves the relocated notification REST module and adapts its regression import. The sole merge conflict retained the existing 30-second CLI integration-test allowance rather than reducing it to 15 seconds. Canonical Convex declarations are regenerated from the combined source.
- Full package checks, parallel static review and exact staging runtime verification are in progress. No new `test` or `main` merge is claimed by this checkpoint.

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
