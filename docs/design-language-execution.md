# Design Language Execution

Execution record for [specification #420](https://github.com/groupi-app/groupi/issues/420).
The specification owns requirements; this record tracks evidence and open gates.

## Table of Contents

- [Source and Task Graph](#source-and-task-graph)
- [Runtime Readiness](#runtime-readiness)
- [Validation and Release Notes](#validation-and-release-notes)

## Source and Task Graph

Integration branch: `codex/design-language-integration`, based on current main
`13c02494`. Independent implementers use isolated worktrees and merge through
this branch after syncing with its tip. The original working directory and its
uncommitted work remain unchanged.

- [#421](https://github.com/groupi-app/groupi/issues/421): control state semantics.
- [#422](https://github.com/groupi-app/groupi/issues/422): feedback and confirmations.
- [#423](https://github.com/groupi-app/groupi/issues/423): localized usability fixes.
- [#424](https://github.com/groupi-app/groupi/issues/424): derived theme treatment;
  depends on the three correction tracks.
- [#425](https://github.com/groupi-app/groupi/issues/425): actual component gallery;
  depends on theme treatment and Storybook compatibility.
- [#430](https://github.com/groupi-app/groupi/issues/430): restore Storybook
  compatibility with Next.js 16 before gallery verification.
- [#426](https://github.com/groupi-app/groupi/issues/426): user visual review;
  depends on the gallery.
- [#427](https://github.com/groupi-app/groupi/issues/427): web migration and runtime
  validation; depends on explicit gallery approval.
- [#428](https://github.com/groupi-app/groupi/issues/428): native parity;
  depends on web validation.
- [#429](https://github.com/groupi-app/groupi/issues/429): Groups structural review
  and approved slices; depends on web validation and includes its own proposal
  review gate.

## Runtime Readiness

As of October 24, 2026, America/New_York:

| Prerequisite                     | State      | Evidence or remaining need                                                                                                          |
| -------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Actual component gallery         | Pending    | Existing Storybook will render the implementation; the user explicitly authorized a local server for this purpose                   |
| Source-matched authenticated app | Unverified | No local app server on usual ports at kickoff; frontend/backend SHA match and isolated session still required for actual app checks |
| Backend deployment               | Unchanged  | Component gallery does not require production data or a new Convex deployment                                                       |
| Native runtime                   | Unverified | Matching installed build/device and backend must be identified during native parity                                                 |
| VoiceOver/TalkBack               | Unverified | Requires observed supported-platform focus and announcement behavior                                                                |

Prior integration-status entries are historical; they do not prove this branch's
runtime readiness. Starting a local component preview is authorized for this
session. This does not authorize backend deployment or production data changes.

## Validation and Release Notes

Use the preconfirmed rendered public UI/provider seams and meaningful TDD
regressions. Record current-base audit observations as fixed, already fixed, or
unconfirmed. Run focused tests and `pnpm check`; actual visual gates cannot be
replaced with class assertions, old mockups, or unobserved runtime claims.

The user approved one `@groupi/web` patch changeset for the initial functional
corrections: “Fix control state announcements, action-menu labels, toast delivery,
asynchronous confirmations, and misleading navigation and validation feedback.”
This approval covers that batch's release notes; subsequent material scope
changes follow the repository workflow.
