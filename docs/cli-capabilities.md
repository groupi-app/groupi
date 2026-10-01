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
| Create/edit an event and its basic schedule                   | App-equivalent validation and authorization, organizer membership, duplicate prevention and lost-response recovery                               | [#224](https://github.com/groupi-app/groupi/issues/224) | Verified; merged in #247          |
| Invite people and respond to invitations                      | Supported email, username and link invitations; inspect/manage, accept/decline, membership transitions and notifications                         | [#225](https://github.com/groupi-app/groupi/issues/225) | Verified; merged in #248          |
| RSVP, availability, attendance and date selection             | Submit responses, inspect permitted attendance, finalize/reset dates with time-zone and notification parity                                      | [#226](https://github.com/groupi-app/groupi/issues/226) | Verified; merged in #249          |
| Notifications and event/discussion subscriptions              | Paginated unread/all notifications, read/clear actions, mute/unmute and delivery suppression                                                     | [#227](https://github.com/groupi-app/groupi/issues/227) | Verified; merged in #250          |
| First complete planning workflow                              | Installed staging workflow with organizer/attendee identities; independent versioning, registry rights and public beta publication               | [#228](https://github.com/groupi-app/groupi/issues/228) | Pending                           |
| Event discovery and membership management                     | Browse/join discoverable events, visibility, event permissions, roles, member removal/leaving and event deletion                                 | [#229](https://github.com/groupi-app/groupi/issues/229) | Implemented; verification pending |
| Event posts                                                   | Create/read/edit/delete, text/Markdown/explicit sanitized HTML, validated mentions, notifications, shared limits and legacy-content preservation | [#230](https://github.com/groupi-app/groupi/issues/230) | Pending                           |
| Discussion replies                                            | Create/read/edit/delete with the same content, permission, mention, notification and legacy-limit rules                                          | [#231](https://github.com/groupi-app/groupi/issues/231) | Pending                           |
| Post/reply file attachments                                   | Local upload, list/remove, ownership validation, atomic submission and orphan cleanup                                                            | [#232](https://github.com/groupi-app/groupi/issues/232) | Pending                           |
| Event covers and account avatars                              | Image upload, replacement/removal, distinct media rules, ownership and cleanup                                                                   | [#233](https://github.com/groupi-app/groupi/issues/233) | Pending                           |
| Friendships and blocked users                                 | Requests, acceptance/decline/cancellation, friendship list/removal, block/unblock and privacy side effects                                       | [#234](https://github.com/groupi-app/groupi/issues/234) | Implemented; verification pending |
| Profile and preferences; security-sensitive account actions   | Profile fields, privacy, notification/theme preferences and the approved browser handoffs below                                                  | [#235](https://github.com/groupi-app/groupi/issues/235) | Implemented; verification pending |
| Existing event add-on configuration                           | Enable/disable/inspect/configure bring lists, questionnaires, reminders, Discord and existing custom add-ons with app lifecycle rules            | [#236](https://github.com/groupi-app/groupi/issues/236) | Implemented; verification pending |
| Existing event add-on participation                           | Supported submissions, opt-outs, built-in workflows and custom field actions with participant isolation                                          | [#237](https://github.com/groupi-app/groupi/issues/237) | Pending                           |
| Everyday interactive planning                                 | Keyboard event/invitation/RSVP screens using shared command services, periodic/manual refresh and stale/offline state                            | [#238](https://github.com/groupi-app/groupi/issues/238) | Pending                           |
| Everyday interactive discussion                               | Post/reply and attachment workflows, safe editing and documented advanced editor/CLI fallback                                                    | [#239](https://github.com/groupi-app/groupi/issues/239) | Pending                           |
| Everyday interactive social activity                          | Friends and notifications with shared confirmation, refresh and reconnect behavior                                                               | [#240](https://github.com/groupi-app/groupi/issues/240) | Pending                           |
| Agent use of supported app workflows                          | Portable usage skill, generated versioned command reference, JSON/error and safe-mutation guidance                                               | [#241](https://github.com/groupi-app/groupi/issues/241) | Implemented; verification pending |
| Complete ordinary-user and event-manager release              | Capability audit, installed staging workflows, real OS credential stores, manual TUI checks and public release verification                      | [#242](https://github.com/groupi-app/groupi/issues/242) | Pending                           |
| Custom add-on definition authoring                            | Definition creation/editing and validated import/export                                                                                          | [#243](https://github.com/groupi-app/groupi/issues/243) | Pending; explicitly deferrable    |

## Approved boundaries

Passkey setup, linked-account OAuth authorization, and account deletion require
explicit browser/device handoffs under #235. Headless/JSON commands must return an
actionable browser-interaction-required error. The explicit `account passkeys`, `account linked-accounts`, and `account delete`
commands open the selected profile’s account settings. Headless and JSON usage
returns `BROWSER_INTERACTION_REQUIRED`; completion still occurs in the browser.
Live browser/device verification remains pending.

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

## Event creation and editing (#224)

PR #247 adds shared app/REST event writes, transactional creation replay records,
24-hour request identifiers, explicit proposed-date replacement confirmation, and
capability checks before CLI writes. Local validation passed `pnpm check`, 2,194
workspace assertions, 71 source/installed CLI tests, and 68 focused REST tests.
Backend and CLI reviews approved after resolving compatibility and cancellation
findings. The backend suite retains its previously documented scheduler errors.

On 2026-09-30, the packed CLI was installed separately and exercised against the
`codex/cli-event-writes` preview (`quaint-trout-371`) at commit `2820bed`.
Disposable organizer and attendee accounts used the real authentication, REST,
and app query/mutation boundaries. A proxy dropped the first successful create
response; the CLI retried with the identical request identifier and received the
original event. An explicit subsequent replay still left one event, confirmed by
CLI listing and app queries. Organizer edits and proposed-date replacement were
visible to the attendee with `EVENT_EDITED` and `DATE_CHANGED` notifications;
attendee editing was denied. Replacing proposed dates on a confirmed-date event
was rejected without changing its chosen date. Test events were deleted, test API
keys revoked, and successful test sessions signed out. No external invitation
emails were sent; the attendee joined using the existing app link-invite path.

All six hosted OS/runtime CLI checks, application tests, build, quality checks
and Vercel preview passed at `3ac6336`. The release note was subsequently approved
and added. Production availability remains dependent on merge and deployment.

## Invitations (#225)

The CLI adds separate bearer link/email and recipient-bound username invitation
commands. Both REST versions and the apps share creation, management and response
logic. Legacy invite usage counters are normalized without a backfill, with an
optional consumed-count field preserving limits through later edits. Creation and
email queueing use the same 24-hour replay contract as event creation. Email
results report queueing, not confirmed delivery; the default email send action
queues all pending invitations for the event, matching the app.

Local verification on 2026-09-30 passed 2,249 workspace assertions and 106 tests
against the packed, separately installed CLI, including 35 new invitation command
tests and the initial 20 authenticated REST cases. Four subsequent test-only
additions passed in the final backend run: 591 assertions, including all 24 new
REST cases. The six previously documented backend
scheduler errors remain tolerated by the existing test configuration. CLI and backend
reviews approved without remaining findings, and `pnpm check` passed. Hosted and live preview evidence is recorded below; production availability
remains dependent on merge and deployment.

All six hosted CLI jobs and the application tests, build, quality checks and
Vercel preview passed at `a302647` in PR #248. Live verification against the
`codex/cli-invitations` preview used a separately installed package and three
disposable accounts. A successful username-invitation response was dropped;
automatic retry and explicit replay still produced one invitation. The wrong
recipient was denied, acceptance created app-visible membership and one organizer
notification, bearer-link acceptance worked, and decline created no membership.
Pending email invitations were listed through pagination and revoked without
sending mail. Test events were deleted, CLI credentials revoked, and sessions
signed out. Provider delivery was not exercised.

The initial test used a generic Better Auth API key and reached its default
10-request/day quota after the earlier scenarios passed. The complete successful
run used the normal CLI authorization flow and its configured 120-request/minute
limit. #228 records the generic-key policy/documentation follow-up. These results
verify the preview, not production deployment.

PR #247 merged at `efd77cd` and PR #248 merged at `e9f3b75` on 2026-09-30
after their final checks passed. The #224 production attempt failed because
Convex reported a schema overwritten by another push. The subsequent #225
production deployment, which includes both changes, reached READY at `e9f3b75`
and received the public domains. Its production REST health response advertises
`eventWrites` and `inviteWrites` version 1; post-merge GitHub checks also passed.

## RSVP, attendance and date management (#226)

The CLI adds RSVP read/update with notes, paginated attendance and availability,
response submission/clearing, and organizer poll/manual date selection and reset.
Both REST versions share the app's scheduling and response mutations. Attendance
reads honor `viewAttendeeList`; private RSVP and availability notes are visible
only to their author or an organizer/moderator. Restricted members retain access
to their own responses and proposed dates. The existing app event-feed read now
uses the same private-note projection.

Local verification on 2026-09-30 passed 2,309 workspace assertions, including 606
backend tests and 147 executable CLI tests. All 147 CLI tests also passed against
the separately installed package. Fifteen new authenticated REST tests cover
permissions, private notes, polling/manual/reset transitions, atomic validation,
pagination and reminder lifecycle scheduling; 41 new command tests cover the CLI.
Both independent reviews approved after the event-feed privacy regression was
reproduced and fixed. The backend's six previously documented ignored scheduler
errors remain. All six hosted CLI jobs, the application suites, quality checks,
build and Vercel preview passed at `66572c1`.

Live verification against the `codex/cli-attendance` preview used the separately
installed CLI with organizer, attendee and peer identities. Paginated date and
own-response reads matched app state. Private RSVP/availability notes were hidden
from the peer and visible to their author and organizer; restricting attendance
blocked peer lists while preserving own-response access. Poll selection copied
availability into RSVP, manual selection preserved it, and reset/clear retained
the expected notes and responses. App reads confirmed RSVP/date notifications.
Fixture events were deleted, CLI credentials revoked and sessions signed out.
Actual reminder delivery is not established by scheduling tests alone.
PR #249 merged at `7b3b1e5`; post-merge production verification remains separate.

## Parallel capability implementation (#229, #234, #235, #236, #241)

The next CLI batch adds remaining event management (`events discover`, join,
leave, deletion, membership roles/removal, visibility and permissions), social
requests/friendships/blocking, account/profile/privacy/notification/theme settings,
existing add-on configuration and portable agent guidance. Public commands retain
selected profiles, human/JSON streams, bounded cursor paging, destructive
confirmation and explicit inspection after uncertain writes. The generated
Markdown/JSON command reference comes from the actual Commander definitions and
package version; stale-reference checks run before packing.

Discord guild discovery uses `discord guilds refresh` and paginated
`discord guilds list`. Refresh checks the selected identity’s linked Discord
account, manageable guild permissions and bot membership, then replaces only
that identity’s short-lived authorization cache. Cached results include expiry
metadata. Account linking remains the explicit browser exception.

App and REST mutations share event lifecycle, friendship/blocking, notification
settings and theme logic. The batch repairs cross-event member mutations,
friend-request privacy enforcement, shadowed theme preference routes, foreign
notification-method/theme references and preservation of omitted webhook
settings. Existing custom add-ons preserve definition metadata and protected
webhook fields while permitting app-supported event configuration changes.

Local verification includes real API-key-authenticated REST/domain tests and
public executable tests. Additional CLI-to-REST HTTP bridge tests exercise real
Better Auth/router/database behavior for event discovery/join/leave/deletion,
social requests/notifications/blocking, preference identity isolation and
questionnaire configuration/reset/cleanup. The bridge translates the in-memory
test database's synthetic IDs to production-compatible wire identifiers; it
preserves the authentication and domain operations. Package verification runs
these bridge suites against the separately installed CLI as well as the public
command and generated-guidance suites.

These capabilities remain **Implemented; verification pending**. Live staging
checks with distinct identities, actual account browser/device handoffs,
independent agent-client installation, hosted OS/runtime results and publication
remain separate release evidence. The checkout has no `CONVEX_DEPLOYMENT`, so
`pnpm generate` cannot run; additive API module declarations were updated locally
and standalone typechecking verifies them. Backend suites run directly without
the deployment-dependent codegen pre-step. Existing scheduler errors tolerated by
the backend test configuration remain recorded with final suite results.

Final local checks on 2026-09-30 passed 2,368 assertions: 636 backend, 1,035 web,
255 mobile, 266 shared and 176 CLI. The separately packed and installed CLI passed
176 command/guidance tests and eight real authenticated CLI-to-REST bridge tests.
The six previously recorded backend scheduler errors remain tolerated by its
existing configuration. An oversubscribed parallel backend run hit five-second
timeouts and cascading fixture failures; a complete rerun with two workers passed
all 44 backend files using the normal assertion and timeout settings. Cross-package
typechecking exposed the mobile type environment's missing `AbortSignal.timeout`;
the bounded Discord fetch now uses `AbortController` with explicit timer cleanup.
Independent correctness/spec and security reviews approved after their findings
were fixed. The final quality gate and commit identify the delivered source; no
staging, registry or new hosted platform result is inferred from these local runs.

## Notifications and muting (#227)

The CLI adds bounded all/unread notification pages, unread counts, individual and
scoped read actions, confirmed clear actions, and event/discussion mute controls
with inspectable effective state. App and REST mutations share ownership checks
and queued-push cleanup. Muting requires current membership; historical
recipient-owned notifications preserve app behavior, while stale muted-item
metadata is hidden after losing access.

Local verification on 2026-09-30 passed 2,273 workspace assertions, including 596
backend and 121 executable CLI tests. All 121 CLI tests also passed against the
separately installed package. The focused backend run passed 69 assertions, and
both independent reviews approved. `pnpm check` passed after linking the isolated
worktree's package dependencies. The backend's six previously documented ignored
scheduler errors remain. Live preview evidence is recorded below. All hosted
checks passed on release-note commit `c0a163c`; PR #250 merged at `c3d4ee1`. Tests establish queued-work cleanup and notification suppression, not
external provider delivery or cancellation of an already-dispatched request.

Integration with #226 passed `pnpm check`, all 2,329 workspace assertions
(including 611 backend and 162 CLI tests), and all 162 tests against the
separately installed CLI. Both capability declarations and command registrations
are retained; generated API bindings were refreshed after combining the tracks.

A live run against the `codex/cli-notifications` preview at source commit
`9f9d29d` passed using the separately installed integrated package and two
disposable accounts. CLI pagination, unread filtering and read/unread/scoped
actions matched app reads. Cross-account cursors and notification changes were
denied; clear required confirmation and removed the recipient's app records.
Nonmembers could not inspect or change subscriptions. Muting suppressed
app-created posts/replies; unmuting restored notifications, and parent-event
muting stayed effective after unmuting a discussion. Fixture events, notices,
subscriptions and local profiles were cleaned up; key revocation and session
sign-out were verified. Disposable account records remain. This establishes
in-app notification delivery, not external push/email provider delivery.
