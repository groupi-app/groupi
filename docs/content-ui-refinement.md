# Form, List and Poll composition

Local UI refinement from test `5832fe64e0ad96c8322b850befada4b8a2cf27f5`, on
`codex/content-pages-refinement`. The original UI pass preserved backend
contracts; the later List feature below adds compatible optional fields and
owner-scoped claim APIs. No existing data is rewritten or deployed here.

## Design

The authored content is the editing surface. Geologica headings and Inter body
text retain Groupi's existing typography. Existing theme values provide purple
primary (#8200ad), deep foreground (#0f172a), white surface (#ffffff), sunken
surface (#f4f5f7) and quiet borders (#e2e8f0); components reference semantic tokens
so dark and custom themes remain supported. No new palette or decorative effect
is introduced.

Title and description fields occupy the finished content's hierarchy. Form
questions include answer-shaped controls and individually editable choice rows.
Poll choices use the same full-width rows when authored and voted on. Lists use
readable multiline entry fields, clear completion controls and separated actions.
Creator visibility and identifiers stay under settings; participant cards show
only essential actions. Poll choices persist directly, List completion persists
directly, and Forms retain one explicit complete-response submission. All content preset selection is removed; unrelated add-on
templates remain intact.

[Discord's official Polls FAQ](https://support.discord.com/hc/en-us/articles/22163184112407-Polls-FAQ)
informed the self-contained selection, explicit vote submission and saved-choice
pattern. Groupi retains its own permissions, revision rules and visibility.
Event and Group post feeds now include inline poll cards with inline results;
existing poll detail, history and results URLs remain available. Result bars
explicitly represent current votes on the loaded page, never an overall total.

## Verification and handoff

The browser fixture in `packages/web/e2e/content-refinement` renders the actual
components and generated CSS with synthetic hook and router boundaries. It covers
both owners at 1440, 320, 375 and 390px, with long content, empty/filled states,
inline voting/results, failed saves, keyboard focus, repeated saves, reload,
creation cancellation, removal cancellation and Form choice edits/add/remove.
It creates no external records or notifications. Geologica is loaded locally;
body text uses the system fallback for Next's Inter font. Full authenticated Next
navigation/unmounting, backend persistence and screen-reader announcements remain
unverified by this local fixture. Existing source tests cover permissions,
versions/revisions, visibility and List retry identity. The existing Bring List
add-on and its claims are unchanged.

Source backup is a verified archive of the four original tool/question components
plus the exact immutable Git base for every tracked source. The archive SHA-256
is `3e9b27509d75771fc3e63391b9e3a80c2b483ee92cd66b92010041aa43e1923c`.
Workstation screenshots, reports and command logs are in the sibling task's
`artifacts/content-refinement` directory. See the final handoff for check results.

No push, merge, deployment, credential change or production operation is part of
this work. `vercel.json` suppresses automatic deployment for this exact branch.
Before any future publication, verify that suppression still applies and that
GitHub workflows remain source-check-only for the proposed branch/PR. The current
Vercel build command deploys Convex and must not run for this review branch.

The proposed release-note batch is one `@groupi/web` patch: “Refine Form and List
authoring and participation, remove content presets, and support inline Poll
voting and results in Event and Group feeds.” It is prepared for confirmation;
no changeset file has been created because repository workflow requires approval
of the exact summary/package/bump.

## Compact revision from supplied references

The two supplied Library images, resolved as `IMG_4348.jpeg` and `IMG_4349.jpeg`,
were materialized and visually inspected before revision. Their question-first
composition, trailing selection indicators, consistent option rows and concise
footer replace the earlier page-like card's badge, large spacing and disclosures.
The user subsequently removed the separate voting step: option selection now
saves directly, without a visible Save or History control. Results share the same
option rows instead of adding a second stack. Scope also includes compact Form
and List editing/participation. Historical data and compatibility routes remain.

Poll requests lock pending interactions until both the mutation completes and
authoritative revision updates; failure restores the acknowledged choice for a
deliberate retry. Version changes invalidate the lock appropriately. List edits
persist on Enter/blur, Escape cancels, and IME composition Enter does not submit.
Completion updates only after successful acknowledgement. Incomplete Forms do
not auto-submit.

The local comparison against `f941bb6c` records 64 layouts and 26 browser
assertions at desktop and 320/375/390px, with no overflow or browser errors. At
320px the four-option Poll shrank from 712px to 348px and its result state from
1334px to 417px. Long options still wrap, and touch targets remain usable.
Authenticated acceptance and publication remain unapproved. The earlier standalone
real Next navigation report applies to `f941bb6c`; it is not acceptance of this
new direct-save behavior. Refreshed real Next checks on `ddceaeee` passed 24
assertions with synthetic data; authenticated acceptance remains unverified. New
local evidence is in `compact-poll/` beside the original artifacts. Following the
user’s explicit image request, four current participant component captures were
saved to Library; their ids are retained in the delivery manifest.

The prior proposed release-note summary is superseded by one proposed
`@groupi/web` patch: “Streamline Form, List and Poll editing and participation;
save Poll votes and List completion directly, and keep compact inline results.”
No changeset is created without exact batch approval.

## Form actions and response access

The participant Form header now uses the shared ActionMenu/ActionMenuButton:
desktop dropdown/context menu and mobile drawer. Eligible managers see View
responses, which opens the existing results component in a dialog, and Edit form.
Saved-response authors retain their own confirmed removal action. Ordinary
participants have no response-view item, heading, result count, placeholder or
results subscription, even when the legacy shared-visibility canReview flag is
true. Both the action and dialog mount require canManage and canReview. Existing
backend result APIs and saved sharing contracts remain unchanged; no role is
broadened. Dialog close returns focus to the menu trigger.

The Poll results action uses 12px horizontal and 4px vertical padding. The shared
Button touch-target treatment retains a 44px browser target. Local browser checks
cover desktop and 320/375/390px drawers, keyboard/Escape, focus return, clean
drawer-to-dialog replacement, viewport bounds and unauthorized UI/query absence.
Screenshots remain local; none were uploaded for this correction.

## List types and participation settings

One creator-accessible settings dialog selects Simple list, Checklist or Bring
list. Active creators may configure their own list; managers retain oversight
and whole-list deletion authority. Who can add is Participants or Creator and
managers. Shared Checklists also choose who can complete: Participants, Item
authors and managers, or Creator and managers. Personal entry isolation always
wins over broader list options. Every write checks current membership, context,
list type, policy, version and applicable revision.

Missing list type resolves to Checklist; missing add policy preserves participant
adds. Shared completion defaults to Participants, the intentional expansion
requested by the user. Ordinary text editing/removal remains author/manager-only.
New completion metadata identifies the actual completing actor; reopening clears
active completion attribution, and old completed entries get no invented actor.
Simple mode hides completion and its attribution while preserving stored state.
Added-by text remains subtle and wraps with long names.

New native Bring Lists reuse groupListEntries with optional quantities and a
separate groupListClaims ledger scoped by tool/item/person. Multiple Event and
Group Bring Lists are supported. They use shared visibility, integer quantities,
transactional capacity checks and per-person revision guards; zero-quantity
tombstones prevent stale reclaims. Totals/own claims are exact; claimant names
are a bounded preview. Remote total or quantity changes do not unlock pending
claim requests. Account, item, list, Event and Group cleanup reaches the new
ledger. Former authors cannot delete Bring commitments after losing access.

Simple and Checklist switch in place without losing completion. Crossing the
Bring boundary requires an empty list; a populated list offers an explicitly
separate list with the requested type, retaining the source entries/claims. No
quantity or claim conversion is guessed. Existing Event Bring Lists still render
through EventCollectionFeatures under Lists and keep their original provider,
storage, item IDs, claims and deep links. Native List creation does not call the
legacy enable/update/disable lifecycle or send its reset notifications.

The additive schema uses optional state/entry fields plus one new claim table;
there is no data rewrite/migration. Published v2 REST payload projections remain
unchanged. Native web supports the new settings/claims; old clients are still
checked server-side. Code generation was attempted but the local environment has
no configured CONVEX_DEPLOYMENT. No target/credentials were configured and no
backend was deployed. Existing generated types derive from current source/schema;
type and contract checks cover the additive APIs. Canonical codegen and matching
authenticated runtime acceptance remain gates for separately authorized rollout.

The pending release-note batch now includes the shared ActionMenu/Poll-spacing
web patch and an additive List feature entry for Convex, shared hooks and web.
Exact summaries/package bumps still require approval; no release-note files have
been created.
