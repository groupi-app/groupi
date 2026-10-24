# Design Language Execution

Execution record for [specification #420](https://github.com/groupi-app/groupi/issues/420).
The specification owns requirements; this record tracks evidence and open gates.

## Table of Contents

- [Source and Task Graph](#source-and-task-graph)
- [Runtime Readiness](#runtime-readiness)
- [Validation and Release Notes](#validation-and-release-notes)
- [Current Audit Disposition](#current-audit-disposition)
- [Rendered Gallery Checkpoint](#rendered-gallery-checkpoint)
- [Sticker-book Review Iteration](#sticker-book-review-iteration)

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

## Rendered Gallery Checkpoint

October 24, 2026; implementation source `6edd4c27`. The actual Storybook gallery
runs at `http://127.0.0.1:6006/?path=/story/design-system-soft-lift--overview`.
Its Theme toolbar uses the production ThemeProvider and saved-theme serializer;
Inter and Geologica are loaded successfully. Five stories cover actions/surfaces,
fields/feedback, layouts/states, and long content. The source review guide is
`packages/web/stories/design-system/README.md`.

Observed in Chromium:

- Filled actions depress 1 px on hover and 3 px on press without changing size.
  Quiet and featured passive cards retain the same transform and shadow. The
  interactive card body opens its primary action, while its separate Save action
  toggles without opening it.
- All 12 bundled themes and three sparse custom examples render their actual
  theme classes and action fills. Sampled resting primary/secondary/destructive
  action contrast exceeds 4.5:1, including composited alpha fills.
- Mixed/checked/defaultChecked glyphs agree with accessible state; controlled
  mixed selection changes the visible Minus to Check. Keyboard tab selection,
  menu Escape/focus return, visible Sonner delivery, and pending/failure/retry
  confirmation behavior pass.
- Overview, layout, and long-content stories have no horizontal overflow at
  390 px and 320 px. Long content also reflows at 200% root text size.
- Reduced motion removes button translation/scaling, spinner animation, and
  progress transitions while preserving pressed backing and visible progress.
- User-reported hover flashing was reproduced: replacing a gradient with a
  background shorthand exposed the surface during transition. Actions now use
  one composed background color throughout. Frame samples transition smoothly
  from `rgb(130, 0, 173)` to `rgb(122, 0, 163)` without exposing white. Danger
  foreground remains identical at rest, hover, and press across all 15 examples.

Initial browser review caught the missing font static mapping, Storybook heading
reset, and one legacy mixed-checkbox example; all were corrected and rechecked.
Final Overview navigation has zero browser console errors. A transient story
index failure during a watched merge cleared on a clean server restart; direct
CSF parsing and the final story index pass without a parser workaround.

The integrated gallery passed `pnpm check`, dedicated Storybook types, full web
(1,296) and shared (456) suites before the final hover correction. That correction
then passed `pnpm check`, 30 shared contrast/state tests and three web adapter/
preview tests. Two independent review dimensions found no remaining actionable
issues after the mixed-checkbox correction; a targeted adversarial review of the
hover correction also found none. This is a scoped gallery checkpoint, not
authenticated application, native, or observed screen-reader acceptance.

**Open gate:** #426 requires user review of these actual components before #427
changes application defaults/usages. Native parity and Groups structural review
remain behind web readiness. The integration PR stays draft; foundation/gallery
release-note selection belongs to the next agreed batch before release readiness.

## Sticker-book Review Iteration

User feedback on October 24 requested more of Groupi's artsy sticker-book
identity, persistent white cut edges in dark themes, subtle perforated paper,
and an explicit design-language rationale for each component. The user also
required selective, obvious icon/text pairings and **no icons in headings**.
The [material review](design-language-material-review.md) records each component's
role and the choices that remain open.

Integrated implementation through `1e17841b` restores white sticker edges across
all palettes, introduces a decorative PaperDivider seam, and refines staged
avatars, empty-state cues, compact labels, menus, dialogs and result toasts.
Inputs and ordinary reading surfaces retain their quiet role. Save, Remove,
Edit, Location and Time receive explicit familiar icons; generic labels and
headings do not. No label-string inference or automatic icon placement exists.

The actual `design-system-soft-lift--material-studies` story compares three
**unselected** proposals: status stamp/cut-out label, attached index/underline tabs,
and annotation-strip/attached-note alerts. It uses canonical components with
exploratory styles scoped to the story. The normal navigation comparison has
three destinations; a disclosure reveals the long-label stress sample.

Verification in isolated Chromium contexts with measured CSS viewport sizes:

- All 12 bundled and three custom examples retain true white action cut edges
  and the consistent background-color treatment from the earlier hover fix.
- Dark-mode avatar, menu, dialog and toast edges are white; icon actions are at
  least 44 px wide. The perforated seam is dashed and hidden from assistive
  technology by default.
- Overview, Material Studies and the dialog have zero SVGs inside headings.
  Save and Location retain their visible text and explicit icons. Keyboard tab
  selection and visible toast delivery still work.
- Material Studies and its expanded long-label example reflow at 390/320 px,
  including 200% root text. Light, dark and alpha-theme checks show no horizontal
  overflow. Reduced motion still removes spatial feedback and transitions.
- The existing dark-mode gallery error message measured 3.83:1; readable message
  ink now measures 16.71:1 while its red glyph and invalid frame remain.
- Full `pnpm check`, dedicated Storybook types and focused component regressions
  pass for the material iteration. The final one-row message-contrast correction
  passes targeted lint, formatting and Storybook types. Token lint retains the
  existing 30 warnings. Focused API/default-behavior review found no actionable
  regressions; legacy defaults and story-only comparison boundaries are preserved.

The three design choices and #426 gallery approval remain open. These refinements
do not start application-wide migration or the Groups structural phase.

### Selected material checkpoint

Source `d1e74958` integrates the selected cut-out labels, attached index tabs, and annotation-strip alerts. Interactive card actions now tint their surface; soft dropdown items have 12px icon/text spacing. Success, error, warning, and info toast icons use semantic outcome colors while body text retains its neutral foreground.

The implementation passed `pnpm check`, dedicated Storybook types, and 34 focused regressions. Chromium checks confirmed distinct hover card fills, all four outcome icon colors with neutral message text in light/dark themes, and zero heading icons. Earlier unselected studies above describe the historical review checkpoint; whole-gallery approval remains open.

### Web application migration checkpoint

The user approved the actual gallery and authorized docs-first application migration on October 24, 2026 (#426 closed). Source `48a6b6ac` integrates the canonical primitive/atom defaults and the 416 higher-component source ledger, including page-specific components. See [coverage and dispositions](design-language-web-migration.md). Existing page order, routes, permissions and business behavior are retained; Groups remains first for the separate structural review.

Integrated `pnpm check` passes; full web suite passes 1,295 tests/110 files and shared suite passes 464 tests/16 files. Browser checks of the application-default story confirm actual semantic filled-action colors and white edges across 15 palettes (minimum sampled resting text contrast 5.00:1), stable action ink, keyboard tab focus/selection, Select selection, Calendar Popover and Sheet delivery, 320px/200% text without horizontal overflow, zero heading SVGs, and reduced-motion transform none/transition 0s. The inverse-action correction is verified at `995237e6`. These are actual default-component gallery checks, not authenticated whole-page acceptance.

Independent review found and corrected clipped interactive-card focus rings, a global dialog-width cap, semantic role CSS specificity, and nested destination controls. Final real-page visual validation remains open: local Next launch was rejected by the repository script guard despite user authorization; hosted test metadata points to older commit `621f2dd8f809d8dd121b62e8099a733ba232b1c2` with reachable `zany-rooster-824` backend but an unverified backend source and signed-out browser. No production mutations/deployments were made.
