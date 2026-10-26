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
Secondary visibility, identifiers and retention explanations live in keyboard
operable disclosures. All content preset selection is removed; unrelated add-on
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
