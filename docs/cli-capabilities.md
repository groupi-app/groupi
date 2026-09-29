# CLI capability checklist

Use this checklist when implementing CLI tickets or verifying the core release.
The [CLI specification](https://github.com/groupi-app/groupi/issues/100) defines
the contracts; each linked ticket owns its acceptance criteria. REST route
availability alone does not establish parity with the web and mobile apps.

## Status and evidence

**Implemented; verification pending** means code is being delivered but all ticket
acceptance evidence has not yet been recorded. **Pending** means the CLI capability
is not delivered. Mark an entry **Verified** only with a commit, check results, and
any required installed-package or staging evidence. Keep local tests, hosted CI,
staging checks, and production deployment status distinct.

| App capability or release requirement                         | CLI coverage                                                                                                                                     | Owner                                                   | Status                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------- | --------------------------------- |
| Event list and event details; selected account and deployment | Installable executable, help/version, named profiles, environment/stdin API keys, human/JSON output, bounded pagination and read retries         | [#222](https://github.com/groupi-app/groupi/issues/222) | Verified; merged in #244          |
| Explicit sign-in and account credential management            | Session-bound browser authorization, OS credential storage, status, logout, expiry, and profile isolation                                        | [#223](https://github.com/groupi-app/groupi/issues/223) | Verified; delivered in #246       |
| Create/edit an event and its basic schedule                   | App-equivalent validation and authorization, organizer membership, duplicate prevention and lost-response recovery                               | [#224](https://github.com/groupi-app/groupi/issues/224) | Implemented; verification pending |
| Invite people and respond to invitations                      | Supported email, username and link invitations; inspect/manage, accept/decline, membership transitions and notifications                         | [#225](https://github.com/groupi-app/groupi/issues/225) | Pending                           |
| RSVP, availability, attendance and date selection             | Submit responses, inspect permitted attendance, finalize/reset dates with time-zone and notification parity                                      | [#226](https://github.com/groupi-app/groupi/issues/226) | Pending                           |
| Notifications and event/discussion subscriptions              | Paginated unread/all notifications, read/clear actions, mute/unmute and delivery suppression                                                     | [#227](https://github.com/groupi-app/groupi/issues/227) | Pending                           |
| First complete planning workflow                              | Installed staging workflow with organizer/attendee identities; independent versioning, registry rights and public beta publication               | [#228](https://github.com/groupi-app/groupi/issues/228) | Pending                           |
| Event discovery and membership management                     | Browse/join discoverable events, visibility, event permissions, roles, member removal/leaving and event deletion                                 | [#229](https://github.com/groupi-app/groupi/issues/229) | Pending                           |
| Event posts                                                   | Create/read/edit/delete, text/Markdown/explicit sanitized HTML, validated mentions, notifications, shared limits and legacy-content preservation | [#230](https://github.com/groupi-app/groupi/issues/230) | Pending                           |
| Discussion replies                                            | Create/read/edit/delete with the same content, permission, mention, notification and legacy-limit rules                                          | [#231](https://github.com/groupi-app/groupi/issues/231) | Pending                           |
| Post/reply file attachments                                   | Local upload, list/remove, ownership validation, atomic submission and orphan cleanup                                                            | [#232](https://github.com/groupi-app/groupi/issues/232) | Pending                           |
| Event covers and account avatars                              | Image upload, replacement/removal, distinct media rules, ownership and cleanup                                                                   | [#233](https://github.com/groupi-app/groupi/issues/233) | Pending                           |
| Friendships and blocked users                                 | Requests, acceptance/decline/cancellation, friendship list/removal, block/unblock and privacy side effects                                       | [#234](https://github.com/groupi-app/groupi/issues/234) | Pending                           |
| Profile and preferences; security-sensitive account actions   | Profile fields, privacy, notification/theme preferences and the approved browser handoffs below                                                  | [#235](https://github.com/groupi-app/groupi/issues/235) | Pending                           |
| Existing event add-on configuration                           | Enable/disable/inspect/configure bring lists, questionnaires, reminders, Discord and existing custom add-ons with app lifecycle rules            | [#236](https://github.com/groupi-app/groupi/issues/236) | Pending                           |
| Existing event add-on participation                           | Supported submissions, opt-outs, built-in workflows and custom field actions with participant isolation                                          | [#237](https://github.com/groupi-app/groupi/issues/237) | Pending                           |
| Everyday interactive planning                                 | Keyboard event/invitation/RSVP screens using shared command services, periodic/manual refresh and stale/offline state                            | [#238](https://github.com/groupi-app/groupi/issues/238) | Pending                           |
| Everyday interactive discussion                               | Post/reply and attachment workflows, safe editing and documented advanced editor/CLI fallback                                                    | [#239](https://github.com/groupi-app/groupi/issues/239) | Pending                           |
| Everyday interactive social activity                          | Friends and notifications with shared confirmation, refresh and reconnect behavior                                                               | [#240](https://github.com/groupi-app/groupi/issues/240) | Pending                           |
| Agent use of supported app workflows                          | Portable usage skill, generated versioned command reference, JSON/error and safe-mutation guidance                                               | [#241](https://github.com/groupi-app/groupi/issues/241) | Pending                           |
| Complete ordinary-user and event-manager release              | Capability audit, installed staging workflows, real OS credential stores, manual TUI checks and public release verification                      | [#242](https://github.com/groupi-app/groupi/issues/242) | Pending                           |
| Custom add-on definition authoring                            | Definition creation/editing and validated import/export                                                                                          | [#243](https://github.com/groupi-app/groupi/issues/243) | Pending; explicitly deferrable    |

## Approved boundaries

Passkey setup, linked-account OAuth authorization, and account deletion require
explicit browser/device handoffs under #235. Headless/JSON commands must return an
actionable browser-interaction-required error. The handoff is currently pending;
these exceptions do not imply that commands already exist.

Custom add-on definition creation/editing and import/export (#243) may be deferred
without blocking core release #242. Enabling, configuring and using existing
add-ons (#236–237) remain required. Platform administration, standalone executables
and push-based TUI subscriptions are outside the approved core scope.

## Endpoint evidence

On 2026-09-29, read-only retrieval of the hosted app's
[deployment metadata](https://www.groupi.gg/.well-known/e2e-config.json) reported
`https://trustworthy-warthog-524.convex.cloud` for branch `main`. This agrees with
the production deployment recorded in the mobile release documentation and the
repository's conversion from Convex cloud URLs to HTTP site URLs.

The corresponding REST v2 base is
`https://trustworthy-warthog-524.convex.site/api/v2`.
Its public [health endpoint](https://trustworthy-warthog-524.convex.site/api/v2/health)
returned `{"status":"ok","version":"2.0.0"}`. This proves public reachability,
not authenticated reads or deployment of the new CLI/API changes. Named
self-hosted/development profiles need their own REST v2 endpoint; the hosted check
does not verify those deployments.

## Verification evidence

Local implementation checks on 2026-09-29 passed 26 public CLI tests against both
the source executable and the packed/installed executable, plus 45 REST contract
tests. CLI/backend lint and typechecking passed. The direct backend suite passed
528 assertions across 33 files, while reporting six scheduler errors ignored by
its existing test configuration. Code review found and resolved premature retries
when a server supplies a long `Retry-After` value.

The initial repository-wide run passed 1,013 web, 266 shared, and 249 mobile
assertions, but two mobile suites failed during loading and web typechecking hit
Zod/resolver incompatibilities. Both also reproduced on unchanged baseline source
with the same local dependencies. Refreshing dependencies with
`pnpm install --frozen-lockfile` resolved the web errors and all six tests in the
two mobile suites passed. Clean hosted backend and mobile jobs also passed on
Node 22 and 24. The normal local Convex test/codegen command still requires an
unset `CONVEX_DEPLOYMENT`; direct backend tests supplied local behavioral evidence.

The first Windows CLI jobs exposed checkout conversion to CRLF. A package-scoped
Git attributes rule now keeps CLI text files in LF; a simulated Windows checkout
verified the rule before rerunning hosted checks.

All six CLI jobs passed on Node 22 and 24 across macOS, Windows and Linux,
including types, lint, command tests and installed-package checks. PR #244 merged
at `57563c14e03a6982ceffdb89831885a4e2933d0f`; its post-merge application tests,
build, quality checks and production deployment passed. The live REST v2 health
endpoint returned 200 and OpenAPI included pagination, limit and cursor.
[Issue #222](https://github.com/groupi-app/groupi/issues/222#issuecomment-5897784101)
records the check links and a separate failed Dependabot update.

#222 tests cover the public executable and real authenticated REST boundary:
allowed/denied event reads, API-key restrictions, compatible pagination, profile
isolation, redirect rejection, errors, credential secrecy and installed package
contents. Live authenticated staging workflows remain part of beta/release
verification; the production smoke check does not establish that evidence.
Public registry publication belongs to #228. Real OS credential
store checks belong to #223 and release verification, after secure login exists.

## Secure login implementation (#223)

The implementation adds a session-bound authorization-code/PKCE exchange,
acknowledged loopback delivery, native OS credential storage per profile and
endpoint, explicit status/logout/revocation, and expiry without automatic browser
launch. Better Auth API-key creation now maps its current ownership field to the
existing schema; new configuration metadata is additive.

Local verification on 2026-09-29 passed the full workspace suite (2,141 assertions),
including 41 executable CLI tests, 22 browser authorization tests, and 61 focused
real auth/REST tests. The backend suite still reports its six previously observed
scheduler errors tolerated by the existing configuration. Packed-install tests
and actual macOS Keychain roundtrip/isolation checks passed. Review found two
callback cleanup hangs; executable regressions reproduced both before the fixes
and pass afterward, and the reviewer rechecked the fixes.

All six [hosted CLI jobs](https://github.com/groupi-app/groupi/actions/runs/36628361247)
passed at `9a48fd998c0c56592d6bc98d3718ca183086932a` on macOS, Windows, and
Ubuntu with Node 22 and 24. They exercised actual Keychain, Credential Manager,
and Secret Service storage, installed-package behavior, and Linux store-unavailable
errors. A Windows test-fixture import path issue was corrected before this run.
All PR application tests, quality/build checks, and the Vercel preview passed.

The packed CLI was separately installed and exercised against the deployed
`codex/cli-secure-login` preview (`combative-sardine-122`). A disposable account
completed browser onboarding and explicit consent, the real loopback listener
acknowledged delivery, and a fresh CLI process identified the same account from
macOS Keychain and fetched its empty event list. Browser cancellation of a repeat
login preserved the prior saved credential. `auth logout --revoke` removed the
native credential, and the same key subsequently received HTTP 401. Browser
presentation was inspected; the profile JSON contained only API and website URLs.
The temporary browser session was signed out and the test credential revoked.
This verifies the CLI authorization flow for an authenticated browser account;
external OAuth provider and email delivery flows were not exercised in this check.
