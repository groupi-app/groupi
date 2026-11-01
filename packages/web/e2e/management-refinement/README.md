# Event settings and Account/Developer browser fixture

Run from the repository root:

```sh
node packages/web/e2e/management-refinement/run.mjs
```

Playwright Chromium must be installed. `PLAYWRIGHT_CHANNEL=chrome` may select an
existing system Chrome installation. All resources are fulfilled in memory and
non-fixture requests are aborted; there is no listening frontend or backend server.
The fixture imports actual Event draft/provider/fields, Shared With, admission and
application settings, authorization identity rows, account connection panel and
shared menu/dialog components. Generated CSS and the bundled Geologica font render
unchanged. Only data/auth, file-upload and Next history boundaries are synthetic.

Evidence is written outside the checkout to
`../artifacts/management-refinement/event-settings-account/after`. The matrix covers
1440/320/375/390px, empty and populated states, long identity/group/question content,
expanded application configuration and searchable audience popovers. Behavioral
checks cover keyboard dismissal/focus, safe key details and revoke cancellation,
one Event Save/Revert across routes, failed atomic fixture save/retry, pending
duplicate suppression, conflicts, saved fixture reload, external navigation guards
and actual provider unmount/remount memory-draft recovery.

No credential issuance, revocation, registration, linking, disconnect or external
notification mutation is executed. Atomic rejection and authority are modeled at
the synthetic boundary and do not prove backend transaction enforcement. Full
Next route/layout integration, authenticated acceptance, real asset uploads,
username/email/passkey form providers and screen-reader announcements remain
independent verification gates. Account screenshots cover the actual Connected
Apps panel, not the complete Account settings route.
