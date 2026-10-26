# Content composition browser fixture

Run `node packages/web/e2e/content-refinement/run.mjs --before` from the repository
root for the `5832fe64` baseline, or omit `--before` for the current checkout.
Set `PLAYWRIGHT_CHANNEL=chrome` to use an existing Chrome installation.

The fixture bundles the actual Form, List, Poll and question components in memory
with the real generated Tailwind CSS. Playwright fulfills every resource request;
external requests are aborted. There is no listening server, live authentication,
Convex backend, external notification or user data. Synthetic owner hooks cover
both Event and Group contexts. Mutation state persists in fixture localStorage.

Screenshots and a JSON report are written outside the checkout to
`../artifacts/content-refinement/{before,after}`. The matrix includes desktop,
320, 375 and 390 pixel layouts, new and populated editors, participants, Poll
results, and empty collections/results. Behavioral assertions cover repeated
Form/Poll saves and reload, List addition and reload, keyboard focus, and
same-document history traversal.

These checks establish rendered component appearance and behavior at mocked
router/data boundaries. They do not establish deployed Next routing/unmounting,
real backend persistence, authenticated permissions, native behavior or observed
screen reader announcements. Headings load the bundled Geologica font. Body text uses the system fallback
because Inter is loaded through Next. Existing unit tests remain the
source of coverage for revisions, stale requests and access restrictions.

## Compact content revision

Use `node packages/web/e2e/content-refinement/run.mjs --compact --before` for
baseline `f941bb6c`, then omit `--before` for the current revision. These runs write
only to `../artifacts/content-refinement/compact-poll/{before,after}` and preserve
the earlier refinement evidence. The compact matrix adds the reference-sized
pizza question with four short options alongside the existing long content,
article height/width measurements, both owner contexts, and revised Form/List
editor/participant screenshots. Revision interaction checks cover direct Poll
voting and keyboard behavior, independent radio groups, results reusing the same option rows,
private review gating, repeated saves and synthetic persistence.

## Shared Form actions correction

Run `node packages/web/e2e/content-refinement/run.mjs --action-menu` for the
shared Form action menu and manager response dialog regression. Evidence is stored
in `../artifacts/content-refinement/action-menu-correction/after`.

This fixture uses the real shared `ActionMenu`, `ActionMenuButton`, `useActionMenu`,
`useMobile`, Radix and Vaul components. Only data/owner hooks and Next boundaries
are synthetic. It verifies the desktop dropdown and responsive mobile drawers,
keyboard opening, Escape dismissal, focus restoration, lazy manager response
queries, drawer-to-dialog replacement, dialog closure and three denied response
review cases. Screenshots and bounds wait for actual UI animations to finish.
Poll result action measurements include computed inline/block padding and bounds.
