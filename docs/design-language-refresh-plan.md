# Design Language Refresh Plan

Agreed direction and delivery plan for Groupi's component refresh, followed by a
Groups structural review. The user confirmed the shared understanding and
requested publication of an implementation specification.

Published specification:
[Shared design language refresh and Groups structural review](https://github.com/groupi-app/groupi/issues/420).

## Table of Contents

- [Outcome and Scope](#outcome-and-scope)
- [Design Contracts](#design-contracts)
- [Theme Compatibility](#theme-compatibility)
- [Delivery and Completion Gates](#delivery-and-completion-gates)
- [Audit Finding Disposition](#audit-finding-disposition)
- [Evidence and Verification](#evidence-and-verification)

## Outcome and Scope

Preserve Groupi's playful sticker identity while making hierarchy, interaction,
and state consistent across the application. Use quiet supporting surfaces,
expressive semantic accents, and physical depth for prominent actions.

The initial system update covers typography, status colors, form states, icons
and badges, buttons, surfaces, overlays, feedback, and motion. Evolve existing
shared components and tokens in place, with explicit variants and one canonical
implementation. Preserve public behavior where possible and migrate existing
usages to the appropriate variants.

Define web and native rules together; implement and validate web first, then
adapt the same intent to native press and touch behavior. After web validation,
Groups structural work may begin alongside native parity. Shared rules learned
in either track feed back into both platforms.

Page restructuring follows the system update. Groups is the first feature:
review finding a Group, joining, onboarding, participating, and managing it as a
complete journey. Subsequent features are selected after that review; their
structural findings remain tracked rather than silently entering the system
migration.

## Design Contracts

**Soft lift** is the selected treatment: a wide sticker edge, shallow colored
backing, and restrained diffuse shadow. Exact dimensions are tuned in the
rendered component review, using the accepted exploration as the starting point.
This is design vocabulary, not a change to the product's domain glossary.

### Surface Roles

| Role                      | Appearance and behavior                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| Filled action             | Soft lift by default; depress on hover and press farther on activation                                   |
| Quiet action              | Restrained outline, ghost, or text treatment; clear focus and activation feedback                        |
| Ordinary information card | Quiet surface, stable on hover; no implied click behavior                                                |
| Featured information card | Explicit opt-in static sticker frame; remains stable when passive                                        |
| Interactive card          | Explicit opt-in action treatment with proper link/button semantics; depresses on hover and activation    |
| Field                     | Quiet writable surface with consistent label, focus, invalid, disabled, and supporting-message treatment |
| Tab or menu               | Quiet navigation/utility treatment with clear selected, expanded, and focus states                       |
| Badge or status accent    | Static semantic cue using readable text and, where useful, a distinguishing glyph                        |

Primary meaning determines the treatment. A featured surface containing a button
is not automatically an interactive card. Preserve independent inner actions and
avoid nested interactive elements.

### State and Motion

- Resting actions have a shallow base. Hover moves into that base; activation
  presses farther. Avoid growth or increased elevation as the shared hover rule.
- Keyboard focus stays visible and distinguishable from hover or selection.
- Loading actions communicate progress and prevent duplicate submission while
  retaining the action's identity. Async confirmations retain pending/error and
  retry context until successful completion or intentional cancellation.
- Disabled states remain understandable and do not animate as available actions.
- Selected, mixed, completed, pending, and invalid are distinct semantic states;
  text, glyphs, and accessible state must agree with the visual presentation.
- Native uses press feedback, not hover. Preserve touch/scroll behavior and
  platform accessibility semantics.
- Reduced-motion mode removes translation, scaling, spring movement, and
  continuous decorative animation. Retain immediate color, outline, and shadow
  feedback plus readable loading status.

### Typography and Density

Use the existing typefaces and semantic design system. Establish responsive
page, section, card, body, and utility roles instead of inventing a hierarchy per
feature. Give dates, identities, statuses, and actions emphasis in proportion to
their role in the task.

Support narrow screens and enlarged text without shrinking controls or hiding
important labels. Compact authoring and administrative interfaces can retain
task-appropriate density; their focus, state, and touch behavior must still be
clear. Adjust local spacing needed for component compatibility during migration;
reserve page-level reorganization for the feature reviews.

## Theme Compatibility

Soft lift adapts automatically to all bundled and saved custom themes. Preserve
users' chosen fills and derive readable foregrounds, backing, hover, and pressed
colors. Do not require users to rebuild saved themes or add user-facing border
and depth settings in this update.

Keep shape and depth consistent across themes. Share derivation rules between
web and native adapters, preserving existing overrides outside the derived
interaction treatment. Verify against the actual saved-theme format before
coding; avoid introducing required persisted fields for presentation-derived
values.

The compatibility trade-off is recorded in
[Derived theme presentation](./adr/0006-derived-theme-presentation.md).

Test every bundled theme automatically. Concentrate human visual signoff on the
default light/dark themes and representative custom themes, including difficult
palettes. Test text/glyph contrast and foreground/fill pairing in rendered states
as well as at the token level.

## Delivery and Completion Gates

Use small independently reviewable PRs for functional corrections, shared
foundations and gallery, usage migration, and native parity. Split these further
when a change has an independent behavior or verification scope. Each PR records
its validation and remaining limits. Groups structure has its own later review
and implementation scope.

### Verify the Baseline and Correct Functional Defects

Refresh references and select a current implementation base. Current main is the
recommended base for shared system work; preserve unrelated local changes and
existing worktrees. Reproduce or directly verify each reported defect against
that base before fixing it. Record already-fixed or unconfirmed findings.

Ship verified behavior/accessibility corrections independently before the visual
refresh. Use meaningful regression coverage for state and behavior, including
mixed checkboxes, toast delivery, async confirmation lifecycle, named action
controls, and profile tab selection. Correct simple contradictory labels or
visibility cues without redesigning their surrounding pages.

**Complete when:** each correction has an explicit failure scenario, current-base
verification, appropriate regression coverage, and focused validation. Remaining
findings have a documented disposition.

### Establish Shared Foundations and Review the Component Gallery

Implement tokens, variants, derived theme treatment, state semantics, and motion
in the existing primitives and molecules. Stage the refreshed treatment for
explicit gallery use before changing app-wide defaults or migrating usages.
Temporary compatibility paths remain in the same canonical implementation and
are removed when their callers are migrated.

Extend the existing actual-component stories to cover quiet/featured/interactive
surfaces; Button variants and sizes; fields and invalid states; checkbox mixed
state; navigation and menus; badges and presence; overlays; empty/loading/error
states; feedback; and typography roles. Include long content, narrow layouts,
light/dark and custom themes, keyboard focus, and reduced motion.

Review this rendered gallery with the user before app-wide usage migration.
Illustrations may help explain choices but do not substitute for rendering the
actual shared components. If a suitable preview is unavailable under the
repository's server rules, record that validation as incomplete.

**Complete when:** the gallery demonstrates the agreed contracts, behavior/theme
checks pass, and the user has reviewed the visual treatment. Resolve tuning here
rather than leaving conflicting visual decisions to individual feature callers.

### Migrate Web Usages and Validate Real Screens

Apply the reviewed shared variants across existing usages, remove conflicting
hover/growth styles, and repair spacing or focus regressions caused by the
component changes. Keep page tasks, route structure, permissions, and business
behavior intact except for independently verified corrections.

Validate representative live screens such as event browsing/detail, event
creation/date selection, settings, dialogs/menus, and Groups entry points. Include
populated, empty, loading, error, long-content, and relevant role states. Expand
checks when migration reveals a new risk rather than repeating unrelated suites.

Run `pnpm check`, focused behavioral tests, relevant token checks, and existing
server-based browser/accessibility checks. Distinguish actual visual review from
failure screenshots or class-string assertions. Record any unavailable runtime
checks explicitly.

**Complete when:** usages follow the reviewed rules, relevant checks pass, and
live-screen review confirms the shared update works in composition. This is the
web readiness gate for starting Groups structural work.

### Bring Native Into Parity

Apply the same semantic roles and theme derivation with native-appropriate press
behavior. Correct shared native field frames and accidental nested padding.
Validate on supported native platforms with touch, enlarged text,
VoiceOver/TalkBack, dark/custom themes, and reduced-motion preferences as
applicable. Record simulator-versus-device coverage.

Native parity may run alongside Groups structural work after web validation.
Native screen restructuring remains part of its later feature review.

**Complete when:** native controls implement the shared intent and relevant
native checks and rendered interaction review pass.

### Review Groups Structure First

Reaudit the current integrated Groups journey before applying earlier proposals;
newer integration work may already have changed navigation or management pages.
The previous home exploration is an accepted starting direction, not a frozen
specification of current behavior or every page.

For each page/state, identify its primary job and next action, then review
hierarchy, density, navigation, accessibility, and reuse of the updated system.
Cover visitor, applicant, invited person, member, moderator, and owner, including
required/optional/completed onboarding and unavailable/empty/error states.

Keep Group admission, onboarding, event audience eligibility, event membership,
and RSVP distinct. Lead the home with shared events and meaningful next actions;
keep management focused. Preserve existing permissions and data privacy when
moving UI.

Review proposed structures before implementing each coherent journey slice.
Finish Groups before selecting the next structural feature. Later audits examine
their own current evidence rather than mechanically applying the same layout.

**Complete when:** the journey review has explicit findings and agreed structures,
implementation preserves domain behavior, and relevant role/state, responsive,
keyboard, and runtime checks pass. Native structural follow-through is tracked
explicitly where needed.

## Audit Finding Disposition

Revalidate every finding on the selected implementation base. Record findings
already fixed or not reproduced instead of duplicating work. A combined finding
can produce a small correction now and a structural improvement later.

| Finding                                     | Planned handling                                                                     |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| Status contrast and foreground pairing      | Shared theme and state system                                                        |
| Action press language                       | Shared Button and interactive surface variants                                       |
| Passive surface hover behavior              | Shared Card defaults and usage migration                                             |
| Reduced motion                              | Shared CSS/animation policy and native equivalent                                    |
| Typography roles                            | Shared responsive roles, applied to existing usages                                  |
| Mixed checkbox state                        | Independently verified functional correction                                         |
| Invalid field appearance                    | Shared form-state system                                                             |
| Unnamed action menu controls                | Independently verified accessibility correction                                      |
| Presence presentation                       | Shared visual mapping; verify domain-state equivalence                               |
| Progress value/accessibility mismatch       | Primitive correction before reuse                                                    |
| Toast delivery                              | Independently verified functional correction                                         |
| Async confirmation dismissal                | Independently verified functional correction                                         |
| Empty-state sizing and hierarchy            | Shared molecule correction and state gallery                                         |
| Date selection                              | Correct silent validation first; defer editor structure to its feature review        |
| Event card hierarchy and visibility icons   | Correct contradictory visibility cues first; defer composition to Events review      |
| Add-on participation and bring-list density | Later add-on structural review                                                       |
| Notifications and friend request counts     | Correct misleading counts first; defer activity layout to its feature review         |
| Settings and navigation hierarchy           | Correct contextual back labels first; defer composition to the relevant page reviews |
| Profile initial tab                         | Independently verified functional correction                                         |
| Add-on builder and condition rows           | Correct narrow-screen overflow first; defer workspace structure to authoring review  |
| Native press language                       | Native parity following web rules                                                    |
| Native card spacing and field frames        | Native shared component correction and parity                                        |
| Native event/filter/review hierarchy        | Carry shared control rules now; defer screen composition to native feature reviews   |
| Friendship action emphasis                  | Social feature review; keep destructive confirmations                                |
| Mobile invitation method labels             | Independently verified navigation/accessibility correction                           |

Groups remains the first structural review. Later structural findings stay
tracked until their feature is selected; they are not silently dropped or
implemented during an unrelated system migration.

## Evidence and Verification

The audit used the checkout at `a25db731` and inventoried 348 source files under
web component/feature and native component directories. Foundational web layers
received full source review; larger compositions and native flows received
representative review. The Groups implementation was reviewed separately in the
existing `groups-invite-ui` worktree.

Source findings are evidence to verify against the chosen implementation base.
They are not all browser-reproduced failures or approved redesigns.

Remote references were refreshed during planning. `origin/main` at `13c02494`
already contains Groups and is the recommended baseline for the shared system
update. `origin/test` at `621f2dd8` contains additional Groups navigation,
management separation, Discord, and authorization work. Main and test share the
same design tokens, atoms, UI primitives, and Storybook at this inspection.

The original audit checkout is older than both. Revalidate findings against the
implementation base; do not treat an old source observation as proof that a
current defect remains. Before the Groups structural review, inspect the newer
test-branch journey or its released equivalent. Refresh references again when
implementation starts, preserving existing working-tree changes and other
worktrees.

Existing Storybook stories provide a starting point for the gallery, but their
preview currently exercises a dark-class toggle rather than the full bundled and
custom theme adapters. Extend actual component examples to cover those adapters.
Existing Playwright coverage supplies behavioral/accessibility scaffolding; its
failure screenshots are not established visual regression baselines. Use a
running preview under the repository's server rules; a standalone illustration
does not substitute for rendering the actual components.

The plan must preserve the distinction between functional corrections and visual
choices. For example, checkbox mixed state, toast delivery, confirmation
lifecycle, and profile tab selection can be validated independently of Soft lift.

Use existing domain vocabulary in `GLOSSARY.md`. Design-treatment vocabulary
belongs in this plan or the design-system documentation; it does not by itself
change Group, event, admission, or participation semantics.
