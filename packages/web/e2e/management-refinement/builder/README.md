# Add-on builder local verification

From the repository root:

```sh
pnpm --filter @groupi/web exec vitest run features/addons/authoring/builder.test.tsx
node packages/web/e2e/management-refinement/builder/run.mjs --before
node packages/web/e2e/management-refinement/builder/run.mjs
```

The browser fixture bundles the actual builder, stable provider, section editor,
preview components and generated CSS. Baseline source is pinned to
`62be9ebe98c7850f601d0048c1acdf80939f9e8e`. Results are written to
`../artifacts/management-refinement/builder/{before,after}`.

All resource requests are intercepted in Playwright. The fixture has synthetic
mutation hooks and a synthetic Next router; only the BuilderPage export from the
public authoring entry is bundled, excluding unrelated library/account initialization; the Monaco boundary is represented
by a controlled textarea. It never reads host environment configuration, signs
in, connects a Convex backend, saves/publishes real templates or sends messages.
Unused library hooks throw if accidentally mounted.

The matrix covers 1440, 320, 375 and 390 px widths with long section names/options,
empty and populated content, keyboard section opening, failed-save retry,
pending-save controls, successful checkpoints, raw/invalid/pending YAML mode
changes, Revert, cancelled navigation and native same-document Back/Forward.
All four preview contexts are exercised, including the named mobile sheet.

These checks verify actual component behavior and appearance at synthetic data,
router and Monaco boundaries. They do not establish authenticated Next route
unmounting, real server persistence, Monaco worker integration or native-device
screen reader behavior. Full route/backend acceptance remains a separate gate.
