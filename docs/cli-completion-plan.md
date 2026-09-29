# CLI Completion Plan

Completion plan for [Groupi CLI #100](https://github.com/groupi-app/groupi/issues/100),
capturing the decisions agreed during the requirements interview. The maintainer
confirmed the consolidated plan; the published spec on issue #100 is the
implementation contract and is marked `ready-for-agent`. The maintainer also
approved the 22-ticket breakdown, now published as sub-issues of #100 with native
blocking relationships. The first ticket, #222, is merged in
[PR #244](https://github.com/groupi-app/groupi/pull/244); secure browser login
(#223) is next. Use the [capability checklist](cli-capabilities.md) and GitHub
tickets for implementation evidence and current status.

## Table of Contents

- [Agreed scope](#agreed-scope)
- [Existing implementation](#existing-implementation)
- [Delivery sequence](#delivery-sequence)
- [Completion boundaries](#completion-boundaries)
- [Implementation prerequisites](#implementation-prerequisites)

## Agreed scope

- Release useful non-interactive commands incrementally, then add the TUI using
  the same capabilities. Keep the overall issue open until its agreed scope is
  complete.
- Cover ordinary user actions and event management by organizers and moderators.
  Track platform administration separately.
- Identify account-security actions that require browser or device interaction
  explicitly in the capability checklist.
- Support hosted Groupi, self-hosted deployments, and development environments
  through named connection profiles with isolated server addresses and
  credentials. Hosted Groupi is the default; other environments require explicit
  selection.
- Use REST v2 for both command and TUI operations, correcting or extending it
  where necessary to match application permissions and side effects. See
  [the transport decision](adr/0001-cli-rest-transport.md).
- Distribute an installable Node.js package for macOS, Windows, and Linux.
  Standalone executables are a later option, not an initial release requirement.
- Interactive login uses the browser and stores credentials in the operating
  system credential store, isolated by profile. Do not silently fall back to
  plaintext credential storage. Automation can supply an existing API key through
  an environment variable or standard input without opening a browser.
- Harden the browser authorization callback before shipping the CLI listener.
- The first usable milestone is login, list events, create an event, invite
  another person, record that person's RSVP, and inspect attendance. Verify it
  with distinct user identities and machine-readable output.
- Normal command output is human-readable. `--format json` emits documented JSON
  on stdout, structured errors on stderr, and meaningful exit codes, without
  interactive prompts. Missing required input produces an actionable error.
- Interactive destructive operations identify the target and ask for
  confirmation. Non-interactive destructive operations require an explicit
  confirmation flag such as `--yes`.
- Reads may retry automatically when appropriate. Writes may retry only when
  duplicate execution is prevented.
- The first TUI uses periodic REST refresh: approximately five seconds for the
  active screen, immediate refresh after changes, and manual refresh. Display
  stale/disconnected state and back off after failures. Push updates are deferred.
- Post/reply input supports plain text and Markdown from direct arguments, files,
  or standard input, with HTML as an explicit advanced format. Terminal output is
  readable text. Editing existing content must not silently discard formatting
  or mentions.
- Support local-file uploads for event covers, avatars, and post/reply attachments,
  including attachment listing/removal. Enforce equivalent file rules across
  interfaces and avoid partially created posts when an upload fails.
- Enable, configure, and use existing add-ons. Provide convenient commands for
  built-in add-ons and validated JSON for complex configurations; TUI forms may
  fall back to an editor for complex structures.
- Custom add-on definition creation/editing and import/export are desired but
  lower priority. If they block the core release, defer them into separately
  tracked follow-up work with the gap stated explicitly in the parity checklist.
- Passkey setup, linked-account authorization, and account deletion may remain
  browser/device workflows. Interactive commands open the relevant page and
  explain the remaining action. Non-interactive commands return an actionable
  browser-interaction-required error. Document these as parity exceptions;
  ordinary event management must remain usable without a browser.
- List commands return bounded pages of 20 items by default, with `--limit`,
  cursor continuation, and explicit `--all` retrieval. JSON output includes
  continuation information. Introduce API pagination without breaking existing
  REST clients.
- Add server-side request deduplication for retryable operations such as creating
  events and sending invites. Reuse the same request identifier on retry. Where
  safe retry is unavailable, report an uncertain outcome and provide a way to
  inspect the result before repeating the operation.
- Standardize shared visible-text limits at 100 characters for post titles,
  3,000 for post bodies, and 5,000 for replies, with separate payload-size limits.
  Preserve existing longer content without truncation. Verify formatted text and
  mentions across REST, web, and mobile.
- Place the CLI in `packages/cli` with an independent release version and public
  Node package distribution. Prefer `@groupi/cli` subject to verified publishing
  permissions. Support Node 22 and 24 with CI on macOS, Windows, and Linux.
- Initial TUI screens cover everyday events, invitations, RSVPs, posts,
  notifications, and friends. Advanced configuration may use an editor or an
  equivalent CLI command instead of requiring a dedicated screen. Document those
  boundaries; every interactive action has a non-interactive equivalent.
- Ship a portable agent usage `SKILL.md`, not a client-specific skill. Include
  workflows, authentication, JSON/errors, and safe mutation guidance. Generate
  detailed command references from the CLI definition for each version.
- Release acceptance requires a staging deployment with distinct organizer and
  attendee accounts, permission/side-effect tests, packaging and credential-store
  checks on all three operating systems, and manual TUI verification. Record each
  capability as complete, an approved browser exception, or an explicit deferral.
  An early beta may ship after the first complete planning workflow (milestone 2);
  the overall issue remains open until its agreed core scope passes.
- Unknown profiles, expired keys, and unavailable credential stores fail clearly
  without switching accounts or servers. Credential renewal requires explicit
  login; commands do not unexpectedly launch a browser. When secure storage is
  unavailable, explain the supported temporary environment/stdin key options.
- Published command names, JSON fields, and exit codes remain backward-compatible
  within a major version. Breaking changes require a major release and migration
  notes; experimental commands are explicitly marked.
- Preserve existing oversized content when unrelated fields change. Permit edits
  that reduce its visible-text length without requiring immediate compliance
  with the new limit. Once within the limit, normal validation applies. Never
  truncate automatically.

## Existing implementation

This section records the initial planning audit, before #222. Its findings are
historical; consult the capability checklist for subsequent implementation.

CLI browser authorization, API-key authentication, versioned REST APIs, and
OpenAPI documentation are already present on main. The REST contract suite passed
16 tests during the initial audit; that does not establish full behavior parity
with the web app or verify an end-to-end CLI.

Preliminary inspection identified areas requiring verification and repair
before relying on the existing API for the CLI:

- Browser login callback validation and binding to the initiating CLI session.
- Consistent authorization and side effects across API and web/mobile operations.
  In particular, the existing REST post-creation path differs from the native
  Convex mutation in permission checks, attachments, and notifications.
- Existing pagination schemas are not used by v2 routes; current list operations
  return complete arrays. No request deduplication/idempotency-key mechanism was
  found, and event/invite creation may duplicate writes after an ambiguous retry.
- Rich-text validation limits differ across REST, web, and mobile. Upload,
  attachment, some add-on operations, and account-security workflows are missing
  from the current REST surface.
- Current CI tests Node 22 and 24 on Linux; the CLI will need explicit macOS and
  Windows coverage to support its agreed distribution targets.
- Changesets currently links all `@groupi/*` packages, defaults to restricted
  access, and creates version PRs without an npm publication step. CLI packaging
  and public publication require explicit configuration. Public registry lookups
  found neither `@groupi/cli` nor `groupi-cli`, but scope ownership and publishing
  permissions remain unverified.
- Shared attachment rules already enforce a 10 MiB per-file limit and ten
  attachments per post/reply, plus MIME and ownership checks. Reuse and verify
  those rules when adding REST upload/attachment support.
- No general HTML sanitizer was found in the inspected post/reply write paths,
  and existing mention extraction accepts arbitrary quoted `data-id` attributes.
  Safe content handling and mention validation must precede exposing advanced
  HTML input; existing rendering assumes stored content is safe.

These are planning findings, not changes made during this interview.

## Delivery sequence

| Milestone                           | Verifiable result                                                                                                                                                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Authenticated event browsing     | Install the package, select a profile, log in interactively or headlessly, and retrieve paginated events with stable human/JSON output. Wrong credentials, expired credentials, and wrong profiles fail safely.                                                        |
| 2. First complete planning workflow | An organizer creates an event, invites an attendee, and observes that attendee's RSVP. Authorization, notifications, confirmation, and retry behavior match the apps. This is the first usable beta milestone.                                                         |
| 3. Discussion and media             | Create, read, edit, and delete posts/replies with mentions and attachments; update covers and avatars. Shared content rules, sanitization, ownership, and failure cleanup are verified across clients.                                                                 |
| 4. Remaining user capabilities      | Cover event lifecycle and discovery, roles/member management, friends/blocking, notifications/muting, profile/settings, and existing add-ons. Audit the user-facing capability checklist and document browser exceptions.                                              |
| 5. Everyday TUI                     | Run the agreed event/social/discussion workflows through the same command services, with refresh, stale-state indicators, keyboard navigation, and documented advanced-command/editor fallbacks.                                                                       |
| 6. Release completion               | Verify staging flows with distinct identities, package installation and credentials across the OS/runtime matrix, portable agent guidance, and generated command documentation. Resolve every core capability checklist item and record approved exceptions/deferrals. |

Each capability includes the backend changes and tests needed to make it correct;
an existing REST route does not waive permission or side-effect verification.
Packaging/CI and the capability checklist start with milestone 1 and evolve
throughout the work. Milestones are planning groups; the published sub-issues
define approved ticket boundaries and dependencies. Custom add-on authoring
remains separately deferrable if it would block this sequence.

## Completion boundaries

The CLI's required scope is ordinary user and event-management behavior, not
platform administration. The first usable beta is milestone 2, the complete
organizer/invite/attendee-RSVP workflow; earlier read-only slices are development
milestones. The agreed everyday TUI and portable agent skill are required for
completion of the overall issue, not for that early beta.

Browser/device security workflows are explicit exceptions, not unimplemented
ordinary commands. Custom add-on definition authoring may be moved to linked
follow-up work if it blocks the core release; enabling, configuring, and using
existing add-ons remains required. Record any such deferral before closing #100.
Platform administration, standalone executables, and push-based TUI updates are
separate future work.

## Implementation prerequisites

Verify these facts while preparing and implementing tickets; they are not reasons
to reopen the agreed product scope:

- Public package scope ownership and publication permissions; if `@groupi/cli`
  cannot be used, resolve the package name before publication.
- Hosted web/API addresses and profile endpoint validation, plus local/self-hosted
  endpoint handling without credential leakage between profiles or hosts.
- OS credential-store availability and test fixtures across macOS, Windows, and
  Linux, including headless environments.
- A complete capability checklist traced to actual user-facing app behavior,
  including authorization, validation, side effects, and negative cases.
- Compatible pagination contracts, request-deduplication scope and retention,
  bounded retry behavior, and recovery checks after uncertain writes.
- Safe rich-text parsing/sanitization, visible-text counting, mention identity
  validation, and attachment ownership/cleanup behavior.
- A staging deployment and distinct test identities for end-to-end verification.
- Independent Changesets versioning, public package contents, generated command
  references, and a verified publication workflow.

The approved tickets are published as [sub-issues of #100](https://github.com/groupi-app/groupi/issues/100).
Each has acceptance criteria, the `ready-for-agent` label, and explicit blockers
in both its body and GitHub's native dependency relationships. Work only on tickets
whose blockers are complete.

- [#222: Installable CLI and authenticated event browsing](https://github.com/groupi-app/groupi/issues/222)
  is merged; continue with [#223: Secure browser login](https://github.com/groupi-app/groupi/issues/223).
- [#228: Publish the first usable beta](https://github.com/groupi-app/groupi/issues/228)
  verifies and ships the first complete planning workflow.
- [#242: Complete release verification](https://github.com/groupi-app/groupi/issues/242)
  depends transitively on all 20 other required tickets.
- [#243: Custom add-on authoring](https://github.com/groupi-app/groupi/issues/243)
  is separately tracked and does not block the core release.
