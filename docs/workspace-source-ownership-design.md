# Workspace Source Ownership Design

Agreed source-consumption and generated-output policy for the repository.
Implemented through package source exports and pnpm publication overrides.

## Accepted decisions

- Workspace applications, backend consumers, tests, and tooling consume shared
  TypeScript source through consistent package entry points. They must not depend
  on checked-in shared build outputs or choose different implementations for
  root imports and subpath imports.
- Preserve the shared package's distribution capability and compiled CommonJS,
  ES module, and declaration exports. Generate these artifacts for distribution
  and validate them separately from workspace source consumption. Repository
  evidence alone does not establish whether external consumers exist.
- Remove disposable build outputs and coverage reports from version control only
  after their consumers and generation paths are accounted for. Ignore those
  outputs so routine checks do not reintroduce them.
- Retain canonical `convex/_generated` and component-owned
  `convex/betterAuth/_generated` contracts required by existing workflows.
  Remove duplicate generated trees only after confirming they have no consumers
  and correcting any generation paths that could recreate them.
- Remove aliases for nonexistent packages and consolidate duplicate formatting
  configuration, preserving the currently effective formatting behavior.

## Verification and implementation obligations

- Account for TypeScript, Next, Metro, Vitest, token-generation scripts, backend
  bundling, and deployment consumers. Partial alias updates are insufficient.
- Standardize resolution and untrack disposable outputs as a coordinated change.
  A clean checkout must run permitted checks without a shared prebuild or stale
  local artifacts.
- Verify distribution artifacts through the packaging/CI path so source-first
  workspace behavior does not hide missing JavaScript or declarations in the
  distributable package.
- Audit `convex/convex/_generated` and `packages/web/convex/_generated` separately
  from canonical generated contracts; an empty generated function map is evidence
  to investigate, not sufficient proof that deletion is safe.
- Keep current workspace roots. Moving applications into an `apps/` directory or
  relocating Convex is not needed to achieve the agreed ownership improvements.

## Resolution and distribution

`packages/shared/package.json` owns every workspace entry point. Its ordinary
exports point to TypeScript source; `publishConfig` overrides the entry points
with compiled CommonJS, ES modules, and declarations when `pnpm pack` runs.
The package declares ES module semantics for TypeScript tooling. Distribution
uses tsup’s matching `.js` / `.d.ts` ES module and `.cjs` / `.d.cts` CommonJS
outputs, with declarations selected per module condition. Use pnpm for packaging
so these overrides apply. Next transpiles the package;
Expo/Metro watches workspace source; TypeScript, Vitest, token scripts, and Convex
resolve the same manifest without shared source aliases or a prebuild.

`pnpm check:workspace-source` checks consumer resolution and duplicate output
absence. CI compiles shared through its existing build step, packs it, then runs
`scripts/check-shared-package.mjs` against the tarball to check compiled exports,
declarations, JavaScript syntax, and imports in both module formats using installed peers. That check does not itself compile anything.

Run `pnpm generate` from any working directory through the package scripts. The
wrapper anchors Convex codegen at the repository root. Canonical application and
Better Auth component generated contracts remain versioned. Duplicate generated
trees and disposable shared build/coverage outputs are ignored.
