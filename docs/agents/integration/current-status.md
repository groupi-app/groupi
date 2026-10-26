# Current Integration Status

Current feature evidence and historical integration checkpoints. Source verification does not imply live runtime acceptance.

## Table of Contents

- [UI regression candidate — 2026-10-25](#ui-regression-candidate--2026-10-25)
- [Design-language merge integration — 2026-10-25](#design-language-merge-integration--2026-10-25)
- [Design-language implementation — 2026-10-24](#design-language-implementation--2026-10-24)
- [Hosted Discord and Group pages — 2026-10-24](#hosted-discord-and-group-pages--2026-10-24)
- [Discord Group add-on candidate — 2026-10-23](#discord-group-add-on-candidate--2026-10-23)
- [Groups web design refinement — source evidence as of 2026-10-23](#groups-web-design-refinement--source-evidence-as-of-2026-10-23)
- [Universal community integration — source evidence as of 2026-10-19](#universal-community-integration--source-evidence-as-of-2026-10-19)
- [Historical provider checkpoint](#historical-provider-checkpoint)
- [Developer platform candidate — 2026-10-15](#developer-platform-candidate--2026-10-15)
- [Test promotion checkpoint — 2026-10-15](#test-promotion-checkpoint--2026-10-15)
- [Historical staging record — 2026-10-09](#historical-staging-record--2026-10-09)
- [Table of Contents](#table-of-contents)
- [Source and deployment](#source-and-deployment)
- [Verification and open gates](#verification-and-open-gates)
- [Evidence and maintenance](#evidence-and-maintenance)
- [Architecture integration candidate — 2026-10-11](#architecture-integration-candidate--2026-10-11)

## UI regression candidate — 2026-10-25

Implementation source `7a03ca23556b588187f5d9cdf0a8cc2026bbb6c6` on
`codex/ui-regressions-navigation` starts from current `test`
`8fdbc93288fb5050cd3a133959850d97602cd2e3` (remote rechecked unchanged).
This is a local candidate, not a live deployment. The original checkout and
concurrent dependency/documentation work remain untouched.

All thirteen requested fixes are implemented:

1. Home tabs share the content width and attach directly to the panel.
2. Dialog surfaces have no forced white edge; their grid respects narrow widths.
3. RSVP choices keep Maybe intact and expose the selected response accessibly.
4. Navigation attention counts use solid red indicators with capped visual counts.
5. Date options reserve date-button space, wrap complete controls, and align deletion
   with the first date row; native time inputs retain room for their contents.
6. Event forms/dialogs own feedback once; duplicate mutation-hook announcements are removed.
7. Event ownership is in settings, with recipient access retained. Organizer-only
   deletion is a bottom settings card and retains destructive confirmation.
8. Post cards opt out of sticker edges while retaining independent interaction.
9. Compact presence dots retain a visible color core; browser checks confirmed all
   existing presence/status background tokens resolve.
10. Mobile sheets have no forced white edge.
11. The mobile action reads Friends & Groups and has a sheet description.
12. Friends & Groups tabs stay on one scrollable row with visible keyboard focus.
13. Group overview retains content/read-only members; related actions use menus,
    moderation lives in Admissions, personal controls live in membership settings,
    and ownership/deletion safety remains intact. Onboarding retains a confirmed leave escape.

The user also requested a page-matched Event loading skeleton before merging.
Loading and loaded content now share the existing `DetailPageTemplate` and a
shared Event header/title layout; auth, route, membership, query and add-on
pending states use one inert skeleton. Public logistics has its own narrower
shared shell and loading placeholders. Unknown covers, add-ons and permitted
actions are not invented; missing/denied/error behavior remains intact.

Local validation: all 1,478 web tests passed, including 24 new loading/transition
cases. The earlier 1,294 Convex tests passed on unchanged backend source through
the CI-supported `test:no-codegen` command; the root wrapper still requires an
absent `CONVEX_DEPLOYMENT`. `pnpm check` passed, including 811 source/generated
contracts; ten contract-guard tests and token lint passed. Independent navigation
and UI reviewers reported no remaining actionable findings.

An explicitly authorized localhost Storybook session served this source to the
existing in-app browser. Shared surfaces/controls were inspected at desktop,
390px and 320px; actual Group overview/menus/membership controls were inspected
at desktop and 390px against local read-only query snapshots. Screenshots are
internal QA evidence. These fixtures do not establish authenticated application
acceptance. Matching frontend/backend/session, real-device and observed VoiceOver
checks remain open. No login, credentials, backend deployment or real data writes
were performed. The shared Post/Form/List/Poll feature is outside this candidate.

The user approved the exact `@groupi/web` patch summary on 2026-10-25;
`.changeset/quiet-stickers-connected-navigation.md` records it. The earlier push
was denied before execution while approval was pending; its remote-state check
confirmed no branch existed. After approval, the normal push succeeded with all
hooks enabled. [Draft PR #435](https://github.com/groupi-app/groupi/pull/435)
targets `test`; the approved changeset commit is
`cd94e00ba0e7fc975bddf02e4db06206ac5cd91d`. GitHub checks and the automatic Vercel
preview are being monitored on the PR head. Their outcome is separate from the
local fixture evidence above. The skeleton follow-up and its additional patch-note
sentence were approved; the original release-note paragraph is unchanged. Merge
ownership remains with the parent task after the added fix and exact-head hosted
checks are verified. This implementation task has not sent a merge, auto-merge,
or ready-for-review action. No manual deployment is authorized.

## Design-language merge integration — 2026-10-25

- PR #431 combines design source `017fffbf102303e3ce4348aac7e2d96fc079a0a0` with `test` at `621f2dd8f809d8dd121b62e8099a733ba232b1c2`. Their common ancestor is `da5ccb462f8b0ead9a4a32ea405641d5eddd5624`; independent UI and integration work caused conflicts in 15 files.
- Resolutions retain the newer Groups edit/settings routes, decision-email retries, integration post attribution and strict add-on types alongside the design branch’s typography and independent card actions. Both branches’ dependency entries and dated integration evidence are retained.
- This source integration does not establish authenticated migrated-page or native device/screen-reader acceptance. Earlier runtime evidence below remains tied to its original source. No backend deployment or production data mutation is part of conflict resolution.

## Design-language implementation — 2026-10-24

- [Draft PR #431](https://github.com/groupi-app/groupi/pull/431) tracks specification #420 on `codex/design-language-integration`, based on main `13c02494`. Controls and localized usability corrections are integrated; the initial functional-fix patch changeset has explicit user approval.
- Functional corrections, derived theme treatment, and the actual-component gallery are integrated through source `6edd4c27`. Required checks and focused regressions pass. Chromium verification covers all 12 bundled themes, three custom examples, fonts, hover/press, independent card actions, checkbox glyphs, keyboard/menu focus, feedback/retry, narrow layouts, enlarged text and reduced motion. See [execution evidence and task graph](../../design-language-execution.md#rendered-gallery-checkpoint).
- The explicitly authorized local Storybook is running from the integration checkout at `http://127.0.0.1:6006/?path=/story/design-system-soft-lift--overview`, using the production theme adapter. This validates the isolated gallery, not authenticated app/backend behavior.
- The user approved the actual gallery on October 24 and authorized docs-first migration of all components, from primitives through page-specific UI, prioritizing web. #426 is closed and #427 is active. Migrated-screen validation gates the Groups structural review; native parity follows web validation.
- The October 24 sticker-book iteration is integrated through `1e17841b`: white cut edges persist in dark/custom themes, meaningful paper seams and staged people/overlay accents are present, and icons remain selective with none in headings. The user selected flat cut-out labels, attached index tabs, and annotation-strip alerts; these are now canonical opt-in soft treatments. Source `d1e74958` also adds interactive card tint, 12px menu icon spacing, and semantic toast-icon colors. [Material rationale and selected choices](../../design-language-material-review.md) and [runtime evidence](../../design-language-execution.md#sticker-book-review-iteration) supplement the earlier checkpoint; gallery approval is recorded; application migration is in progress.
- Runtime discovery: `test.groupi.gg` exposes preview commit `621f2dd8f809d8dd121b62e8099a733ba232b1c2` and public backend `zany-rooster-824.convex.cloud`; it is signed out in the connected browser and does not contain this migration. No local app server is listening. The repository script guard rejected the authorized Next dev launch; actual local-page validation awaits a user-started runtime.
- Web source migration is integrated at `48a6b6ac`: canonical defaults plus the complete higher-component ledger. `pnpm check`, all web (1,295) and shared (464) tests pass; actual default-component browser checks pass. See [coverage](../../design-language-web-migration.md). Native source parity is integrated through `7a79677e`; final web/shared/mobile suites pass (1,296/464/605 tests), with full checks and Storybook types passing. All reported source findings are corrected. [Native coverage](../../design-language-native-migration.md) records the 220-file scan and runtime limits. Application/device acceptance stays open.
- Source-matched authenticated app runtime, backend binding, isolated test session, native build/device, and observed VoiceOver/TalkBack remain unverified for this source. No backend deployment or production data changes were made. No inherited October 15 runtime result is claimed for this branch.

## Hosted Discord and Group pages — 2026-10-24

- [Test PR #416](https://github.com/groupi-app/groupi/pull/416) merged at `12c177f9c91134d91140b1f79980b3124b915324` after passing required CI and an approved exact-head override. Vercel deployment `dpl_58sM5ypR5woPwh8kbjiFEiq5YFW4` is READY at [test.groupi.gg](https://test.groupi.gg), with the existing `zany-rooster-824` backend. Conditional authenticated E2E was skipped, not passed.
- The deployed Group overview has separate Edit and settings routes. Back navigation reaches the real `/groups` directory. Authenticated checks passed Edit cancellation, save and restoration, mobile navigation at 390 pixels with no horizontal overflow, and keyboard help opening with Enter and restoring focus after Escape.
- Hosted Discord rendering at 390 pixels and natural five-minute credential expiry passed live. After expiry, the API returned HTTP 401 and Return showed clear restart guidance without stale actions or a raw server error. The temporary client grant was revoked, connection disabled, and RAM-only helper stopped; the personal linked account remains intact.
- The user deferred checks needing another Discord identity: ordinary joins/removals/bans, account replacement, staff moderation and representative permission-loss recovery. These are not passing checks. Signing-key rotation remains waived. No production release occurred.
- [Test PR #418](https://github.com/groupi-app/groupi/pull/418) merged at `31448bde57f6ad90108c7509676f13fbe1567978` after its exact-head override was approved and 25 CI checks passed. It includes the compact overview copy/help from superseded, closed #417 plus the hosted Discord visual refinement. Vercel `dpl_41FaUX26soqHJ9p1D6gGXfrSmQfn` is READY; test-domain source metadata and successful Convex deployment log confirm the same existing backend. Conditional authenticated E2E was skipped, not passed.
- The refined hosted page passed real signed-in desktop and 390-pixel browser checks: one heading, compact trusted app identity, icon-led server/account/status, visible consent before Connect, keyboard help with Escape focus return, separated actions, pending and connected states, and registered HTTPS return. The styled expired notice also passed on this source. Full local check and 23 focused hosted tests passed; independent review found no blockers. The latest test connection was disabled, the disposable grant revoked (still-unexpired token returned HTTP 401), and RAM-only helper stopped. The personal Discord identity remains linked.

## Discord Group add-on candidate — 2026-10-23

[Draft PR #414](https://github.com/groupi-app/groupi/pull/414) integrates [spec #404](https://github.com/groupi-app/groupi/issues/404) on `codex/discord-group-integration`, based on `19e071e78738c071977d7305719066724106364e`. Feature and review-fix integration checkpoint: `ff1657d0831c5c647dcc3a07405e0ab03130b5db`; tested implementation tip: `705459b139bb0cb183664dee700e8f99dd69aafa`. Earlier Discord source checkpoints are retained in Git history.

- Both Role and Server membership modes, explicit enrollment, independent moderation, identity retirement, durable cleanup, warned handback, preference-aware manager alerts and scoped delegated/hosted SDK journeys are integrated. Existing Event scheduled-event transport remains separate. Group-provider retry pauses do not claim coordination over every legacy Event request sharing the token.
- Independent Standards and Spec review found six issues; all are corrected and closure-reviewed. Active/pending bindings determine exclusivity. Initial Connect retries preserve explicit consent and recheck current identity, eligibility, configuration and provider authority. Uncertain provider joins retain cleanup obligations. Runtime return validators, indexed predicates, direct same-runtime helpers and shared capability calculation preserve operation-specific permissions.
- Final `pnpm check` and approved code generation pass, including 810 source/generated Convex contracts and SDK freshness. Corrected package coverage totals **4,101 passing tests**: CLI 400, portal 12, web 1,337, Convex 1,279, mobile 598, shared 434, JavaScript transport 8, Python transport 9 and authenticated SDK integration 24. The initial aggregate commands failed on feature-added query mocks and one capability expectation; corrected affected suites and the full web suite passed. This is package-suite evidence, not a claim that the original aggregate invocation exited zero.
- Composed both-mode tests prove native/REST/JavaScript SDK/hosted status agreement through identity retirement, denied cleanup and recovery. Authenticated Event lifecycle tests execute provider create/update/delete effects beside an independent Group connection. Python transport tests are not reclassified as authenticated backend journeys.
- **Live test checkpoint — 2026-10-24:** [test PR #415](https://github.com/groupi-app/groupi/pull/415) merged at `4b3ded32fb41020da4c75a707e3df34a704d6c11` after required CI passed and the user approved its exact-head administrator override. Vercel deployment `dpl_tdASozYscm77yf84g4w4c3LbJExx` is READY at `https://test.groupi.gg`; public source metadata and the successful function-deploy log match the existing `zany-rooster-824` backend. The conditional authenticated E2E job was skipped and is not counted as a pass.
- Controlled live checks passed real email sign-in and Discord linking, manager server discovery, dedicated zero-permission role creation/adoption, explicit Role enrollment, retained-access handback, generation changes and fresh Connect, Server-mode owner exception, unlink cleanup with provider-confirmed role absence, and relinking without automatic enrollment. The scoped native-client PKCE grant used only `groups.discord.read` and `groups.discord.connect`; API and hosted browser status agreed, keyboard Return reached the registered HTTPS callback, and revocation denied its still-unexpired token with HTTP 401. Native-web controls were checked at 390 pixels without horizontal overflow; the hosted page was observed at 735 and 1280 pixels, not verified at 390. Viewport overrides were reset.
- **Remaining live gates:** a separate consenting ordinary Discord identity is needed for real join, kick, ban, replacement, staff moderation and representative permission-loss/recovery checks. The server-owner identity cannot establish those behaviors. Hosted 390-pixel rendering and expired-token continuation remain unverified live; deterministic tests cover the corresponding boundaries. Separate mobile-device or VoiceOver acceptance is not required and remains unclaimed. Signing-key rotation verification remains waived. The test connection was disabled, the test client grant revoked and its RAM-only operator stopped; the disposable Discord role was separately deleted as fixture cleanup after handback had been verified. The linked personal Discord account was restored. No new external project, provider application, server or production change was made.
- The approved five-package minor feature changeset is included. The additional CLI minor handback-acknowledgement entry was approved on 2026-10-24 and is included. [#413](https://github.com/groupi-app/groupi/issues/413) remains open and the PR remains draft until the remaining live acceptance gates are handled. No package versioning or release was performed. See [Discord Group setup](../../discord-group-setup.md).

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

## Shared content creation — 2026-10-26

[PR #436](https://github.com/groupi-app/groupi/pull/436) integrates test `f28087b6`,
preserving PR435's navigation and loading shell. [Feature disposition](../../shared-content-creation.md)
and [schema rollout review](../../shared-content-schema-review.md) describe the
canonical Post parent model, reused tools and contextual Event participation.

The user authorized test-only rollout and isolated fixture access, conditional on
verified backup and acceptance. Authenticated metadata confirms the backend is a
non-default `preview/test`, deployment 6295733 in project 1513112, matching the
public test frontend. Production is outside scope. The branch-specific Vercel
suppression remains in place; it does not disable the existing `test` rollout.

A fresh private data-and-file export, reference
`groupi-test-pre436-1792978139892319883`, passed archive/JSON/identity checks:
532 data records, 133 catalog records, component data included, zero file payloads.
The test backend has no separate Group Post tables, so no record rewrite or data
migration is needed. Configured codegen passed. The candidate backend was deployed
only to the verified preview; protected Event posts, Events, notifications, add-on
configuration/data and saved tools match the pre-candidate backup exactly.

The approved fixture key is configured only on this backend and in GitHub's
existing E2E workflow secret. Acceptance uses new UUID-labelled `example.invalid`
users, direct fixture-token authentication, no notification methods/push tokens or
provider connections, and canonical retirement of only its own fixtures. Secrets,
authentication state, traces and videos are not persisted in reports.

The browser suite checks desktop/narrow creation and reload persistence of all
four content types in both parents, plus legacy Bring List configuration and claim
preservation. Real reactive updates exposed Form/Poll acknowledgments resetting
on revision refresh; stable owner feedback now survives while saved values reseed
and cross-tool drafts remain isolated. Thirty focused tests cover those flows.
Optional Replay loads only when a Sentry DSN is configured, avoiding errors in
unconfigured verification builds without filtering browser errors.

Earlier full source suites passed: backend 1,325, web 1,512, native 655 and shared
466 tests, with unchanged coverage thresholds. Exact-head CI for `f7c942b5` passed
all 22 checks. The rollout checkpoint adds the feedback regressions and real
fixture acceptance; final exact-head checks and authenticated acceptance must
pass before merge. PR #436 records their results and the eventual rollout SHA.
Physical native and observed VoiceOver acceptance remain unverified. Native custom
templates retain browser handoff and native mention autocomplete remains absent
in both editors. No production operation, destructive rewrite or restore is
permitted by this rollout authorization.

## Content UI refinement — 2026-10-26, local only

`codex/content-pages-refinement` starts from freshly fetched test
`5832fe64e0ad96c8322b850befada4b8a2cf27f5` in an isolated worktree. It refines
Form/List/Poll authoring and actual participation, removes creator presets, and
embeds self-contained Poll voting/results cards in Event and Group post feeds.
Deep links and existing backend/data contracts remain intact. See
[the design and verification boundaries](../../content-ui-refinement.md).

The fully local browser fixture exercises actual components/CSS with synthetic
router/data boundaries at desktop and 320/375/390px; it sends no external
notifications or mutations. Authenticated Next route lifecycle and real backend
persistence remain open gates for a separately authorized isolated runtime.
No branch has been pushed, merged or deployed. Automatic Vercel deployment is
suppressed for this exact branch; the exact web patch changeset batch is prepared
but awaits the confirmation required by repository workflow.

### Compact content revision — local follow-up

The supplied poll reference images were visually inspected before a material
compact revision. Polls now save on selection; Lists persist completion directly
and expose text editing only when requested; Forms retain one explicit complete
response submission. Visible History links, redundant participant Save controls
and explanatory chrome are removed without deleting history or changing backend
contracts. Compact inline results reuse option rows and disclose page-scoped
counts. Source and synthetic responsive checks are recorded in the updated
[content design record](../../content-ui-refinement.md). Publication, authenticated
fixture writes and release-note approval remain pending; nothing has been pushed
or deployed.

### List types and collaborative participation — local source

List settings now select Simple/Checklist/Bring, with active creator configuration
rights, manager oversight, scoped add/completion policies and subtle actor
attribution. New owner-scoped Bring ledgers support multiple Events/Groups without
rewriting legacy Event add-on claims. Simple/Checklist switching preserves state;
populated Bring conversions offer a separate list. Shared completion defaults to
participating members as requested; private entry isolation and revoked-membership
checks remain enforced. Published REST shapes are projected compatibly.

The local schema addition is optional metadata plus a new claim table, with no
performed data migration. Codegen is blocked by missing CONVEX_DEPLOYMENT; no
credentials/target were configured and no backend was deployed. Matching runtime
acceptance and rollout remain separately gated. Local source/browser/test
evidence is recorded in the [updated design record](../../content-ui-refinement.md)
and task artifact directory. No publication or shared data operation is implied.

## Local management refinement — 2026-10-26

Local continuation `codex/management-ui-refinement` starts from unpublished `62be9ebe98c7850f601d0048c1acdf80939f9e8e`. It implements the approved walkthrough: atomic Event settings draft Save/Revert, Shared With chips, compact admission/application configuration, automatic lifecycle and preserved expired-poll history, Account/Developer separation, collapsible builder and draft recovery, Discord setup/connection hierarchy, and applicant-first review. See [implementation plan](../../compact-management-ui-plan.md) and ADR0013. No remote branch, PR, backend deployment or shared data has changed.

The proposed creator-timezone default is clearly provisional pending the parent-relayed answer; existing UTC records remain untouched. Reply locking, pinning and announcement-retirement/history policy remain pending and unimplemented. Earlier List rollout/testing/release-note approval is still separate. Checked-in Vercel suppression now names this continuation branch, but project-level enforcement remains unverified; pushing it is not authorized or presumed safe.

Canonical Convex generation was attempted but is blocked by missing CONVEX_DEPLOYMENT; no target or credentials were configured. Local source-derived contract/types, synthetic component browser checks and test backends are distinct from authenticated deployed acceptance. Final results and commit identity are in sibling task artifacts/management-refinement/HANDOFF.md.
