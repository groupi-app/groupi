# Current Integration Status

This is the authoritative handoff for Invite Lists and Groups integration. It records the last verified state, **2026-10-09 at 15:08 America/New_York (19:08 UTC)**; it is not a live branch or deployment lookup.

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
