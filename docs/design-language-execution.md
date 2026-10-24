# Design Language Execution

Execution record for [specification #420](https://github.com/groupi-app/groupi/issues/420).
The specification owns requirements; this record tracks evidence and open gates.

## Table of Contents

- [Source and Task Graph](#source-and-task-graph)
- [Runtime Readiness](#runtime-readiness)
- [Validation and Release Notes](#validation-and-release-notes)
- [Current Audit Disposition](#current-audit-disposition)

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

## Current Audit Disposition

These statuses describe the integration branch before gallery approval. A fixed
behavior with an open visual check is not a completed visual acceptance gate.

| Audit finding               | Current disposition                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Status contrast/foreground  | Theme derivation and actual gallery verification in progress (#424–425)                                            |
| Action press language       | Confirmed legacy growth; opt-in depression under development (#425)                                                |
| Passive hover behavior      | Confirmed passive Card hover shadow; quiet/static variants under development (#425)                                |
| Reduced motion              | Component variants and gallery coverage in progress; app migration pending (#425, #427)                            |
| Typography roles            | Existing fonts retained; shared role/gallery work in progress (#425)                                               |
| Mixed checkbox              | ARIA already supported mixed; distinct glyph corrected and behavior tests pass (#421); browser glyph check pending |
| Invalid fields              | Opt-in field state work in progress (#425)                                                                         |
| Action menu names           | Contextual caller labels and desktop/mobile behavior corrected (#421)                                              |
| Presence presentation       | Shared gallery review pending; domain equivalence must be preserved (#425, #427)                                   |
| Progress semantics          | Value/max normalization and forwarded announcements corrected (#421); actual 60/100 browser value matches 60% bar  |
| Toast delivery              | Legacy calls reach mounted Sonner; rendered provider regressions pass (#422)                                       |
| Async confirmation          | Pending dismissal/duplicates protected; failure retains retry; actual appearance route regression passes (#422)    |
| Empty-state hierarchy       | Canonical opt-in molecule work in progress (#425)                                                                  |
| Date selection              | Silent validation corrected (#423); editor restructuring deferred to Events review                                 |
| Event cards/visibility      | Contradictory Public icons corrected (#423); hierarchy deferred to Events review                                   |
| Add-on density              | Deferred to add-on structural review; no unrelated restructuring authorized                                        |
| Notifications/request count | Incoming-only attention count corrected (#423); activity structure deferred                                        |
| Settings/navigation         | Contextual back labels corrected (#423); page composition deferred                                                 |
| Profile initial tab         | Nonexistent initial tab corrected; asynchronous-load regression passes (#423)                                      |
| Authoring condition rows    | Responsive reflow corrected (#423); narrow browser check pending; authoring restructure deferred                   |
| Native press language       | Pending validated web language (#428)                                                                              |
| Native spacing/fields       | Pending native parity (#428)                                                                                       |
| Native screen hierarchy     | Shared control adaptation in parity; structural composition deferred to feature reviews                            |
| Friendship emphasis         | Deferred to Social review; existing confirmations preserved                                                        |
| Mobile invite methods       | Visible labels corrected (#423); narrow browser visual check pending                                               |

Initial combined verification at `d499e63b`: web 1,286, shared 434, mobile 581,
CLI 399, and backend 1,018 tests passed. Backend used `test:no-codegen` with the
unchanged checked-in declarations. The top-level `pnpm test:run` prerequisite
failed because this worktree has no `CONVEX_DEPLOYMENT`; code generation is not
claimed successful. No generated declarations were changed to bypass that gate.
