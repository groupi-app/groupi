---
name: dependency-check
description: Analyze Groupi dependency upgrades and Dependabot pull requests for breaking changes, affected usage, patch or override conflicts, lockfile consistency, CI failures, and safe remediation. Use for dependency bump reviews, upgrade planning, or fixing compatibility blockers caused by an update.
---

# Dependency Check

Assess an upgrade against primary release documentation and this repository's actual usage. Do not change a branch, commit, or push unless the user explicitly requests remediation.

## Gather the Upgrade

Accept either a PR number or a package with current and target versions.

For a PR:

1. Use `gh pr view`, `gh pr diff`, and `gh pr checks` to collect title, body, head branch, files, package changes, and CI status.
2. Distinguish direct dependencies from lockfile-only transitive changes.
3. Include GitHub Action version changes in the inventory even when npm analysis does not apply.

For a package:

1. Read every workspace `package.json` that declares it.
2. Resolve an omitted target from the authoritative registry.
3. State when the requested range is ambiguous.

Do not check out a PR branch merely to inspect it. Preserve the current worktree.

## Analyze Each Package

Delegate independent packages to read-only `reviewer` agents when multiple upgrades can be analyzed in parallel.

For each package:

1. Classify the semantic-version bump.
2. Read official release notes, changelogs, migration guides, and package documentation for every version in range. Use primary sources for technical claims and link them in the report.
3. Search the repository for imports, APIs, config keys, peer dependencies, and runtime behavior affected by the changes.
4. Inspect `patches/`, `patchedDependencies`, and `pnpm.overrides`. Decide whether each entry remains valid, needs regeneration, or can be removed because upstream fixed it.
5. Inspect lockfile changes for inconsistent resolutions or unexpected packages.
6. Map existing CI or type errors to the upgrade instead of assuming causation.
7. Recommend `safe-to-merge`, `needs-testing`, `needs-changes`, or `do-not-merge` with evidence.

Treat import renames, signature updates, obsolete patches, version-only overrides, and lockfile regeneration as potentially mechanical. Treat behavior changes, security-model changes, and architecture decisions as manual.

## Apply Explicitly Requested Fixes

Only modify the PR when the user asked for fixes.

1. Confirm the target branch and worktree are safe. If the current worktree is dirty or on another branch, use an isolated worktree or stop rather than overwriting user changes.
2. Apply only mechanical compatibility fixes. Never skip or weaken tests.
3. Regenerate patches or the lockfile with `pnpm` when needed.
4. Run `pnpm install --frozen-lockfile`, `pnpm check`, and `pnpm test:run`.
5. Commit and push only when the user authorized those external changes. Stage only files belonging to the upgrade.

## Report

Return the overall recommendation, a per-package result, relevant release-note links, breaking changes that affect Groupi, patch/override conflicts, validation results, remaining blockers, and concrete next actions. Distinguish facts from inferences.
