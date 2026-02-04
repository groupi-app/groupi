# Contributing to Groupi

Thank you for your interest in contributing to Groupi! This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10+
- Convex CLI (`pnpm add -g convex`)
- Git

### Development Setup

1. **Fork the repository** on GitHub

2. **Clone your fork:**

   ```bash
   git clone https://github.com/YOUR_USERNAME/groupi.git
   cd groupi
   ```

3. **Install dependencies:**

   ```bash
   pnpm install
   ```

4. **Copy environment template:**

   ```bash
   cp .env.example .env.local
   ```

5. **Set up Convex** (follow prompts to create a new project):

   ```bash
   npx convex dev
   ```

6. **Start development** (in a new terminal):

   ```bash
   pnpm dev
   ```

7. **Open your browser** at http://localhost:3000

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
pnpm check      # Run all checks (lint, type-check, format)
pnpm lint:fix   # Auto-fix linting issues
pnpm format     # Format code with Prettier
pnpm test:run   # Run all tests
```

Always run `pnpm check` before submitting a PR.

### Architecture Guidelines

- **Backend first**: Start with Convex schema and functions
- **Shared logic**: Business logic goes in `packages/shared`
- **Platform UI**: Web in `packages/web`, mobile in `packages/mobile`
- **Real-time**: Use Convex queries/mutations, not useState + useEffect for data

See `CLAUDE.md` and `docs/` for detailed architecture documentation.

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
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

```
feat(web): add dark mode toggle
fix(convex): correct event query pagination
docs: update contributing guide
chore(deps): update convex to v1.32
```

### Interactive Commits

Use `pnpm commit` for an interactive commit helper that guides you through the format.

## Pull Request Process

1. **Create a changeset** for your changes:

   ```bash
   pnpm changeset
   ```

2. **Ensure all checks pass:**

   ```bash
   pnpm check
   pnpm test:run
   ```

3. **Push your branch** and create a PR on GitHub

4. **Fill out the PR template** completely

5. **Wait for review** from maintainers

### PR Requirements

- All CI checks must pass
- Changeset added (for user-facing changes)
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

## Questions?

- Check existing [Discussions](../../discussions) for answers
- Open a new discussion for general questions
- Read the documentation in `docs/` and `CLAUDE.md`

## Recognition

Contributors are recognized in release notes and the project README.

Thank you for contributing to Groupi!
