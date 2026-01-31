# Groupi pnpm Scripts Reference

This document provides detailed explanations of all available pnpm scripts in the Groupi monorepo.

## AI Agent Restrictions

**CRITICAL: The following rules MUST be followed by AI agents:**

### Prohibited Commands (NEVER Run These)

AI agents are **strictly prohibited** from running the following commands:

| Prohibited Command   | Reason                                        |
| -------------------- | --------------------------------------------- |
| `pnpm dev`           | Long-running process, user manages separately |
| `pnpm dev:web`       | Long-running process, user manages separately |
| `pnpm dev:convex`    | Long-running process, user manages separately |
| `pnpm dev:shared`    | Long-running process, user manages separately |
| `pnpm dev:mobile`    | Long-running process, user manages separately |
| `pnpm dev:all`       | Long-running process, user manages separately |
| `pnpm build`         | Time-consuming, not needed for validation     |
| `pnpm build:web`     | Time-consuming, not needed for validation     |
| `pnpm build:convex`  | Time-consuming, not needed for validation     |
| `pnpm build:shared`  | Time-consuming, not needed for validation     |
| `pnpm build:mobile`  | Time-consuming, not needed for validation     |
| `pnpm start`         | Requires build, long-running process          |
| `pnpm preview`       | Long-running process                          |
| `pnpm convex:dev`    | Long-running process, user manages separately |
| `pnpm convex:deploy` | Deploys to production, user-initiated only    |

### Required Assumptions

- **Always assume a development server is already running** - The user manages `pnpm dev` or `pnpm dev:all` in a separate terminal
- **Never start dev servers** - Starting servers blocks the terminal and interferes with the user's workflow
- **Never run builds to verify code** - Builds are slow and unnecessary for validation

### How to Validate Code Changes

When you need to verify that code changes are correct, use:

```bash
pnpm check    # Runs lint + type-check + format verification
```

This command validates:

- ESLint rules pass
- TypeScript types are correct
- Code formatting is correct

For additional validation:

```bash
pnpm test:run           # Run all tests once
pnpm generate           # Regenerate Convex types after schema changes
```

### Permitted Commands Summary

| Command            | When to Use                                 |
| ------------------ | ------------------------------------------- |
| `pnpm check`       | Validate code changes (lint, types, format) |
| `pnpm generate`    | After modifying Convex schema or functions  |
| `pnpm test:run`    | Run tests to verify functionality           |
| `pnpm test:web`    | Run web-specific tests                      |
| `pnpm test:convex` | Run Convex backend tests                    |
| `pnpm test:shared` | Run shared package tests                    |
| `pnpm lint:fix`    | Auto-fix linting issues                     |
| `pnpm lint:tokens` | Check for non-token Tailwind class usage    |
| `pnpm format`      | Format code with Prettier                   |

## Table of Contents

- [Development Scripts](#development-scripts)
- [Build Scripts](#build-scripts)
- [Convex Scripts](#convex-scripts)
- [Testing Scripts](#testing-scripts)
- [Code Quality Scripts](#code-quality-scripts)
- [Utility Scripts](#utility-scripts)
- [Quick Reference](#quick-reference)

## Development Scripts

> **⛔ AI AGENTS: All commands in this section are PROHIBITED. Assume the user has a dev server running.**

### `pnpm dev`

**Command:** `turbo dev --filter=@groupi/web --filter=@groupi/convex --filter=@groupi/shared`

Starts the primary development environment for web development. Runs three packages concurrently:

- **@groupi/web**: Next.js development server (typically on port 3000)
- **@groupi/convex**: Convex backend in development mode with hot reloading
- **@groupi/shared**: TypeScript watch mode for shared business logic

**Use when:** You're working on web features and need the full development stack.

### `pnpm dev:web`

**Command:** `turbo dev --filter=@groupi/web`

Starts only the Next.js web application development server. Does not start Convex or shared package watchers.

**Use when:** You only need the web frontend running (Convex may already be running separately).

### `pnpm dev:convex`

**Command:** `turbo dev --filter=@groupi/convex`

Starts only the Convex development server with hot reloading for backend functions.

**Use when:** You're working exclusively on Convex backend functions.

### `pnpm dev:shared`

**Command:** `turbo dev --filter=@groupi/shared`

Starts TypeScript watch mode for the shared package only.

**Use when:** You're developing shared business logic and want fast TypeScript feedback.

### `pnpm dev:mobile`

**Command:** `cd packages/mobile && pnpm dev`

Starts the Expo development server for the React Native mobile application.

**Use when:** You're working on mobile-specific features or testing on mobile devices/simulators.

### `pnpm dev:all`

**Command:** `concurrently "pnpm dev" "pnpm dev:mobile" --names "web,mobile" --prefix-colors "blue,green"`

Starts the complete development environment including both web and mobile platforms. Runs:

- Web development stack (Next.js + Convex + shared)
- Mobile development server (Expo)

Output is color-coded: blue for web, green for mobile.

**Use when:** You're developing cross-platform features and need to test on both web and mobile simultaneously.

## Build Scripts

> **⛔ AI AGENTS: All commands in this section are PROHIBITED. Use `pnpm check` to validate code instead.**

### `pnpm build`

**Command:** `turbo build --filter=@groupi/web --filter=@groupi/shared`

Builds the web application and shared package for production deployment.

**Use when:** Preparing for production deployment or testing production builds locally.

### `pnpm build:web`

**Command:** `turbo build --filter=@groupi/web`

Builds only the Next.js web application for production.

**Use when:** You only need to build the web frontend.

### `pnpm build:convex`

**Command:** `turbo build --filter=@groupi/convex`

Runs Convex build/validation for the backend functions.

**Use when:** Validating Convex functions before deployment.

### `pnpm build:shared`

**Command:** `turbo build --filter=@groupi/shared`

Builds the shared package (TypeScript compilation).

**Use when:** You need to compile the shared package independently.

### `pnpm build:mobile`

**Command:** `cd packages/mobile && pnpm build:android`

Builds the Android version of the mobile application.

**Use when:** Creating an Android APK or AAB for distribution.

### `pnpm start`

**Command:** `turbo start --filter=@groupi/web`

Starts the production Next.js server (requires `pnpm build:web` first).

**Use when:** Testing the production build locally.

### `pnpm preview`

**Command:** `concurrently "npx convex dev" "pnpm build:web && pnpm start" --names "convex,next" --prefix-colors "yellow,cyan"`

Runs a production preview environment with Convex in development mode. Useful for testing production builds against the development backend.

**Use when:** Testing production builds with live Convex data.

## Convex Scripts

> **AI AGENTS:** `pnpm convex:dev` and `pnpm convex:deploy` are PROHIBITED. Only `pnpm generate` is permitted.

### `pnpm convex:dev`

**Command:** `pnpx convex dev`

Starts the Convex development server. This:

- Syncs your schema and functions to your development deployment
- Watches for changes and hot-reloads
- Generates TypeScript types in `convex/_generated/`

**Use when:** Starting backend development or when you need Convex running independently.

### `pnpm convex:deploy`

**Command:** `pnpx convex deploy`

Deploys Convex functions and schema to production.

**Use when:** Deploying backend changes to production. **Caution:** This affects your live application.

### `pnpm generate`

**Command:** `pnpx convex codegen`

Regenerates Convex TypeScript types without starting the development server. Updates files in `convex/_generated/` based on your current schema and functions.

**Use when:**

- After making schema changes and you need updated types
- When type inference seems broken
- After pulling changes that modified the schema
- When `convex/_generated/` is out of sync

**Important:** Run this after any changes to:

- `convex/schema.ts`
- Query/mutation function signatures
- New or renamed Convex functions

## Testing Scripts

### `pnpm test`

**Command:** `turbo test`

Runs all tests across all packages using Vitest in watch mode.

**Use when:** Active development with continuous test feedback.

### `pnpm test:run`

**Command:** `turbo test:run`

Runs all tests once (no watch mode). Exits after completion.

**Use when:** CI/CD pipelines or one-time test verification.

### `pnpm test:watch`

**Command:** `turbo test:watch`

Explicitly runs tests in watch mode across all packages.

**Use when:** You want continuous test feedback during development.

### `pnpm test:web`

**Command:** `turbo test:run --filter=@groupi/web`

Runs tests only for the web package.

**Use when:** Testing web-specific components and hooks.

### `pnpm test:convex`

**Command:** `turbo test:run --filter=@groupi/convex`

Runs tests only for Convex backend functions.

**Use when:** Testing backend logic, queries, and mutations.

### `pnpm test:shared`

**Command:** `turbo test:run --filter=@groupi/shared`

Runs tests only for the shared package.

**Use when:** Testing cross-platform business logic.

### `pnpm test:mobile`

**Command:** `turbo test:run --filter=@groupi/mobile`

Runs tests only for the mobile package.

**Use when:** Testing mobile-specific components.

### `pnpm test:coverage`

**Command:** `turbo test:coverage`

Runs all tests with code coverage reporting.

**Use when:** Checking test coverage across the codebase.

### `pnpm test:coverage:web`

**Command:** `turbo test:coverage --filter=@groupi/web`

Runs web package tests with coverage reporting.

### `pnpm test:coverage:mobile`

**Command:** `turbo test:coverage --filter=@groupi/mobile`

Runs mobile package tests with coverage reporting.

### `pnpm test:coverage:shared`

**Command:** `turbo test:coverage --filter=@groupi/shared`

Runs shared package tests with coverage reporting.

## Code Quality Scripts

### `pnpm lint`

**Command:** `turbo lint`

Runs ESLint across all packages to check for code quality issues.

**Use when:** Checking for linting errors before committing.

### `pnpm lint:fix`

**Command:** `turbo lint:fix`

Runs ESLint with automatic fixing for auto-fixable issues.

**Use when:** Automatically fixing linting errors.

### `pnpm format`

**Command:** `prettier --write .`

Formats all files in the repository using Prettier.

**Use when:** Formatting code after making changes.

### `pnpm format:check`

**Command:** `prettier --check .`

Checks if all files are properly formatted without making changes.

**Use when:** Verifying formatting in CI/CD or before committing.

### `pnpm type-check`

**Command:** `turbo type-check`

Runs TypeScript type checking across all packages without emitting files.

**Use when:** Verifying type safety across the codebase.

### `pnpm check`

**Command:** `pnpm lint && pnpm type-check && pnpm format:check`

Runs all code quality checks in sequence: linting, type checking, and format verification.

**Use when:** Before committing or pushing changes. This is the comprehensive quality gate.

## Utility Scripts

### `pnpm clean`

**Command:** `turbo clean && rm -rf node_modules && pnpm install`

Cleans all build artifacts, removes node_modules, and reinstalls dependencies.

**Use when:** Resolving dependency issues or starting fresh.

### `pnpm clean:deps`

**Command:** `find . -name node_modules -type d -exec rm -rf {} + && pnpm install`

Removes all node_modules directories recursively and reinstalls.

**Use when:** Deep cleaning of all dependencies across the monorepo.

### `pnpm prepare`

**Command:** `husky`

Sets up Husky git hooks. Runs automatically after `pnpm install`.

**Note:** This is typically run automatically, not manually.

## Quick Reference

| Task                    | Command              |
| ----------------------- | -------------------- |
| Start web development   | `pnpm dev`           |
| Start all platforms     | `pnpm dev:all`       |
| Start Convex only       | `pnpm convex:dev`    |
| Start mobile only       | `pnpm dev:mobile`    |
| Regenerate Convex types | `pnpm generate`      |
| Run all tests           | `pnpm test:run`      |
| Run quality checks      | `pnpm check`         |
| Fix linting issues      | `pnpm lint:fix`      |
| Format code             | `pnpm format`        |
| Build for production    | `pnpm build`         |
| Deploy Convex           | `pnpm convex:deploy` |
| Clean and reinstall     | `pnpm clean`         |

## Common Workflows

### Starting Fresh Development Session

```bash
pnpm dev          # Web + Convex + Shared
# OR
pnpm dev:all      # Web + Convex + Shared + Mobile
```

### After Schema Changes

```bash
pnpm generate     # Regenerate Convex types
```

### Before Committing

```bash
pnpm check        # Run lint, type-check, and format verification
pnpm test:run     # Run all tests
```

### Fixing Code Quality Issues

```bash
pnpm lint:fix     # Auto-fix linting issues
pnpm format       # Format all files
```

### Production Deployment

```bash
pnpm build              # Build web and shared packages
pnpm convex:deploy      # Deploy Convex to production
```
