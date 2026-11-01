# Groupi Script Policy

Use this policy to choose safe validation commands. Exact script definitions live in [root package.json](../../package.json) and each package's manifest; inspect those instead of copying command expansions into documentation.

## Table of Contents

- [Runtime boundaries](#runtime-boundaries)
- [Validation commands](#validation-commands)
- [Changesets and releases](#changesets-and-releases)

## Runtime boundaries

Agents may run local development servers, builds, start commands and preview servers for implementation and verification. Use `pnpm check` and one-shot tests for ordinary validation. Inspect scripts before running them: a local command that deploys Convex functions or changes a remote environment still requires the appropriate deployment authorization. This includes `pnpm convex:dev` and `pnpm convex:deploy`; local runtime permission does not authorize their remote effects.

A server's availability is evidence to establish, not an assumption. Follow [runtime readiness](../../docs/agents/workflow.md#runtime-readiness) at feature kickoff and before browser/native verification. Local runtime or hosted preview authorization does not authorize a production deployment or provisioning accounts/credentials outside the agreed scope. Other documents' server-start examples do not override this policy.

## Validation commands

| Purpose                        | Command                                                                     |
| ------------------------------ | --------------------------------------------------------------------------- |
| Lint, TypeScript, formatting   | `pnpm check`                                                                |
| All tests once                 | `pnpm test:run`                                                             |
| One platform/domain            | `pnpm test:convex`, `pnpm test:web`, `pnpm test:shared`, `pnpm test:mobile` |
| Coverage                       | `pnpm test:coverage` or package coverage script from its manifest           |
| Regenerate Convex declarations | `pnpm generate`                                                             |
| Lint fixes / token checks      | `pnpm lint:fix` / `pnpm lint:tokens`                                        |
| Formatting                     | `pnpm exec prettier --write <changed-files>`                                |

Run `pnpm generate` after schema, function signature, or function name changes; generate from the combined source when integrating branches. Prefer targeted behavioral tests during development, then required checks before handoff. Use one-shot commands instead of watch scripts (`test`, `test:watch`). Record failed, skipped, and unavailable checks distinctly from passing checks.

`pnpm format` writes across the repository: use targeted formatting in shared checkouts. `clean` and `clean:deps` remove dependencies/artifacts and reinstall; inspect their definitions and preserve other workers' work before considering them. `prepare` installs Husky hooks and normally runs during dependency installation.

## Changesets and releases

Follow [changeset approval](../../docs/agents/workflow.md#changeset-approval) for one reviewable batch, then [changeset mechanics](../../docs/changesets.md) for package selection and creation. Features, user-visible fixes, and breaking changes need a changeset; docs, tests, CI/tooling, and refactors without user impact do not. Create one per feature/fix, not per commit.

The pre-push hook and CI enforce changesets. For work that legitimately needs none, the documented bypasses are `SKIP_CHANGESET=1 git push` locally and the `skip-changeset` PR label in CI. Prefer the targeted bypass to `--no-verify`, which disables all hooks. See [enforcement details](../../docs/changesets.md#enforcement-mechanisms).

`pnpm changeset:status` inspects pending releases; `pnpm commit` provides the conventional-commit helper. Versioning/release scripts consume changesets and modify versions/changelogs (and may commit); they are release operations, not verification steps. Inspect the manifest and follow the authorized release scope, including [CLI release policy](../../docs/cli-release.md), before using them.

## Workspace source and packaging

Applications and checks consume shared TypeScript through package exports. Run
`pnpm check:workspace-source` to verify resolution without compiling shared.
Use `pnpm generate` for canonical Convex contracts; its wrapper anchors the CLI
at the repository root even when a package invokes it.

Distribution uses pnpm publication overrides. CI compiles shared, runs `pnpm
pack`, and passes the tarball to `scripts/check-shared-package.mjs` to verify
compiled exports. Agents validate source with permitted checks and leave this
compilation to CI under the build restrictions above.
