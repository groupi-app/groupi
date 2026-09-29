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
| Event list and event details; selected account and deployment | Installable executable, help/version, named profiles, environment/stdin API keys, human/JSON output, bounded pagination and read retries         | [#222](https://github.com/groupi-app/groupi/issues/222) | Implemented; verification pending |
| Explicit sign-in and account credential management            | Session-bound browser authorization, OS credential storage, status, logout, expiry, and profile isolation                                        | [#223](https://github.com/groupi-app/groupi/issues/223) | Pending                           |
| Create/edit an event and its basic schedule                   | App-equivalent validation and authorization, organizer membership, duplicate prevention and lost-response recovery                               | [#224](https://github.com/groupi-app/groupi/issues/224) | Pending                           |
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

## Verification still required

Local implementation checks on 2026-09-29 passed 26 public CLI tests against both
the source executable and the packed/installed executable, plus 45 REST contract
tests. CLI/backend lint and typechecking passed. The direct backend suite passed
528 assertions across 33 files, while reporting six scheduler errors ignored by
its existing test configuration. Code review found and resolved premature retries
when a server supplies a long `Retry-After` value.

The repository-wide run passed 1,013 web, 266 shared, and 249 mobile assertions;
two mobile suites failed during loading. `pnpm check` stopped at web Zod/resolver
type incompatibilities. The normal Convex test/codegen command requires an unset
`CONVEX_DEPLOYMENT`; direct backend tests supplied the local behavioral evidence.
These limitations mean the complete repository check is not green.
The web's 13 Zod diagnostics and both mobile loading failures also reproduce on
unchanged baseline `2a340a1` using the same installed dependencies; this comparison
isolates source changes, rather than claiming a fresh baseline dependency install.

The CLI workflow defines Node 22 and 24 checks on macOS, Windows and Linux for
types, lint, command tests and installed-package smoke tests. Adding the workflow
is not evidence that its six hosted jobs have passed. Record their results before
claiming cross-platform verification.

#222 verification must cover the public executable and real authenticated REST
boundary: allowed/denied event reads, API-key restrictions, compatible pagination,
profile isolation, redirect rejection, errors, credential secrecy and installed
package contents. Public registry publication belongs to #228. Real OS credential
store checks belong to #223 and release verification, after secure login exists.
