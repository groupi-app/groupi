# Form, List and Poll composition

Local UI refinement from test `5832fe64e0ad96c8322b850befada4b8a2cf27f5`, on
`codex/content-pages-refinement`. No backend contracts, data or migrations change.

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
