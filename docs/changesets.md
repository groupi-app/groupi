# Changesets Guide

Comprehensive guide for using Changesets in the Groupi monorepo for both developers and AI agents.

## Table of Contents

- [Overview](#overview)
- [When to Create a Changeset](#when-to-create-a-changeset)
- [Creating a Changeset](#creating-a-changeset)
- [Enforcement Mechanisms](#enforcement-mechanisms)
- [Skipping Changeset Checks](#skipping-changeset-checks)
- [How Releases Work](#how-releases-work)
- [AI Agent Rules](#ai-agent-rules)
- [Common Scenarios](#common-scenarios)
- [Troubleshooting](#troubleshooting)

## Overview

Groupi uses [Changesets](https://github.com/changesets/changesets) to:

1. Track what changed between releases
2. Determine version bumps (patch/minor/major)
3. Generate CHANGELOG entries automatically
4. Coordinate versioning across the monorepo

All `@groupi/*` packages are **linked** - they version together as a single unit.

## When to Create a Changeset

| Change Type                      | Needs Changeset? | Example                      |
| -------------------------------- | ---------------- | ---------------------------- |
| New feature                      | Yes              | Adding dark mode             |
| Bug fix                          | Yes              | Fixing login redirect        |
| Breaking change                  | Yes              | Changing API response format |
| Performance improvement          | Yes              | Optimizing database queries  |
| Refactoring (no behavior change) | No               | Renaming internal variables  |
| Documentation only               | No               | Updating README              |
| CI/tooling changes               | No               | Adding new lint rule         |
| Test additions                   | No               | Adding missing tests         |
| Dependency updates (internal)    | No               | Bumping dev dependencies     |
| Dependency updates (user-facing) | Maybe            | Upgrading React version      |

**Rule of thumb:** If a user would notice the change, create a changeset.

## Creating a Changeset

### Interactive Method (Recommended)

```bash
pnpm changeset
```

This prompts you to:

1. **Select packages** - Use arrow keys and space to select affected packages
2. **Choose bump type**:
   - `patch` (0.0.X) - Bug fixes, minor improvements
   - `minor` (0.X.0) - New features, backwards compatible
   - `major` (X.0.0) - Breaking changes
3. **Write summary** - This appears in the CHANGELOG

### Example Session

```
$ pnpm changeset

Which packages would you like to include?
  ◯ @groupi/convex
  ◉ @groupi/web
  ◯ @groupi/shared
  ◯ @groupi/mobile

Which packages should have a major bump?
  (none selected)

Which packages should have a minor bump?
  ◉ @groupi/web

Please enter a summary for this change:
  Add dark mode toggle to settings page

Summary: Add dark mode toggle to settings page
```

This creates a file like `.changeset/happy-pandas-dance.md`:

```markdown
---
'@groupi/web': minor
---

Add dark mode toggle to settings page
```

### Manual Method

Create a file in `.changeset/` with a random name (e.g., `.changeset/my-change.md`):

```markdown
---
'@groupi/web': patch
'@groupi/shared': patch
---

Fix event date formatting in UTC timezones
```

## Enforcement Mechanisms

### Local Enforcement (Pre-Push Hook)

A pre-push git hook checks for changesets before you push:

```bash
git push origin my-feature

# If no changeset found:
# ⚠️  No changeset found!
# You have source code changes but no changeset file.
```

The hook runs automatically and:

- Compares your branch against `origin/main`
- Checks for source code changes in `packages/` or `convex/`
- Requires a changeset file if source code changed

### CI Enforcement (Pull Request Check)

The `changeset-check.yml` workflow runs on all PRs to `main`:

- Fails if no changeset is found
- Can be skipped with the `skip-changeset` label

## Skipping Changeset Checks

### When to Skip

Skip changeset checks for changes that don't affect users:

- Documentation updates
- Test additions/fixes
- CI/tooling configuration
- Refactoring with no behavior change
- Development-only dependencies

### How to Skip

#### Method 1: Environment Variable (Local)

```bash
SKIP_CHANGESET=1 git push
```

#### Method 2: No-Verify Flag (Local)

```bash
git push --no-verify
```

**Note:** This also skips other git hooks.

#### Method 3: PR Label (CI)

Add the `skip-changeset` label to your pull request. The CI check will pass automatically.

#### Auto-Skipped Branches

These branch patterns automatically skip the check:

- `*release*`
- `*version*`
- `chore/release*`
- `dependabot/*`

## How Releases Work

### Automated Flow

1. **Developer creates PR** with changeset file
2. **PR gets reviewed and merged** to `main`
3. **GitHub Action runs** and creates a "Version Packages" PR
4. **Maintainer merges** the version PR
5. **Packages are versioned** and CHANGELOG is updated

### Version PR Contents

The automated "Version Packages" PR includes:

- Version bumps in all `package.json` files
- Updated `CHANGELOG.md` files
- Removal of consumed changeset files

### Commit Message Format

Version commits use: `chore(release): version packages`

This is enforced in `commitlint.config.js` with the `release` scope.

## AI Agent Rules

### Do NOT Auto-Create Changesets

AI agents must NOT create changeset files automatically. The summary should reflect the developer's intent, not be generated.

**Correct behavior:**

```
After completing a user-facing change, remind the user:

"This is a user-facing change. Run `pnpm changeset` to create a changeset
describing what changed for the CHANGELOG."
```

### When to Remind

Remind the user to create a changeset when:

- Adding a new feature
- Fixing a bug
- Making a breaking change
- Any change a user would notice

### When NOT to Remind

Don't mention changesets for:

- Documentation updates
- Test additions
- Refactoring without behavior change
- CI/tooling changes
- Reading/exploring code

### Checking Status

AI agents can check changeset status:

```bash
pnpm changeset:status
```

This shows pending changesets and what versions would bump.

## Common Scenarios

### Scenario 1: Simple Bug Fix

```bash
# 1. Make your fix
git checkout -b fix/login-redirect

# 2. Create changeset
pnpm changeset
# Select: @groupi/web
# Bump: patch
# Summary: Fix redirect loop on login page

# 3. Commit and push
git add .
git commit -m "fix(web): correct login redirect logic"
git push
```

### Scenario 2: Multi-Package Feature

```bash
# 1. Implement feature across packages
pnpm changeset
# Select: @groupi/web, @groupi/shared, @groupi/convex
# Bump: minor (for @groupi/web), patch (for others)
# Summary: Add real-time notifications for event updates
```

### Scenario 3: Breaking Change

```bash
pnpm changeset
# Select: @groupi/convex
# Bump: major
# Summary: BREAKING: Change event API response format

# Include migration notes in description
```

### Scenario 4: Documentation Only

```bash
# No changeset needed, skip the check
git push --no-verify
# Or add skip-changeset label to PR
```

### Scenario 5: Refactoring

```bash
# Internal refactoring without behavior change
SKIP_CHANGESET=1 git push
```

## Troubleshooting

### "No changeset found" Error

**Problem:** Pre-push hook or CI fails with missing changeset.

**Solutions:**

1. Create a changeset: `pnpm changeset`
2. Skip if not user-facing: `SKIP_CHANGESET=1 git push`
3. Add `skip-changeset` label to PR

### Changeset Not Being Detected

**Problem:** You created a changeset but the check still fails.

**Check:**

1. File is in `.changeset/` directory
2. File has `.md` extension
3. File is committed (not just staged)
4. File is not named `README.md` or `config.json`

### Wrong Package Selected

**Problem:** Selected wrong package in changeset.

**Fix:** Edit the changeset file directly:

```markdown
---
'@groupi/web': minor # Change this line
---

Your summary here
```

### Multiple Changesets

**Problem:** Multiple changes need different descriptions.

**Solution:** Create multiple changeset files. Each becomes a separate CHANGELOG entry.

```bash
pnpm changeset  # First change
pnpm changeset  # Second change
```

### Viewing Pending Changes

```bash
pnpm changeset:status
```

Shows:

- Which packages have changesets
- What version bumps are pending
- Summary of all changes

## Quick Reference

| Command                     | Purpose                    |
| --------------------------- | -------------------------- |
| `pnpm changeset`            | Create a new changeset     |
| `pnpm changeset:status`     | View pending changesets    |
| `SKIP_CHANGESET=1 git push` | Skip local changeset check |
| `git push --no-verify`      | Skip all git hooks         |

| PR Label         | Effect                  |
| ---------------- | ----------------------- |
| `skip-changeset` | Skip CI changeset check |

| Branch Pattern   | Auto-Skipped?           |
| ---------------- | ----------------------- |
| `*release*`      | Yes                     |
| `*version*`      | Yes                     |
| `dependabot/*`   | Yes                     |
| Feature branches | No (changeset required) |
