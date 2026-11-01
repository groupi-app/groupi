# Contributing to Groupi

Use this guide for development setup, commits, changesets, and pull requests.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Changesets](#changesets)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

Follow [Getting started](docs/getting-started.md) for Node.js 22/24, the pinned
pnpm version, environment configuration, and native mobile prerequisites.
For outside contributions, fork the repository and clone your fork before
following that setup. Confirm the intended PR target with the maintainers;
`test` may contain work ahead of `main`.

## Making Changes

### Branch Naming

Use descriptive branch names with a prefix:

- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions or fixes

### Code Style

We use automated tools to maintain code quality:

```bash
pnpm check      # Lint, types, contracts, and formatting
pnpm lint:fix   # Auto-fix linting issues
pnpm exec prettier --write <changed-files> # Format edited files
pnpm test:run   # Run all tests
```

Always run `pnpm check` before submitting a PR.

### Architecture Guidelines

- **Backend first**: Start with Convex schema and functions
- **Shared logic**: Business logic goes in `packages/shared`
- **Platform UI**: Web in `packages/web`, mobile in `packages/mobile`
- **Real-time**: Use Convex queries/mutations, not useState + useEffect for data

See `AGENTS.md` and `docs/` for detailed architecture documentation.

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

```text
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, no code change
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `perf` - Performance improvement
- `test` - Adding or fixing tests
- `build` - Build system or dependencies
- `ci` - CI configuration
- `chore` - Other changes

### Scopes

- `web` - Web application
- `mobile` - Mobile application
- `shared` - Shared package
- `convex` - Backend
- `deps` - Dependencies

### Examples

```text
feat(web): add dark mode toggle
fix(convex): correct event query pagination
docs: update contributing guide
chore(deps): update convex
```

### Interactive Commits

Use `pnpm commit` for an interactive commit helper that guides you through the format.

## Changesets

We use [Changesets](https://github.com/changesets/changesets) to manage versions and changelogs. A changeset is a file that describes what changed and how it affects the version.

### When to Create a Changeset

| Change Type                  | Needs Changeset?       |
| ---------------------------- | ---------------------- |
| New feature                  | Yes                    |
| Bug fix                      | Yes                    |
| Breaking change              | Yes                    |
| Refactoring (no user impact) | No                     |
| Documentation only           | No                     |
| CI/tooling changes           | No                     |
| Dependency updates           | Depends on user impact |

### Creating a Changeset

1. Run the changeset command:

   ```bash
   pnpm changeset
   ```

2. Select which packages changed (use space to select)

3. Choose the semver bump type:
   - `patch` - Bug fixes, minor changes (0.0.X)
   - `minor` - New features, backwards compatible (0.X.0)
   - `major` - Breaking changes (X.0.0)

4. Write a summary (this appears in the CHANGELOG)

5. Commit the generated `.changeset/*.md` file with your PR

### Skipping Changesets

For PRs that don't need a changeset (docs, CI, refactoring), add the `skip-changeset` label to your PR. The CI check will pass automatically.

### How Releases Work

1. You create a PR with a changeset file
2. PR gets merged to `main`
3. GitHub Action creates a "Version Packages" PR automatically
4. When that PR is merged, versions bump and CHANGELOG updates

## Pull Request Process

1. **Make your changes** on a feature branch

2. **Create a changeset** (if needed):

   ```bash
   pnpm changeset
   ```

3. **Ensure all checks pass:**

   ```bash
   pnpm check
   pnpm test:run
   ```

4. **Push your branch** and create a PR on GitHub

5. **Fill out the PR template** completely

6. **Wait for review** from maintainers

### PR Requirements

- All CI checks must pass
- Changeset added (for user-facing changes) or `skip-changeset` label
- Tests added or updated (when applicable)
- Documentation updated (when applicable)
- Self-reviewed for code quality

## Reporting Bugs

Use the Bug Report issue template when creating issues.

Please include:

- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Browser/device information
- Screenshots if applicable

## Requesting Features

Use the Feature Request issue template.

Please include:

- Problem you're trying to solve
- Proposed solution
- Alternatives you've considered
- Which platform(s) this applies to

## Questions

- Check existing [Discussions](https://github.com/groupi-app/groupi/discussions) for answers
- Open a new discussion for general questions
- Read the documentation in `docs/` and `AGENTS.md`
